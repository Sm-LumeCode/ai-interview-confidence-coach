import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:1b"

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
        # Use word boundaries to match whole words only
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
    answer_lower = answer.lower()
    covered_keywords = []
    missing_keywords = []
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        if keyword_lower in answer_lower:
            covered_keywords.append(keyword)
        else:
            missing_keywords.append(keyword)
    
    coverage_percentage = (len(covered_keywords) / len(keywords) * 100) if keywords else 0
    
    return {
        "covered": covered_keywords,
        "missing": missing_keywords,
        "coverage_percentage": round(coverage_percentage, 2)
    }

EVALUATION_PROMPT = """
You are an AI interview evaluator. Evaluate the candidate's answer using these STRICT criteria:

**EVALUATION CRITERIA:**

1. **Technical Score (0-100):**
   - Correctness of technical concepts
   - Depth of understanding
   - Use of relevant terminology
   - Practical examples given

2. **Confidence Score (0-100):**
   - Assertiveness and clarity
   - Hesitation level (penalize excessive filler words)
   - Conviction in explanations
   - Professional tone

3. **Communication Score (0-100):**
   - Clarity and structure
   - Coherence and flow
   - Grammar and articulation
   - Completeness of explanation

4. **Overall Score (0-100):**
   - Weighted average: Technical 40%, Confidence 30%, Communication 30%

**IMPORTANT GUIDELINES:**
- Be STRICT but FAIR
- Penalize heavily for:
  * Missing key concepts
  * Excessive filler words (um, uh, like, etc.)
  * Incomplete or vague answers
  * Poor structure
- Reward:
  * Clear, concise explanations
  * Correct technical terminology
  * Well-structured responses
  * Practical examples

**KEYWORD COVERAGE IMPACT:**
- The answer should cover the key topics provided
- Missing keywords = lower technical score

**FILLER WORDS IMPACT:**
- Filler words reduce confidence score significantly
- More than 5 fillers = major penalty

Return ONLY valid JSON with this EXACT format (no additional text):

{
  "technical_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "communication_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "brief_feedback": "<one detailed sentence about strengths and weaknesses>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}
"""

def evaluate_answer(question: str, answer: str, keywords: list = None):
    """
    Evaluate answer with keyword checking and filler word detection
    """
    
    # 1. Count filler words
    filler_analysis = count_filler_words(answer)
    
    # 2. Check keyword coverage
    keyword_analysis = check_keywords_coverage(keywords or [], answer) if keywords else None
    
    # 3. Build comprehensive prompt with analysis
    analysis_context = f"""

**ANSWER ANALYSIS:**
- Answer Length: {len(answer.split())} words
- Filler Words Count: {filler_analysis['total_count']}
- Filler Words Used: {', '.join(filler_analysis['filler_details'].keys()) if filler_analysis['filler_details'] else 'None'}
"""
    
    if keyword_analysis:
        analysis_context += f"""
- Keywords Coverage: {keyword_analysis['coverage_percentage']}%
- Covered Keywords: {', '.join(keyword_analysis['covered']) if keyword_analysis['covered'] else 'None'}
- Missing Keywords: {', '.join(keyword_analysis['missing']) if keyword_analysis['missing'] else 'None'}
"""
    
    full_prompt = f"""{EVALUATION_PROMPT}

{analysis_context}

**QUESTION:**
{question}

**CANDIDATE'S ANSWER:**
{answer}

Now provide the evaluation in JSON format:"""

    payload = {
        "model": MODEL,
        "prompt": full_prompt,
        "stream": False,
        "temperature": 0.3  # Lower temperature for more consistent scoring
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)

        if response.status_code != 200:
            raise Exception(f"Ollama returned status {response.status_code}")

        raw_output = response.json()["response"]
        
        # Try to extract JSON from response
        try:
            # Sometimes LLM wraps JSON in markdown
            json_match = re.search(r'\{[\s\S]*\}', raw_output)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
            else:
                result = json.loads(raw_output)
            
            # Validate required fields
            required_fields = ["technical_score", "confidence_score", "communication_score", "overall_score", "brief_feedback"]
            for field in required_fields:
                if field not in result:
                    raise ValueError(f"Missing field: {field}")
            
            # Add our analysis to the result
            result["filler_words_analysis"] = filler_analysis
            if keyword_analysis:
                result["keyword_coverage"] = keyword_analysis
            
            return result
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing LLM output: {raw_output}")
            # Return default scores if parsing fails
            return {
                "technical_score": 50,
                "confidence_score": 50,
                "communication_score": 50,
                "overall_score": 50,
                "brief_feedback": "Unable to evaluate properly due to parsing error",
                "filler_words_analysis": filler_analysis,
                "keyword_coverage": keyword_analysis,
                "error": str(e)
            }
    
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to connect to Ollama: {str(e)}")