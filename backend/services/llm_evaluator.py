import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma:2b"

# Filler words list
FILLER_WORDS = [
    "um", "uh", "umm", "uhh", "like", "you know", "sort of", "kind of",
    "basically", "actually", "literally", "so", "well", "right", "okay",
    "i mean", "you see", "somehow", "anyway"
]

def count_filler_words(text: str) -> dict:
    """Count filler words in the answer"""
    text_lower = text.lower()
    filler_count = {}
    total_fillers = 0
    
    for filler in FILLER_WORDS:
        pattern = r'\b' + re.escape(filler) + r'\b'
        count = len(re.findall(pattern, text_lower))
        if count > 0:
            filler_count[filler] = count
            total_fillers += count
    
    return {
        "total_count": total_fillers,
        "filler_details": filler_count
    }

def check_keywords_coverage(keywords: list, answer: str) -> dict:
    """Check how many required keywords are covered in the answer"""
    if not keywords:
        return {
            "covered": [],
            "missing": [],
            "coverage_percentage": 100
        }
    
    answer_lower = answer.lower()
    covered_keywords = []
    missing_keywords = []
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        if keyword_lower in answer_lower:
            covered_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)
    
    coverage_percentage = (len(covered_keywords) / len(keywords) * 100) if keywords else 100
    
    return {
        "covered": covered_keywords,
        "missing": missing_keywords,
        "coverage_percentage": round(coverage_percentage, 2)
    }

def analyze_answer_structure(answer: str) -> dict:
    """Analyze if the answer follows the DPMA structure"""
    answer_lower = answer.lower()
    
    structure_indicators = {
        "definition": [
            "is defined as", "refers to", "means", "is a", "is the",
            "definition", "essentially", "in essence", "fundamentally"
        ],
        "process": [
            "process", "steps", "procedure", "how it works", "workflow",
            "first", "then", "next", "after", "finally", "stage", "phase"
        ],
        "method": [
            "method", "approach", "technique", "strategy", "implementation",
            "using", "by applying", "through", "via", "algorithm"
        ],
        "application": [
            "used for", "applied in", "example", "real-world", "use case",
            "application", "in practice", "such as", "for instance", "like"
        ]
    }
    
    structure_found = {
        "definition": False,
        "process": False,
        "method": False,
        "application": False
    }
    
    for component, indicators in structure_indicators.items():
        for indicator in indicators:
            if indicator in answer_lower:
                structure_found[component] = True
                break
    
    components_present = sum(structure_found.values())
    structure_score = (components_present / 4) * 100
    
    return {
        "structure_found": structure_found,
        "components_present": components_present,
        "structure_score": round(structure_score, 2),
        "missing_components": [k for k, v in structure_found.items() if not v]
    }

