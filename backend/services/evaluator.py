"""
Interview Answer Evaluation System v5.0
========================================
- Strict validation for empty/no answer cases
- Technical Score: Based on technical correctness (0 if nothing told)
- Structure Score: DPMA detection (Definition, Process, Methodology, Application)
- Communication Score: Grammar + sentence quality (0 if no meaningful sentences)
- Confidence Score: Voice characteristics, filler words, stuttering (0 if not spoken)
- Quick feedback from GROQ API
- Proper hard gate for invalid answers
"""

import re
from typing import Dict, List, Tuple
from collections import Counter
from services.groq_client import call_groq_chat

# ============================================================================
# NO ANSWER DETECTION
# ============================================================================

NO_ANSWER_PHRASES = {
    'time ran out',
    'no answer',
    'i don\'t know',
    'i cannot answer',
    'blank',
    'nothing to say',
    'cannot provide',
    'unable to answer',
    'no response',
    'skipped',
    'passed'
}

def detect_no_answer(answer: str) -> bool:
    """Detect if user provided no real answer or ran out of time."""
    answer_lower = answer.lower().strip()
    
    # Check for no answer phrases
    for phrase in NO_ANSWER_PHRASES:
        if phrase in answer_lower:
            return True
    
    # Check if it's just placeholder text
    if answer_lower in ['...', '...', 'hmm', 'um', 'uh', 'err']:
        return True
    
    return False

# ============================================================================
# HARD GATE - Detect Invalid Answers
# ============================================================================

def check_hard_gate(answer: str) -> Tuple[bool, str]:
    """
    Strict check if answer passes basic quality threshold.
    
    Returns: (passes_gate, reason)
    """
    if not answer or not answer.strip():
        return False, "empty_answer"
    
    # Check for no answer scenarios
    if detect_no_answer(answer):
        return False, "no_answer_provided"
    
    words = answer.split()
    
    # Gate 1: Extremely short (less than 10 meaningful words for real answer)
    meaningful_words = [w for w in words if len(w) > 2 and w.lower() not in {'the', 'and', 'but', 'for', 'with', 'from', 'that', 'this', 'or', 'an', 'of', 'to', 'in', 'is', 'a'}]
    if len(meaningful_words) < 6:
        return False, "answer_too_short"
    
    # Gate 2: Excessive repetition
    word_counts = Counter(w.lower() for w in words if len(w) > 3)
    if word_counts:
        max_repetition = max(word_counts.values())
        if max_repetition > len(words) * 0.25:  # More than 25% same word
            return False, "excessive_repetition"
    
    # Gate 3: No verb detected
    common_verbs = {'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did', 
                    'can', 'could', 'will', 'would', 'should', 'may', 'might', 'use', 'uses',
                    'work', 'works', 'help', 'helps', 'make', 'makes', 'provide', 'provides',
                    'implement', 'includes', 'involves', 'requires', 'enables', 'allows'}
    
    answer_lower = answer.lower()
    has_verb = any(verb in answer_lower.split() for verb in common_verbs)
    
    # Also check for -ing, -ed endings
    has_verb = has_verb or any(word.endswith(('ing', 'ed')) for word in words if len(word) > 4)
    
    if not has_verb:
        return False, "no_verb_detected"
    
    return True, "valid"


# ============================================================================
# STRUCTURE SCORE - DPMA Detection (Definition, Process, Methodology, Application)
# ============================================================================

