"""
Real-Time AI Structured Feedback Generator
==========================================
- Generates detailed, personalized feedback using LLM
- Called AFTER scores are displayed (non-blocking)
- Uses rich context from answer and scores
- Different feedback for different answers
- Uses gemma:2b model
"""

import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma:2b"

FEEDBACK_PROMPT_TEMPLATE = """You are an expert technical interview coach providing personalized, actionable feedback.

**INTERVIEW QUESTION:**
{question}

**CANDIDATE'S ANSWER:**
{answer}

**PERFORMANCE ANALYSIS:**
- Technical Score: {technical_score}% (Context: {context_validation}, Keyword Coverage: {keyword_coverage}%)
- Communication Score: {communication_score}%
- Confidence Score: {confidence_score}%

**REQUIRED KEYWORDS:**
Expected: {keywords_expected}
Covered: {keywords_covered}
Missing: {keywords_missing}

**DETAILED OBSERVATIONS:**
{observations}

---

**YOUR TASK:**
Provide SPECIFIC, PERSONALIZED feedback based on the actual content of this answer. 

**CRITICAL RULES:**
1. Reference SPECIFIC things the candidate said (quote phrases if helpful)
2. Be CONCRETE about what's missing - don't just list keywords, explain what concepts/explanations are absent
3. Suggestions must be ACTIONABLE - tell them exactly what to add or change
4. Different answers must get DIFFERENT feedback - be specific to THIS answer
5. Output ONLY valid JSON, no markdown, no extra text

**OUTPUT FORMAT (JSON ONLY):**
{{
  "what_you_covered": [
    "Specific point 1 from their answer (quote relevant phrase)",
    "Specific point 2 that was well explained",
    "Concrete aspect 3 they mentioned"
  ],
  "what_you_missed": [
    "Missing concept 1 with brief explanation of what it is",
    "Missing concept 2 and why it matters for this question",
    "Gap in explanation 3"
  ],
  "how_to_improve": [
    "Specific actionable tip 1 based on their answer",
    "Concrete suggestion 2 for better structure",
    "Practical advice 3 for technical depth"
  ],
  "suggested_additions": [
    "Add: [specific concept] - explain [what aspect]",
    "Include: [specific example] to demonstrate [what]",
    "Elaborate on: [their weak point] by discussing [what]"
  ]
}}

Generate personalized feedback NOW:"""

def generate_structured_feedback(
    question: str,
    answer: str,
    keywords: list = None,
    scores: dict = None
) -> dict:
    """
    Generate real-time, personalized AI feedback.
    
    Args:
        question: The interview question
        answer: Candidate's actual answer
        keywords: Required keywords
        scores: Evaluation scores with detailed breakdown
    
    Returns:
        Dictionary with structured feedback
    """
    
    keywords = keywords or []
    scores = scores or {}
    
    # Build rich context from scores
    observations = []
    
    # Technical observations
    if scores.get('technical_details'):
        tech = scores['technical_details']
        
        if tech.get('context_validation') == 'YES':
            observations.append("✓ Answer is contextually relevant to the question")
        elif tech.get('context_validation') == 'PARTIAL':
            observations.append("⚠ Answer partially addresses the question but lacks completeness")
        else:
            observations.append("✗ Answer does not adequately address the question")
        
        if tech.get('explanation_count', 0) > 3:
            observations.append(f"✓ Good use of explanatory phrases ({tech['explanation_count']} found)")
        else:
            observations.append(f"⚠ Limited explanatory depth ({tech.get('explanation_count', 0)} explanation phrases)")
    
    # Communication observations
    if scores.get('communication_details'):
        comm = scores['communication_details']
        
        if comm['correct_sentences'] == comm['total_sentences']:
            observations.append("✓ All sentences are grammatically correct")
        else:
            issues = comm.get('issues', [])
            if issues:
                observations.append(f"⚠ Grammar issues detected: {issues[0]}")
    
    # Confidence observations
    if scores.get('confidence_details'):
        conf = scores['confidence_details']
        
        if conf['filler_count'] > 5:
            top_fillers = sorted(conf['filler_found'].items(), key=lambda x: x[1], reverse=True)[:3]
            filler_list = ', '.join(f"{word}({count})" for word, count in top_fillers)
            observations.append(f"⚠ High filler word usage: {filler_list}")
        elif conf['filler_count'] > 0:
            observations.append(f"⚠ Some filler words detected ({conf['filler_count']} total)")
        else:
            observations.append("✓ No filler words - confident delivery")
    
    # Prepare context
    kw_coverage = scores.get('keyword_coverage', {})
    
    context = {
        'question': question,
        'answer': answer[:1000],  # Limit length for LLM
        'technical_score': scores.get('technical_score', 0),
        'communication_score': scores.get('communication_score', 0),
        'confidence_score': scores.get('confidence_score', 0),
        'context_validation': scores.get('llm_context_validation', scores.get('technical_details', {}).get('context_validation', 'UNKNOWN')),
        'keyword_coverage': kw_coverage.get('coverage_percentage', 0),
        'keywords_expected': ', '.join(keywords) if keywords else 'None specified',
        'keywords_covered': ', '.join(kw_coverage.get('covered', [])) if kw_coverage.get('covered') else 'None',
        'keywords_missing': ', '.join(kw_coverage.get('missing', [])) if kw_coverage.get('missing') else 'None',
        'observations': '\n'.join(observations)
    }
    
    # Generate prompt
    full_prompt = FEEDBACK_PROMPT_TEMPLATE.format(**context)
    
    payload = {
        "model": MODEL,
        "prompt": full_prompt,
        "stream": False,
        "temperature": 0.4,  # Slightly creative but consistent
        "num_predict": 600,  # Enough for detailed feedback
        "top_p": 0.9
    }
    
    try:
        print(f"🤖 Generating personalized AI feedback for answer ({len(answer)} chars)...")
        
        response = requests.post(OLLAMA_URL, json=payload, timeout=15)
        
        if response.status_code != 200:
            raise Exception(f"Ollama returned status {response.status_code}")
        
        raw_output = response.json()["response"]
        
        print(f"📝 Raw LLM output length: {len(raw_output)} chars")
        
        # Extract JSON from response
        try:
            # Try to find JSON in the response
            json_match = re.search(r'\{[\s\S]*\}\s*$', raw_output)
            json_str = json_str.replace('\n', ' ').strip()
            if json_match:
                json_str = json_match.group(0)
                feedback = json.loads(json_str)
            else:
                # Try parsing entire response
                feedback = json.loads(raw_output)
            
            # Validate structure
            required_keys = ['what_you_covered', 'what_you_missed', 'how_to_improve', 'suggested_additions']
            for key in required_keys:
                if key not in feedback:
                    feedback[key] = []
                elif not isinstance(feedback[key], list):
                    feedback[key] = [str(feedback[key])]
            
            print(f"✅ Successfully parsed AI feedback")
            print(f"   - Covered: {len(feedback['what_you_covered'])} points")
            print(f"   - Missed: {len(feedback['what_you_missed'])} points")
            print(f"   - Improvements: {len(feedback['how_to_improve'])} points")
            print(f"   - Additions: {len(feedback['suggested_additions'])} points")
            
            return {
                'success': True,
                'feedback': feedback,
                'method': 'llm_generated'
            }
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"⚠️ Failed to parse LLM output as JSON: {str(e)}")
            print(f"Raw output: {raw_output[:200]}...")
            # Return fallback feedback
            return generate_fallback_feedback(question, answer, keywords, scores)
    
    except requests.exceptions.Timeout:
        print(f"⚠️ LLM request timeout after 15s")
        return generate_fallback_feedback(question, answer, keywords, scores)
    except requests.exceptions.RequestException as e:
        print(f"⚠️ LLM request failed: {str(e)}")
        return generate_fallback_feedback(question, answer, keywords, scores)
    except Exception as e:
        print(f"⚠️ Unexpected error in LLM feedback: {str(e)}")
        import traceback
        traceback.print_exc()
        return generate_fallback_feedback(question, answer, keywords, scores)


