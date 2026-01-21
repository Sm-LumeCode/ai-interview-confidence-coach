"""
Fast Interview Answer Evaluation System
========================================
- Completes in <2 seconds (including 1 LLM call for context)
- Technical Score: LLM context validation + keyword + depth
- Communication Score: Grammar rules (no LLM)
- Confidence Score: Derived from communication + fillers
- Hard gate for invalid answers
- Deterministic and explainable
"""

import re
from typing import Dict, List, Tuple
from collections import Counter
import requests
import json

# Ollama configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma:2b"

# ============================================================================
# HARD GATE - Detect Invalid Answers
# ============================================================================

def check_hard_gate(answer: str) -> Tuple[bool, str]:
    """
    Check if answer passes basic quality threshold.
    
    Returns: (passes_gate, reason)
    """
    words = answer.split()
    
    # Gate 1: Too short
    meaningful_words = [w for w in words if len(w) > 2 and w.lower() not in {'the', 'and', 'but', 'for', 'with'}]
    if len(meaningful_words) < 5:
        return False, "too_short"
    
    # Gate 2: Excessive repetition
    word_counts = Counter(w.lower() for w in words if len(w) > 3)
    if word_counts:
        max_repetition = max(word_counts.values())
        if max_repetition > len(words) * 0.3:  # More than 30% same word
            return False, "excessive_repetition"
    
    # Gate 3: No verb detected (simple check)
    common_verbs = {'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did', 
                    'can', 'could', 'will', 'would', 'should', 'may', 'might', 'use', 'uses',
                    'work', 'works', 'help', 'helps', 'make', 'makes', 'provide', 'provides'}
    
    answer_lower = answer.lower()
    has_verb = any(verb in answer_lower.split() for verb in common_verbs)
    
    # Also check for -ing, -ed endings (simple heuristic)
    has_verb = has_verb or any(word.endswith(('ing', 'ed')) for word in words if len(word) > 4)
    
    if not has_verb:
        return False, "no_verb"
    
    return True, "valid"


# ============================================================================
# LLM CONTEXT VALIDATION (FAST - Only for technical score)
# ============================================================================

def validate_context_with_llm(question: str, answer: str, timeout: int = 3) -> str:
    """
    Fast LLM call to validate if answer addresses the question correctly.
    
    Returns: "YES" | "PARTIAL" | "NO"
    """
    
    prompt = f"""You are evaluating if a candidate's answer correctly addresses the interview question.

Question: {question}

Answer: {answer}

Analyze if the answer:
1. Addresses the question topic
2. Provides relevant technical information
3. Shows understanding of the concept

Respond with ONLY ONE WORD:
- YES (if answer is mostly correct and relevant)
- PARTIAL (if answer is somewhat relevant but incomplete)
- NO (if answer is off-topic or completely wrong)

Response:"""

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "temperature": 0,
        "num_predict": 5  # Only need 1 word
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        
        if response.status_code != 200:
            print(f"⚠️ LLM validation failed (status {response.status_code}), using fallback")
            return "PARTIAL"
        
        raw_output = response.json()["response"].strip().upper()
        
        # Extract YES/PARTIAL/NO from response
        if "YES" in raw_output:
            return "YES"
        elif "NO" in raw_output:
            return "NO"
        else:
            return "PARTIAL"
            
    except requests.exceptions.Timeout:
        print("⚠️ LLM validation timeout, using fallback")
        return "PARTIAL"
    except Exception as e:
        print(f"⚠️ LLM validation error: {str(e)}, using fallback")
        return "PARTIAL"


# ============================================================================
# 1. COMMUNICATION SCORE - Grammar Rules
# ============================================================================