def calculate_structure_score(answer: str) -> Tuple[int, Dict]:
    """
    Score based on DPMA structure:
    - Definition: Clear definition/explanation of concept
    - Process: How it works or process involved
    - Methodology: Method/approach/technique used
    - Application: Real-world application or examples
    
    Returns: (score, details)
    """
    
    answer_lower = answer.lower()
    
    # Definition indicators
    definition_keywords = {
        'is', 'means', 'defined as', 'definition', 'concept', 'refers to',
        'also known as', 'termed', 'represents', 'stands for', 'framework'
    }
    
    # Process indicators
    process_keywords = {
        'process', 'steps', 'flow', 'sequence', 'then', 'first', 'next',
        'works by', 'involves', 'follows', 'leads to', 'result in'
    }
    
    # Methodology indicators
    methodology_keywords = {
        'method', 'approach', 'technique', 'strategy', 'tool', 'technology',
        'algorithm', 'framework', 'pattern', 'methodology', 'implementation'
    }
    
    # Application indicators
    application_keywords = {
        'example', 'for instance', 'such as', 'use case', 'application',
        'real-world', 'scenario', 'practically', 'in practice', 'helps'
    }
    
    components = {
        'definition': any(kw in answer_lower for kw in definition_keywords),
        'process': any(kw in answer_lower for kw in process_keywords),
        'methodology': any(kw in answer_lower for kw in methodology_keywords),
        'application': any(kw in answer_lower for kw in application_keywords)
    }
    
    # Count how many components are present
    components_present = sum(1 for v in components.values() if v)
    
    # Score: 0-25 per component
    if components_present == 0:
        score = 0
    elif components_present == 1:
        score = 15
    elif components_present == 2:
        score = 35
    elif components_present == 3:
        score = 55
    else:  # All 4
        score = 90
    
    return score, {
        'components_present': components_present,
        'components_found': components,
        'score': score
    }


# ============================================================================
# LLM CONTEXT VALIDATION - Groq Chat API
# ============================================================================

def validate_context_with_llm(question: str, answer: str, timeout: int = 10) -> str:
    """
    Groq call to validate if answer addresses the question correctly.

    Returns: "YES" | "PARTIAL" | "NO"
    """
    prompt = f"""You are evaluating if a student's answer correctly addresses the interview question.

Question: {question}

Answer: {answer}

Analyze if the answer:
1. Addresses the question topic
2. Provides relevant technical information
3. Shows understanding of the concept

Respond with ONLY ONE WORD:
- YES (if answer is mostly correct and relevant)
- PARTIAL (if answer is somewhat relevant but incomplete)
- NO (if answer is off-topic or completely wrong)"""

    raw_output = call_groq_chat(
        prompt,
        timeout=timeout,
        max_tokens=8,
        temperature=0,
    )

    if not raw_output:
        print("LLM validation failed, using fallback")
        return "PARTIAL"

    raw_output = raw_output.strip().upper()
    if "YES" in raw_output:
        return "YES"
    if "NO" in raw_output:
        return "NO"
    return "PARTIAL"

# ============================================================================
# COMMUNICATION SCORE - Grammar + Sentence Quality
# ============================================================================