def generate_fallback_feedback(
    question: str,
    answer: str,
    keywords: list = None,
    scores: dict = None
) -> dict:
    """
    Generate fallback feedback when LLM fails.
    Still tries to be specific based on answer content.
    """
    keywords = keywords or []
    scores = scores or {}
    
    kw_covered = scores.get('keyword_coverage', {}).get('covered', [])
    kw_missing = scores.get('keyword_coverage', {}).get('missing', [])
    
    # Try to extract specific phrases from answer
    sentences = re.split(r'[.!?]+', answer)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    what_covered = []
    if kw_covered:
        what_covered.append(f"You mentioned {', '.join(kw_covered[:3])}")
    if sentences:
        # Quote first substantial sentence
        first_sentence = sentences[0][:80]
        what_covered.append(f"You started with: \"{first_sentence}...\"")
    if not what_covered:
        what_covered.append("You attempted to answer the question")
    
    what_missed = []
    if kw_missing:
        for kw in kw_missing[:3]:
            what_missed.append(f"No explanation of '{kw}' - this is a key concept for this question")
    
    # Technical depth check
    tech_score = scores.get('technical_score', 0)
    if tech_score < 50:
        what_missed.append("Limited technical depth - answer needs more detailed explanations")
    
    # Context validation check
    context_val = scores.get('llm_context_validation', scores.get('technical_details', {}).get('context_validation'))
    if context_val == 'NO':
        what_missed.append("Answer doesn't adequately address the specific question asked")
    elif context_val == 'PARTIAL':
        what_missed.append("Answer partially addresses the question but lacks completeness")
    
    if not what_missed:
        what_missed.append("Could provide more comprehensive coverage of the topic")
    
    how_to_improve = []
    
    # Grammar issues
    comm_details = scores.get('communication_details', {})
    if comm_details.get('issues'):
        how_to_improve.append(f"Fix grammar: {comm_details['issues'][0]}")
    
    # Structure
    if comm_details.get('correct_sentences', 0) < 3:
        how_to_improve.append("Use more complete, well-structured sentences")
    
    # Filler words
    conf_details = scores.get('confidence_details', {})
    if conf_details.get('filler_count', 0) > 5:
        top_filler = max(conf_details.get('filler_found', {}).items(), key=lambda x: x[1])[0] if conf_details.get('filler_found') else 'filler words'
        how_to_improve.append(f"Reduce use of '{top_filler}' and other filler words")
    
    # General structure
    how_to_improve.append("Structure answer with: Definition → Process → Method → Application")
    
    if not how_to_improve:
        how_to_improve.append("Practice explaining concepts in your own words")
    
    suggested_additions = []
    if kw_missing:
        for kw in kw_missing[:2]:
            suggested_additions.append(f"Add detailed explanation of {kw} and its relevance")
    suggested_additions.append("Include real-world examples or use cases")
    suggested_additions.append("Explain why this concept matters in practice")
    
    print("⚠️ Using fallback feedback (LLM unavailable)")
    
    return {
        'success': False,
        'feedback': {
            'what_you_covered': what_covered[:3],
            'what_you_missed': what_missed[:4],
            'how_to_improve': how_to_improve[:4],
            'suggested_additions': suggested_additions[:4]
        },
        'method': 'fallback_generated'
    }