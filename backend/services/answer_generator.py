import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:1b"

ANSWER_GENERATION_PROMPT = """
You are an expert technical interview coach. Generate a PERFECT, STRUCTURED answer to the given interview question.

**MANDATORY STRUCTURE (DPMA Framework):**

Your answer MUST follow this exact structure:

1. **DEFINITION (Define the concept)**
   - Start with: "Let me define [concept]..."
   - Provide a clear, concise definition
   - Explain what it is in simple terms
   - Include key terminology

2. **PROCESS (Explain how it works)**
   - Start with: "The process works as follows..."
   - Break down into clear steps
   - Use: "First...", "Then...", "Next...", "Finally..."
   - Explain the workflow or sequence

3. **METHOD (Describe the technique/approach)**
   - Start with: "The method/technique used is..."
   - Explain specific implementation approaches
   - Mention algorithms, tools, or frameworks
   - Describe HOW it's implemented

4. **APPLICATION (Give real-world examples)**
   - Start with: "In practical applications..."
   - Provide 2-3 concrete real-world examples
   - Explain when and where it's used
   - Mention specific use cases or industries

**ANSWER REQUIREMENTS:**
- Length: 200-300 words
- Professional and confident tone
- Technical accuracy
- Clear transitions between sections
- Include all keywords provided
- No filler words (um, uh, like, etc.)
- Structured paragraphs for each section

**KEYWORDS TO INCLUDE:**
{keywords}

**QUESTION:**
{question}

Generate the PERFECT answer following the DPMA structure. Start your response directly with the answer, no preamble:
"""

def generate_ideal_answer(question: str, keywords: list = None) -> dict:
    """
    Generate an ideal structured answer for the given question
    following the DPMA framework (Define, Process, Method, Application)
    """
    
    keywords_str = ", ".join(keywords) if keywords else "Use relevant technical terms"
    
    prompt = ANSWER_GENERATION_PROMPT.format(
        question=question,
        keywords=keywords_str
    )
    
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "temperature": 0.7  # Higher temperature for more natural answers
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        
        if response.status_code != 200:
            raise Exception(f"Ollama returned status {response.status_code}")
        
        raw_output = response.json()["response"]
        
        # Clean up the answer
        answer_text = raw_output.strip()
        
        # Try to split into DPMA sections
        sections = parse_dpma_sections(answer_text)
        
        return {
            "full_answer": answer_text,
            "sections": sections,
            "word_count": len(answer_text.split()),
            "structure": "DPMA"
        }
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to connect to Ollama: {str(e)}")

def parse_dpma_sections(answer_text: str) -> dict:
    """
    Parse the generated answer into DPMA sections
    """
    
    # Try to identify sections based on keywords
    sections = {
        "definition": "",
        "process": "",
        "method": "",
        "application": ""
    }
    
    # Split by common section indicators
    lines = answer_text.split('\n')
    current_section = None
    
    for line in lines:
        line_lower = line.lower()
        
        if any(keyword in line_lower for keyword in ["define", "definition", "let me define", "is defined as"]):
            current_section = "definition"
        elif any(keyword in line_lower for keyword in ["process", "works as follows", "steps are", "first"]):
            current_section = "process"
        elif any(keyword in line_lower for keyword in ["method", "technique", "approach", "implementation"]):
            current_section = "method"
        elif any(keyword in line_lower for keyword in ["application", "practical", "real-world", "used for", "example"]):
            current_section = "application"
        
        if current_section and line.strip():
            sections[current_section] += line + " "
    
    # If sections weren't clearly marked, try to split by content
    if not any(sections.values()):
        paragraphs = [p.strip() for p in answer_text.split('\n\n') if p.strip()]
        if len(paragraphs) >= 4:
            sections["definition"] = paragraphs[0]
            sections["process"] = paragraphs[1]
            sections["method"] = paragraphs[2]
            sections["application"] = paragraphs[3]
        else:
            # If still can't parse, put everything in full answer
            sections["definition"] = answer_text
    
    # Clean up sections
    for key in sections:
        sections[key] = sections[key].strip()
    
    return sections