def calculate_communication_score(answer: str) -> Tuple[int, Dict]:
    """
    Grammar and communication quality evaluation.
    - 0 if no complete sentences
    - Score based on: grammatically correct sentences, clarity, proper structure
    """
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', answer)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    
    if not sentences:
        return 0, {
            'total_sentences': 0,
            'correct_sentences': 0,
            'issues': ['No complete sentences - no meaningful answer provided'],
            'score': 0
        }
    
    correct_sentences = 0
    issues = []
    
    for sentence in sentences:
        is_correct = True
        
        # Check 1: Has subject (capital letter start or pronoun)
        if not (sentence[0].isupper() or any(sentence.lower().startswith(p) for p in ['i ', 'we ', 'they ', 'it ', 'this ', 'that '])):
            is_correct = False
            if not issues:
                issues.append(f"Improper capitalization in sentences")
        
        # Check 2: Has verb
        words = sentence.lower().split()
        has_verb = any(word in words for word in {'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'can', 'will', 'should', 'use', 'uses', 'work', 'works', 'help', 'helps', 'implement', 'includes'})
        has_verb = has_verb or any(w.endswith(('ing', 'ed')) for w in words if len(w) > 4)
        
        if not has_verb:
            is_correct = False
            if not issues:
                issues.append(f"Missing verb in sentences")
        
        # Check 3: Not just repetition
        word_counts = Counter(words)
        if word_counts and max(word_counts.values()) > len(words) * 0.4:
            is_correct = False
            if not issues:
                issues.append(f"Excessive word repetition")
        
        # Check 4: Minimum length (at least 4 words for complete thought)
        if len(words) < 4:
            is_correct = False
            if not issues:
                issues.append(f"Sentences too short")
        
        if is_correct:
            correct_sentences += 1
    
    # Calculate score (0 if any issues, clamped 0-85)
    if correct_sentences == 0:
        score = 0
    else:
        score = int((correct_sentences / len(sentences)) * 85)
    
    return score, {
        'total_sentences': len(sentences),
        'correct_sentences': correct_sentences,
        'issues': issues,
        'score': score
    }


# ============================================================================
# CONFIDENCE SCORE - Voice Characteristics, Fillers, Stuttering
# ============================================================================

FILLER_WORDS = {
    'um', 'uh', 'umm', 'uhh', 'uhm', 'uhmm', 'uhhh', 'ummm', 'er', 'ah', 'eh',
    'like', 'you know', 'sort of', 'kind of', 'basically', 'actually', 'literally',
    'i mean', 'you see', 'right', 'okay', 'hmm', 'huh', 'so', 'well', 'anyway',
    'anyways', 'just', 'really', 'sorta', 'kinda', 'i guess', 'i suppose'
}

STUTTERING_PATTERNS = {
    'w-w', 't-t', 's-s', 'c-c', 'd-d',  # repeated consonants with dash
}

def detect_stuttering(answer: str) -> int:
    """Count stuttering patterns in text."""
    stutter_count = 0
    answer_lower = answer.lower()
    
    for pattern in STUTTERING_PATTERNS:
        stutter_count += answer_lower.count(pattern)
    
    return stutter_count

def calculate_confidence_score(answer: str, communication_score: int) -> Tuple[int, Dict]:
    """
    Confidence based on:
    - Voice clarity (derived from communication score)
    - Filler words usage (um, uh, like, basically, etc)
    - Stuttering or repetition issues
    
    Returns 0 if no answer, otherwise 0-85
    """
    
    if communication_score == 0:
        return 0, {
            'filler_count': 0,
            'stuttering_count': 0,
            'filler_found': {},
            'filler_penalty': 100,
            'stuttering_penalty': 0,
            'voice_quality': 'no_answer',
            'score': 0
        }
    
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
    
    # Count stuttering
    stuttering_count = detect_stuttering(answer)
    
    # Filler penalty (max 60 points)
    filler_penalty = min(filler_count * 8, 60)
    
    # Stuttering penalty (max 25 points)
    stuttering_penalty = min(stuttering_count * 5, 25)
    
    # Total penalties
    total_penalty = filler_penalty + stuttering_penalty
    
    # Base score from communication + voice confidence
    base_score = int(communication_score * 0.8)
    
    # Apply penalties
    score = max(0, base_score - int(total_penalty * 0.5))
    score = min(85, score)  # Cap at 85
    
    # Determine voice quality
    if filler_count > 10 or stuttering_count > 3:
        voice_quality = 'hesitant'
    elif filler_count > 5:
        voice_quality = 'moderate_fillers'
    elif filler_count > 0:
        voice_quality = 'few_fillers'
    else:
        voice_quality = 'confident'
    
    return score, {
        'filler_count': filler_count,
        'filler_found': filler_found,
        'filler_penalty': filler_penalty,
        'stuttering_count': stuttering_count,
        'stuttering_penalty': stuttering_penalty,
        'voice_quality': voice_quality,
        'communication_contribution': int(communication_score * 0.8),
        'score': score
    }


# ============================================================================
# TECHNICAL SCORE - Correctness + Keywords + Depth
# ============================================================================

def calculate_technical_score(
    question: str,
    answer: str,
    keywords: List[str],
    use_llm: bool = True
) -> Tuple[int, Dict]:
    """
    Technical score based on:
    - Context validation: Does it correctly address the question? (0-50 points)
    - Keyword coverage: Are technical keywords included? (0-25 points)
    - Explanation depth: Are concepts explained with examples? (0-10 points)
    
    Returns 0 if answer is not technically correct.
    Max score: 85
    """
    
    answer_lower = answer.lower()
    
    # 1. CONTEXT CORRECTNESS (0-50 points) - LLM VALIDATION - MOST IMPORTANT
    if use_llm:
        context_validation = validate_context_with_llm(question, answer, timeout=10)
        
        if context_validation == "YES":
            context_score = 50  # Full score for correct answer
        elif context_validation == "PARTIAL":
            context_score = 20  # Partial credit
        else:  # "NO"
            context_score = 0   # No points for wrong answer
    else:
        # Fallback: Basic relevance check
        question_words = set(re.findall(r'\b\w{4,}\b', question.lower()))
        answer_words = set(re.findall(r'\b\w{4,}\b', answer_lower))
        
        overlap = len(question_words & answer_words)
        if overlap >= len(question_words) * 0.6:
            context_score = 50
        elif overlap >= len(question_words) * 0.4:
            context_score = 20
        else:
            context_score = 0
        
        context_validation = "FALLBACK"
    
    # 2. KEYWORD COVERAGE (0-25 points)
    if not keywords:
        keyword_score = 15  # Default if no keywords provided
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
        
        coverage_percentage = (len(keywords_found) / len(keywords)) * 100 if keywords else 0
        
        if coverage_percentage >= 75:
            keyword_score = 25
        elif coverage_percentage >= 50:
            keyword_score = 15
        elif coverage_percentage >= 25:
            keyword_score = 8
        else:
            keyword_score = 0
    
    # 3. EXPLANATION DEPTH (0-10 points)
    explanation_phrases = [
        'because', 'therefore', 'for example', 'such as', 'means that',
        'this is', 'which is', 'allows', 'enables', 'helps to',
        'used for', 'works by', 'involves', 'includes', 'consists of',
        'implemented', 'applied', 'demonstrated', 'illustrated'
    ]
    
    explanation_count = sum(1 for phrase in explanation_phrases if phrase in answer_lower)
    
    if explanation_count >= 5:
        depth_score = 10
    elif explanation_count >= 3:
        depth_score = 6
    elif explanation_count >= 1:
        depth_score = 3
    else:
        depth_score = 0
    
    # TOTAL TECHNICAL SCORE (max 85)
    total_score = context_score + keyword_score + depth_score
    total_score = min(85, total_score)
    
    return total_score, {
        'context_score': context_score,
        'context_validation': context_validation,
        'keyword_score': keyword_score,
        'keyword_coverage': {
            'found': keywords_found,
            'missing': keywords_missing,
            'coverage_percentage': round(coverage_percentage, 1)
        },
        'depth_score': depth_score,
        'explanation_count': explanation_count,
        'total_score': total_score
    }


# ============================================================================
# GROQ API FEEDBACK GENERATION
# ============================================================================

def generate_groq_feedback(
    question: str,
    answer: str,
    scores: Dict,
    keywords: List[str]
) -> Dict:
    """
    Generate structured feedback using GROQ API.
    Returns small, actionable improvement suggestions.
    """
    from services.llm_evaluator import _call_llm, _extract_json, _validate_feedback
    
    prompt = f"""Give SHORT, specific improvement suggestions for this interview answer.

Question: {question}
Student Answer: {answer}

Scores:
- Technical: {scores.get('technical_score', 0)}%
- Communication: {scores.get('communication_score', 0)}%
- Confidence: {scores.get('confidence_score', 0)}%
- Structure: {scores.get('structure_score', 0)}%

Only give 2-3 SHORT bullet points for each section. Be specific and actionable.

Return ONLY this JSON (no markdown, no extra text):
{{
  "strengths": ["specific strength found"],
  "quick_improvements": ["small actionable tip"],
  "focus_area": "what to focus on most"
}}"""

    try:
        raw = _call_llm(prompt, timeout=15)
        feedback = _extract_json(raw)
        
        if feedback:
            return _validate_feedback({
                'what_you_covered': feedback.get('strengths', []),
                'what_you_missed': [],
                'how_to_improve': feedback.get('quick_improvements', []),
                'suggested_additions': [feedback.get('focus_area', 'Review core concepts')]
            })
    except Exception as e:
        print(f"Groq feedback error: {e}")
    
    # Fallback
    return {
        'what_you_covered': ['Attempted to answer'],
        'what_you_missed': [],
        'how_to_improve': ['Review concepts', 'Practice with examples'],
        'suggested_additions': ['Focus on technical accuracy']
    }

def evaluate_answer(
    question: str,
    answer: str,
    keywords: List[str] = None
) -> Dict:
    """
    Comprehensive answer evaluation with proper scoring.
    
    Args:
        question: Interview question
        answer: Candidate's answer (text transcribed from speech)
        keywords: Required technical keywords
    
    Returns:
        Dict with all scores and feedback
    """
    
    keywords = keywords or []
    
    # ========== HARD GATE CHECK ==========
    passes_gate, gate_reason = check_hard_gate(answer)
    
    if not passes_gate:
        return {
            'technical_score': 0,
            'communication_score': 0,
            'confidence_score': 0,
            'structure_score': 0,
            'overall_score': 0,
            'brief_feedback': f'No answer provided. {gate_reason.replace("_", " ")}.',
            'strengths': [],
            'improvements': [
                'Provide a complete answer addressing the question',
                'Include definition, process, methodology, and real-world examples',
                'Speak clearly and confidently with proper structure'
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
            'structure_detection': {
                'components_present': 0,
                'structure_score': 0,
                'components_found': {
                    'definition': False,
                    'process': False,
                    'methodology': False,
                    'application': False
                }
            },
            'hard_gate_failed': True,
            'gate_reason': gate_reason,
            'evaluation_method': 'strict_validation_v5',
            'version': '5.0'
        }
    
    # ========== CALCULATE INDIVIDUAL SCORES ==========
    
    # Communication Score (0-85)
    communication_score, communication_details = calculate_communication_score(answer)
    
    # Structure Score - DPMA Detection (0-90)
    structure_score, structure_details = calculate_structure_score(answer)
    
    # Confidence Score (0-85)
    confidence_score, confidence_details = calculate_confidence_score(answer, communication_score)
    
    # Technical Score (0-85) - Most Important
    technical_score, technical_details = calculate_technical_score(
        question, answer, keywords, use_llm=True
    )
    
    # ========== CALCULATE OVERALL SCORE ==========
    # Weighting: Technical 40%, Structure 30%, Communication 20%, Confidence 10%
    overall_score = int(
        technical_score * 0.40 +
        structure_score * 0.30 +
        communication_score * 0.20 +
        confidence_score * 0.10
    )
    
    # ========== GENERATE FEEDBACK ==========
    scores_dict = {
        'technical_score': technical_score,
        'communication_score': communication_score,
        'confidence_score': confidence_score,
        'structure_score': structure_score,
        'overall_score': overall_score
    }
    
    groq_feedback = generate_groq_feedback(question, answer, scores_dict, keywords)
    
    # ========== QUICK BRIEF FEEDBACK ==========
    if overall_score >= 75:
        brief_feedback = "Great answer! Strong technical knowledge with clear structure and confident delivery."
    elif overall_score >= 60:
        brief_feedback = "Good answer. You covered the main points. Work on adding more depth and examples."
    elif overall_score >= 45:
        brief_feedback = "Fair answer. Focus on technical accuracy and clearer structure (definition -> process -> examples)."
    elif overall_score >= 30:
        brief_feedback = "Needs improvement. Review the concepts and practice structured responses."
    else:
        brief_feedback = "Incomplete answer. Provide more detailed explanation with examples and technical depth."
    
    # ========== RETURN COMPLETE EVALUATION ==========
    return {
        # Core Scores
        'technical_score': technical_score,
        'communication_score': communication_score,
        'confidence_score': confidence_score,
        'structure_score': structure_score,
        'overall_score': overall_score,
        
        # Quick Feedback (from GROQ API)
        'brief_feedback': brief_feedback,
        'strengths': groq_feedback.get('what_you_covered', [])[:3],
        'improvements': groq_feedback.get('how_to_improve', [])[:3],
        'focus_area': groq_feedback.get('suggested_additions', ['Review concepts'])[:1],
        
        # Detailed breakdowns
        'technical_details': technical_details,
        'communication_details': communication_details,
        'confidence_details': confidence_details,
        'structure_details': structure_details,
        
        # Compatibility fields
        'keyword_coverage': technical_details['keyword_coverage'],
        'filler_words_analysis': {
            'total_count': confidence_details.get('filler_count', 0),
            'filler_details': confidence_details.get('filler_found', {}),
            'voice_quality': confidence_details.get('voice_quality', 'unknown')
        },
        'structure_detection': {
            'components_present': structure_details.get('components_present', 0),
            'structure_score': structure_score,
            'components_found': structure_details.get('components_found', {})
        },
        
        # Metadata
        'hard_gate_failed': False,
        'llm_context_validation': technical_details.get('context_validation', 'unknown'),
        'evaluation_method': 'strict_validation_v5',
        'version': '5.0'
    }


# ============================================================================
# BACKWARD COMPATIBILITY WRAPPER
# ============================================================================

def evaluate_answer_legacy(question: str, answer: str, keywords: list = None) -> dict:
    """Backward compatible wrapper for existing API."""
    return evaluate_answer(question, answer, keywords or [])