def calculate_communication_score(answer: str) -> Tuple[int, Dict]:
    """
    Rule-based grammar evaluation.
    Score = (grammatically_correct_sentences / total_sentences) × 100
    Clamped between 10 and 90.
    """
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', answer)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    
    if not sentences:
        return 10, {'total_sentences': 0, 'correct_sentences': 0, 'issues': ['No complete sentences']}
    
    correct_sentences = 0
    issues = []
    
    for sentence in sentences:
        is_correct = True
        
        # Check 1: Has subject (capital letter start or pronoun)
        if not (sentence[0].isupper() or any(sentence.lower().startswith(p) for p in ['i ', 'we ', 'they ', 'it '])):
            is_correct = False
            issues.append(f"Missing capitalization: '{sentence[:30]}...'")
        
        # Check 2: Has verb
        words = sentence.lower().split()
        has_verb = any(word in words for word in {'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'can', 'will', 'should', 'use', 'uses', 'work', 'works', 'help', 'helps'})
        has_verb = has_verb or any(w.endswith(('ing', 'ed')) for w in words if len(w) > 4)
        
        if not has_verb:
            is_correct = False
            issues.append(f"Missing verb: '{sentence[:30]}...'")
        
        # Check 3: Not just repetition
        word_counts = Counter(words)
        if word_counts and max(word_counts.values()) > len(words) * 0.4:
            is_correct = False
            issues.append(f"Excessive repetition: '{sentence[:30]}...'")
        
        # Check 4: Minimum length
        if len(words) < 3:
            is_correct = False
            issues.append(f"Too short: '{sentence}'")
        
        if is_correct:
            correct_sentences += 1
    
    # Calculate score
    score = int((correct_sentences / len(sentences)) * 100)
    score = max(10, min(90, score))
    
    return score, {
        'total_sentences': len(sentences),
        'correct_sentences': correct_sentences,
        'issues': issues[:5],  # First 5 issues
        'score': score
    }


# ============================================================================
# 2. CONFIDENCE SCORE - Derived from Communication + Fillers
# ============================================================================

FILLER_WORDS = {
    'um', 'uh', 'umm', 'uhh', 'er', 'ah', 'like', 'you know',
    'sort of', 'kind of', 'basically', 'actually', 'literally',
    'i mean', 'you see', 'so', 'well', 'right', 'okay', 'hmm'
}

def calculate_confidence_score(answer: str, communication_score: int) -> Tuple[int, Dict]:
    """
    Confidence = (communication × 0.6) + ((100 - filler_penalty) × 0.4)
    Clamped between 5 and 90.
    """
    
    answer_lower = answer.lower()
    word_count = len(answer.split())
    
    # Count filler words
    filler_count = 0
    filler_found = {}
    
    for filler in FILLER_WORDS:
        pattern = r'\b' + re.escape(filler) + r'\b'
        matches = re.findall(pattern, answer_lower)
        if matches:
            count = len(matches)
            filler_found[filler] = count
            filler_count += count
    
    # Calculate filler penalty (max 50 points penalty)
    filler_penalty = min(filler_count * 10, 50)
    filler_score = 100 - filler_penalty
    
    # Derived confidence score
    score = int(communication_score * 0.6 + filler_score * 0.4)
    score = max(5, min(90, score))
    
    return score, {
        'filler_count': filler_count,
        'filler_found': filler_found,
        'filler_penalty': filler_penalty,
        'communication_contribution': int(communication_score * 0.6),
        'filler_contribution': int(filler_score * 0.4),
        'score': score
    }


# ============================================================================
# 3. TECHNICAL SCORE - Context + Keywords + Depth
# ============================================================================

def calculate_technical_score(
    question: str,
    answer: str,
    keywords: List[str],
    use_llm: bool = True
) -> Tuple[int, Dict]:
    """
    Technical = (keyword_coverage × 0.4) + context_score + depth_score
    
    Context score from LLM:
    - YES → 40 points
    - PARTIAL → 20 points
    - NO → 5 points
    
    Depth score from explanation phrases (0-20 points)
    
    Clamped between 2 and 90.
    """
    
    answer_lower = answer.lower()
    
    # 1. KEYWORD COVERAGE (0-40 points)
    if not keywords:
        keyword_score = 30  # Default if no keywords provided
        keywords_found = []
        keywords_missing = []
        coverage_percentage = 100
    else:
        keywords_found = []
        keywords_missing = []
        
        for keyword in keywords:
            keyword_lower = keyword.lower()
            
            # Check for exact match or partial match
            if keyword_lower in answer_lower:
                keywords_found.append(keyword)
            elif any(word in answer_lower for word in keyword_lower.split()):
                keywords_found.append(keyword)
            else:
                keywords_missing.append(keyword)
        
        coverage_percentage = (len(keywords_found) / len(keywords)) * 100
        keyword_score = int((coverage_percentage / 100) * 40)
    
    # 2. CONTEXT CORRECTNESS (0-40 points) - LLM
    if use_llm:
        context_validation = validate_context_with_llm(question, answer)
        
        if context_validation == "YES":
            context_score = 40
        elif context_validation == "PARTIAL":
            context_score = 20
        else:
            context_score = 5
    else:
        # Fallback: Basic relevance check
        question_words = set(re.findall(r'\b\w{4,}\b', question.lower()))
        answer_words = set(re.findall(r'\b\w{4,}\b', answer_lower))
        
        overlap = len(question_words & answer_words)
        if overlap >= len(question_words) * 0.5:
            context_score = 40
        elif overlap >= len(question_words) * 0.3:
            context_score = 20
        else:
            context_score = 5
        
        context_validation = "FALLBACK"
    
    # 3. EXPLANATION DEPTH (0-20 points)
    explanation_phrases = [
        'because', 'therefore', 'for example', 'such as', 'means that',
        'this is', 'which is', 'allows', 'enables', 'helps to',
        'used for', 'works by', 'involves', 'includes', 'consists of'
    ]
    
    explanation_count = sum(1 for phrase in explanation_phrases if phrase in answer_lower)
    depth_score = min(explanation_count * 4, 20)
    
    # TOTAL TECHNICAL SCORE
    total_score = keyword_score + context_score + depth_score
    total_score = max(2, min(90, total_score))
    
    return total_score, {
        'keyword_score': keyword_score,
        'keyword_coverage': {
            'found': keywords_found,
            'missing': keywords_missing,
            'coverage_percentage': round(coverage_percentage, 1)
        },
        'context_score': context_score,
        'context_validation': context_validation,
        'depth_score': depth_score,
        'explanation_count': explanation_count,
        'total_score': total_score
    }


# ============================================================================
# MAIN EVALUATION FUNCTION
# ============================================================================

def evaluate_answer(
    question: str,
    answer: str,
    keywords: List[str] = None
) -> Dict:
    """
    Main evaluation function - completes in <2 seconds.
    
    Args:
        question: Interview question
        answer: Candidate's answer
        keywords: Required technical keywords
    
    Returns:
        Dict with scores and detailed breakdown
    """
    
    keywords = keywords or []
    
    # HARD GATE CHECK
    passes_gate, gate_reason = check_hard_gate(answer)
    
    if not passes_gate:
        return {
            'technical_score': 2,
            'communication_score': 5,
            'confidence_score': 5,
            'structure_score': 5,
            'overall_score': int(2 * 0.4 + 5 * 0.3 + 5 * 0.3),
            'brief_feedback': f'Answer quality too low: {gate_reason.replace("_", " ")}',
            'strengths': [],
            'improvements': [
                'Provide a complete answer with proper sentences',
                'Address the question with relevant technical content',
                'Avoid excessive repetition'
            ],
            'keyword_coverage': {
                'covered': [],
                'missing': keywords,
                'coverage_percentage': 0
            },
            'filler_words_analysis': {
                'total_count': 0,
                'filler_details': {}
            },
            'hard_gate_failed': True,
            'gate_reason': gate_reason,
            'evaluation_method': 'fast_deterministic_v2'
        }
    
    # Calculate individual scores
    communication_score, communication_details = calculate_communication_score(answer)
    confidence_score, confidence_details = calculate_confidence_score(answer, communication_score)
    technical_score, technical_details = calculate_technical_score(question, answer, keywords, use_llm=True)
    
    # Structure score = communication score (backward compatibility)
    structure_score = communication_score
    
    # Calculate overall score
    overall_score = int(
        technical_score * 0.4 +
        communication_score * 0.3 +
        confidence_score * 0.3
    )
    
    # Generate feedback
    strengths = []
    improvements = []
    
    # Technical feedback
    if technical_details['context_validation'] == 'YES':
        strengths.append("Answer correctly addresses the question")
    
    if technical_details['keyword_coverage']['coverage_percentage'] >= 70:
        strengths.append(f"Good keyword coverage ({technical_details['keyword_coverage']['coverage_percentage']:.0f}%)")
    elif technical_details['keyword_coverage']['coverage_percentage'] < 50:
        missing = technical_details['keyword_coverage']['missing'][:3]
        improvements.append(f"Include missing concepts: {', '.join(missing)}")
    
    if technical_details['depth_score'] < 10:
        improvements.append("Add more detailed explanations and examples")
    
    # Communication feedback
    if communication_details['correct_sentences'] == communication_details['total_sentences']:
        strengths.append("Excellent grammar and sentence structure")
    elif communication_details['correct_sentences'] < communication_details['total_sentences'] * 0.6:
        improvements.append("Improve sentence structure and grammar")
    
    # Confidence feedback
    if confidence_details['filler_count'] == 0:
        strengths.append("Confident delivery with no filler words")
    elif confidence_details['filler_count'] > 5:
        improvements.append(f"Reduce filler words ({confidence_details['filler_count']} detected)")
    
    # Ensure we have feedback
    if not strengths:
        strengths = ["Attempted to answer the question"]
    if not improvements:
        improvements = ["Keep practicing", "Review core concepts"]
    
    # Generate brief feedback
    if overall_score >= 80:
        brief_feedback = f"Excellent answer! Strong technical knowledge with clear communication."
    elif overall_score >= 65:
        brief_feedback = f"Good answer. Solid understanding demonstrated."
    elif overall_score >= 50:
        brief_feedback = f"Fair answer. Focus on {'technical depth' if technical_score < 60 else 'communication clarity'}."
    else:
        brief_feedback = "Needs improvement. Review concepts and practice structured responses."
    
    return {
        # Scores
        'technical_score': technical_score,
        'communication_score': communication_score,
        'confidence_score': confidence_score,
        'structure_score': structure_score,
        'overall_score': overall_score,
        
        # Quick feedback
        'brief_feedback': brief_feedback,
        'strengths': strengths[:3],
        'improvements': improvements[:3],
        
        # Detailed breakdown
        'technical_details': technical_details,
        'communication_details': communication_details,
        'confidence_details': confidence_details,
        
        # Backward compatibility
        'keyword_coverage': technical_details['keyword_coverage'],
        'filler_words_analysis': {
            'total_count': confidence_details['filler_count'],
            'filler_details': confidence_details['filler_found']
        },
        'structure_detection': {
            'components_present': communication_details['correct_sentences'],
            'structure_score': structure_score,
            'structure_found': {
                'definition': True,
                'process': True,
                'method': True,
                'application': True
            }
        },
        
        # Metadata
        'hard_gate_failed': False,
        'llm_context_validation': technical_details['context_validation'],
        'evaluation_method': 'fast_deterministic_v2',
        'version': '4.0'
    }


# ============================================================================
# BACKWARD COMPATIBILITY WRAPPER
# ============================================================================

def evaluate_answer_legacy(question: str, answer: str, keywords: list = None) -> dict:
    """Backward compatible wrapper for existing API."""
    return evaluate_answer(question, answer, keywords or [])