def generate_rule_based_evaluation(question, answer, keyword_analysis, structure_analysis, filler_analysis):
    """Generate evaluation based on rules when LLM fails or is too slow"""
    
    print("⚡ Using fast rule-based evaluation...")
    
    # Calculate scores
    structure_score = structure_analysis['structure_score']
    
    # Technical score based on keywords
    if keyword_analysis:
        tech_score = max(40, min(95, keyword_analysis['coverage_percentage']))
    else:
        tech_score = 60
    
    # Communication score based on answer length and filler words
    word_count = len(answer.split())
    if word_count < 50:
        comm_score = 40
    elif word_count < 100:
        comm_score = 60
    elif word_count < 200:
        comm_score = 80
    else:
        comm_score = 90
    
    # Reduce for filler words
    comm_score = max(30, comm_score - (filler_analysis['total_count'] * 3))
    
    # Confidence score
    conf_score = max(40, 90 - (filler_analysis['total_count'] * 5))
    
    # Overall score
    overall = (tech_score * 0.35 + structure_score * 0.30 + 
               comm_score * 0.20 + conf_score * 0.15)
    
    # Generate feedback
    missing = structure_analysis['missing_components']
    improvements = []
    
    if 'definition' in missing:
        improvements.append("Start with a clear definition of the concept")
    if 'process' in missing:
        improvements.append("Explain the step-by-step process")
    if 'method' in missing:
        improvements.append("Describe specific implementation methods")
    if 'application' in missing:
        improvements.append("Provide real-world examples")
    if filler_analysis['total_count'] > 5:
        improvements.append(f"Reduce filler words (found {filler_analysis['total_count']})")
    if keyword_analysis and len(keyword_analysis['missing']) > 0:
        improvements.append(f"Cover missing keywords: {', '.join(keyword_analysis['missing'][:2])}")
    
    strengths = []
    if structure_analysis['components_present'] >= 3:
        strengths.append("Good answer structure")
    if filler_analysis['total_count'] <= 3:
        strengths.append("Confident delivery")
    if word_count >= 100:
        strengths.append("Comprehensive explanation")
    if keyword_analysis and keyword_analysis['coverage_percentage'] >= 70:
        strengths.append("Good keyword coverage")
    
    return {
        "technical_score": round(tech_score),
        "structure_score": round(structure_score),
        "communication_score": round(comm_score),
        "confidence_score": round(conf_score),
        "overall_score": round(overall),
        "structure_analysis": {
            "definition_present": structure_analysis['structure_found']['definition'],
            "process_present": structure_analysis['structure_found']['process'],
            "method_present": structure_analysis['structure_found']['method'],
            "application_present": structure_analysis['structure_found']['application'],
            "structure_feedback": f"Found {structure_analysis['components_present']}/4 DPMA components"
        },
        "brief_feedback": f"Overall score: {round(overall)}%. Follow DPMA structure for better results.",
        "strengths": strengths[:3],
        "improvements": improvements[:3],
        "filler_words_analysis": filler_analysis,
        "structure_detection": structure_analysis,
        "keyword_coverage": keyword_analysis,
        "evaluation_method": "rule_based"
    }

def evaluate_answer(question: str, answer: str, keywords: list = None):
    """
    Evaluate answer - tries LLM first, falls back to rule-based if fails
    """
    
    print("="*60)
    print(f"📝 Evaluating answer...")
    print(f"Question: {question[:60]}...")
    print(f"Answer length: {len(answer)} chars")
    print("="*60)
    
    # Quick analysis
    filler_analysis = count_filler_words(answer)
    keyword_analysis = check_keywords_coverage(keywords or [], answer)
    structure_analysis = analyze_answer_structure(answer)
    
    print(f"✅ Pre-analysis complete:")
    print(f"   - Filler words: {filler_analysis['total_count']}")
    print(f"   - Keywords: {keyword_analysis['coverage_percentage']}%")
    print(f"   - Structure: {structure_analysis['components_present']}/4 components")
    
    # Try rule-based evaluation (fast and reliable)
    try:
        result = generate_rule_based_evaluation(
            question, answer, keyword_analysis, structure_analysis, filler_analysis
        )
        
        print("="*60)
        print(f"✅ Evaluation complete!")
        print(f"Overall Score: {result['overall_score']}%")
        print("="*60)
        
        return result
        
    except Exception as e:
        print(f"❌ Evaluation error: {e}")
        
        # Absolute fallback
        return {
            "technical_score": 50,
            "structure_score": 25,
            "communication_score": 50,
            "confidence_score": 50,
            "overall_score": 45,
            "structure_analysis": {
                "definition_present": False,
                "process_present": False,
                "method_present": False,
                "application_present": False,
                "structure_feedback": "Unable to evaluate structure"
            },
            "brief_feedback": "Basic evaluation completed. Try to follow DPMA structure.",
            "strengths": ["Answered the question"],
            "improvements": ["Follow DPMA: Definition, Process, Method, Application"],
            "filler_words_analysis": filler_analysis,
            "structure_detection": structure_analysis,
            "keyword_coverage": keyword_analysis,
            "evaluation_method": "fallback"
        }