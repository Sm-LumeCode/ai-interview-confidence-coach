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

def analyze_answer_structure(answer: str) -> dict:
    """
    Analyze if the answer follows the DPMA structure:
    Define → Process → Method → Application
    """
    answer_lower = answer.lower()
    
    # Structure indicators
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
    
    # Check for each component
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

EVALUATION_PROMPT = """
You are an AI interview evaluator. Evaluate the candidate's answer using STRICT criteria with emphasis on STRUCTURED RESPONSE FORMAT.

**REQUIRED ANSWER STRUCTURE (DPMA Framework):**

All technical interview answers MUST follow this structure:

1. **DEFINITION (25% weight):**
   - Clear definition of the concept
   - Fundamental understanding
   - Key terminology explained

2. **PROCESS (25% weight):**
   - Step-by-step explanation
   - How it works
   - Workflow or sequence

3. **METHOD (25% weight):**
   - Specific techniques or approaches
   - Implementation details
   - Tools or algorithms used

4. **APPLICATION (25% weight):**
   - Real-world use cases
   - Practical examples
   - When and where it's used

**SCORING CRITERIA:**

1. **Technical Score (0-100):**
   - Correctness of technical concepts (40%)
   - Depth of understanding (30%)
   - Use of relevant terminology (20%)
   - Accuracy of information (10%)

2. **Structure Score (0-100):**
   - Definition present and clear (25%)
   - Process explained step-by-step (25%)
   - Method/technique described (25%)
   - Application with examples (25%)
   - DEDUCT 25 points for EACH missing component

3. **Communication Score (0-100):**
   - Clarity and coherence (40%)
   - Logical flow (30%)
   - Grammar and articulation (20%)
   - Completeness (10%)

4. **Confidence Score (0-100):**
   - Assertiveness and conviction (40%)
   - Minimal hesitation (30%)
   - Professional tone (20%)
   - Low filler word usage (10%)

5. **Overall Score (0-100):**
   - Technical: 35%
   - Structure: 30%
   - Communication: 20%
   - Confidence: 15%

**STRICT PENALTIES:**
- Missing Definition: -25 points from structure score
- Missing Process: -25 points from structure score
- Missing Method: -25 points from structure score
- Missing Application: -25 points from structure score
- Excessive filler words (>5): -10 to -30 from confidence score
- Missing keywords: -5 points per missing keyword from technical score
- Incomplete answer: -20 points from communication score

**REWARDS:**
- Complete DPMA structure: +10 bonus to overall
- Clear examples: +5 to application component
- Step-by-step explanation: +5 to process component
- Precise terminology: +5 to technical score

Return ONLY valid JSON with this EXACT format (no additional text):

{
  "technical_score": <number 0-100>,
  "structure_score": <number 0-100>,
  "communication_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "structure_analysis": {
    "definition_present": <true/false>,
    "process_present": <true/false>,
    "method_present": <true/false>,
    "application_present": <true/false>,
    "structure_feedback": "<specific feedback on structure>"
  },
  "brief_feedback": "<one detailed sentence about overall performance>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}
"""

def evaluate_answer(question: str, answer: str, keywords: list = None):
    """
    Evaluate answer with structure analysis, keyword checking, and filler word detection
    """
    
    # 1. Count filler words
    filler_analysis = count_filler_words(answer)
    
    # 2. Check keyword coverage
    keyword_analysis = check_keywords_coverage(keywords or [], answer) if keywords else None
    
    # 3. Analyze answer structure (DPMA)
    structure_analysis = analyze_answer_structure(answer)
    
    # 4. Build comprehensive prompt with analysis
    analysis_context = f"""

**ANSWER ANALYSIS:**
- Answer Length: {len(answer.split())} words
- Filler Words Count: {filler_analysis['total_count']}
- Filler Words Used: {', '.join(filler_analysis['filler_details'].keys()) if filler_analysis['filler_details'] else 'None'}

**STRUCTURE ANALYSIS (DPMA Framework):**
- Definition Present: {'✓ Yes' if structure_analysis['structure_found']['definition'] else '✗ No - PENALTY'}
- Process Present: {'✓ Yes' if structure_analysis['structure_found']['process'] else '✗ No - PENALTY'}
- Method Present: {'✓ Yes' if structure_analysis['structure_found']['method'] else '✗ No - PENALTY'}
- Application Present: {'✓ Yes' if structure_analysis['structure_found']['application'] else '✗ No - PENALTY'}
- Structure Completeness: {structure_analysis['components_present']}/4 components ({structure_analysis['structure_score']}%)
- Missing Components: {', '.join(structure_analysis['missing_components']) if structure_analysis['missing_components'] else 'None'}
"""
    
    if keyword_analysis:
        analysis_context += f"""
**KEYWORD COVERAGE:**
- Coverage: {keyword_analysis['coverage_percentage']}%
- Covered Keywords: {', '.join(keyword_analysis['covered']) if keyword_analysis['covered'] else 'None'}
- Missing Keywords: {', '.join(keyword_analysis['missing']) if keyword_analysis['missing'] else 'None'}
"""
    
    full_prompt = f"""{EVALUATION_PROMPT}

{analysis_context}

**QUESTION:**
{question}

**CANDIDATE'S ANSWER:**
{answer}

Evaluate strictly according to the DPMA structure framework. Provide the evaluation in JSON format:"""

    payload = {
        "model": MODEL,
        "prompt": full_prompt,
        "stream": False,
        "temperature": 0.2  # Very low temperature for consistent scoring
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)

        if response.status_code != 200:
            raise Exception(f"Ollama returned status {response.status_code}")

        raw_output = response.json()["response"]
        
        # Try to extract JSON from response
        try:
            json_match = re.search(r'\{[\s\S]*\}', raw_output)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
            else:
                result = json.loads(raw_output)
            
            # Validate required fields
            required_fields = [
                "technical_score", "structure_score", "communication_score", 
                "confidence_score", "overall_score", "brief_feedback"
            ]
            for field in required_fields:
                if field not in result:
                    raise ValueError(f"Missing field: {field}")
            
            # Add our analysis to the result
            result["filler_words_analysis"] = filler_analysis
            result["structure_detection"] = structure_analysis
            if keyword_analysis:
                result["keyword_coverage"] = keyword_analysis
            
            return result
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing LLM output: {raw_output}")
            # Return default scores if parsing fails
            return {
                "technical_score": 50,
                "structure_score": 0,
                "communication_score": 50,
                "confidence_score": 50,
                "overall_score": 40,
                "structure_analysis": {
                    "definition_present": False,
                    "process_present": False,
                    "method_present": False,
                    "application_present": False,
                    "structure_feedback": "Unable to evaluate structure"
                },
                "brief_feedback": "Unable to evaluate properly due to parsing error",
                "strengths": [],
                "improvements": ["Follow DPMA structure: Definition, Process, Method, Application"],
                "filler_words_analysis": filler_analysis,
                "structure_detection": structure_analysis,
                "keyword_coverage": keyword_analysis,
                "error": str(e)
            }
    
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to connect to Ollama: {str(e)}")