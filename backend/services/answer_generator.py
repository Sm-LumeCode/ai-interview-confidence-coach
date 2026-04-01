"""
LLM-Based Ideal Answer Generator
==================================
- Asks gemma:2b for PLAIN TEXT (not JSON) so it focuses on quality
- Python handles all structure and formatting
- full_answer  → natural interview paragraph
- sections     → DPMA breakdown
"""

import requests
import json
import re

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "gemma:2b"


# ── Prompt 1: Plain text paragraph ───────────────────────────────────────────
# No JSON — gemma:2b writes much better when not forced into JSON format

PARAGRAPH_PROMPT = """You are a software engineer in a job interview. Answer this question out loud in 4-5 sentences.

Rules:
- Speak naturally like a confident engineer, not like a textbook
- Do NOT use bullet points, headers, bold text, or numbered lists
- Do NOT say "Definition:", "Process:", "Method:", "Application:"
- Just speak in plain flowing sentences
- Include: what it is, how it works, a real example
- Maximum 100 words

Question: {question}

Answer:"""


# ── Prompt 2: DPMA — one section at a time ───────────────────────────────────
# Asking for all 4 at once confuses gemma:2b. Ask individually.

DEFINITION_PROMPT = """In one sentence, define what "{topic}" is. 
Do not repeat the question. Just give a clean, direct definition.
Definition:"""

PROCESS_PROMPT = """In 2 sentences, explain how "{topic}" works step by step.
Do not repeat the question. Focus on the mechanics.
Explanation:"""

METHOD_PROMPT = """In one sentence, explain how engineers implement or use "{topic}" in practice.
Implementation:"""

APPLICATION_PROMPT = """Give one specific real-world example of where "{topic}" is used and why.
Example:"""


def _call_ollama(prompt: str, timeout: int = 30, max_tokens: int = 200) -> str | None:
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": max_tokens,
            "top_p": 0.9,
            "repeat_penalty": 1.2,
            "stop": ["\n\n", "Question:", "Rules:"]  # stop before it starts a new section
        }
    }
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        if response.status_code != 200:
            print(f"  [Ollama] Error status: {response.status_code}")
            return None
        raw = response.json().get("response", "").strip()
        return raw
    except requests.exceptions.Timeout:
        print(f"  [Ollama] TIMEOUT after {timeout}s")
    except requests.exceptions.ConnectionError as e:
        print(f"  [Ollama] CONNECTION ERROR: {e}")
    except Exception as e:
        print(f"  [Ollama] ERROR: {e}")
    return None


def _clean_text(text: str) -> str:
    """Remove markdown, labels, numbering the model might add."""
    # Remove bold markdown
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    # Remove headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove DPMA labels
    text = re.sub(r'\b(Definition|Process|Method|Application|Answer|Explanation|Implementation|Example)\s*:\s*',
                  '', text, flags=re.IGNORECASE)
    # Remove numbered lists
    text = re.sub(r'^\s*\d+[\.\)]\s*', '', text, flags=re.MULTILINE)
    # Remove bullet points
    text = re.sub(r'^\s*[\-•*]\s*', '', text, flags=re.MULTILINE)
    # Collapse newlines into spaces
    text = re.sub(r'\n+', ' ', text)
    # Collapse multiple spaces
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def _extract_topic(question: str) -> str:
    """Extract a clean short topic from the question."""
    q = question.strip().rstrip("?")
    # Remove question starters
    for phrase in [
        "what are", "what is", "explain", "describe", "how does", "how do",
        "why is", "why are", "when should", "what do you mean by",
        "can you explain", "tell me about"
    ]:
        q = re.sub(rf"^\s*{phrase}\s+", "", q, flags=re.IGNORECASE).strip()
    # Take first 5 words max
    words = q.split()
    return " ".join(words[:5]) if words else "this concept"


def _fallback_paragraph(question: str, keywords: list) -> str:
    kw_str = ", ".join(keywords[:3]) if keywords else "relevant techniques"
    topic = _extract_topic(question)
    return (
        f"{topic.capitalize()} is an essential practice in modern software engineering "
        f"that helps teams work more efficiently and deliver better results. "
        f"It involves using {kw_str} to streamline workflows and reduce manual effort. "
        f"In real-world projects, teams apply these practices to ship features faster, "
        f"catch bugs early, and maintain high-quality systems at scale."
    )


def _fallback_sections(question: str, keywords: list) -> dict:
    kw_str = ", ".join(keywords[:3]) if keywords else "relevant techniques"
    topic = _extract_topic(question)
    return {
        "definition": f"{topic.capitalize()} refers to a set of practices and principles that improve how software teams build, test, and deliver applications using {kw_str}.",
        "process": f"It works by automating repetitive tasks, enabling continuous integration and delivery, and fostering collaboration between development and operations teams.",
        "method": f"Engineers implement it using tools and workflows like {kw_str}, ensuring code is tested, reviewed, and deployed consistently.",
        "application": f"For example, companies like Netflix and Amazon use these practices to deploy thousands of times per day while maintaining system stability.",
    }


def generate_ideal_answer(question: str, keywords: list = None) -> dict:
    """
    Generate ideal interview answer.

    Returns:
        full_answer  — natural interview paragraph
        sections     — DPMA dict
        word_count   — int
        structure    — "DPMA"
        source       — "llm" | "fallback"
    """
    keywords = keywords or []
    topic = _extract_topic(question)
    print(f"\n[generate_ideal_answer] Q: {question[:60]} | Topic: {topic}")

    # ── Step 1: Get natural paragraph (plain text, no JSON) ──────────────────
    para_raw = _call_ollama(
        PARAGRAPH_PROMPT.format(question=question.strip()),
        timeout=30,
        max_tokens=180
    )
    if not para_raw:
        para_raw = _call_ollama(
            PARAGRAPH_PROMPT.format(question=question.strip()),
            timeout=30,
            max_tokens=180
        )

    paragraph = ""
    para_source = "fallback"
    if para_raw:
        paragraph = _clean_text(para_raw)
        if len(paragraph.split()) >= 20:  # must be substantial
            para_source = "llm"
        else:
            paragraph = ""

    if not paragraph:
        paragraph = _fallback_paragraph(question, keywords)

    # ── Step 2: Get DPMA sections (one call each, plain text) ────────────────
    sections = {}

    prompts = {
        "definition":  DEFINITION_PROMPT.format(topic=topic),
        "process":     PROCESS_PROMPT.format(topic=topic),
        "method":      METHOD_PROMPT.format(topic=topic),
        "application": APPLICATION_PROMPT.format(topic=topic),
    }

    for key, prompt in prompts.items():
        raw = _call_ollama(prompt, timeout=15, max_tokens=100)
        if raw:
            cleaned = _clean_text(raw)
            if len(cleaned.split()) >= 5:
                sections[key] = cleaned

    # Fill any missing sections with fallback
    fallback = _fallback_sections(question, keywords)
    for key in ["definition", "process", "method", "application"]:
        if key not in sections or not sections[key]:
            sections[key] = fallback[key]

    dpma_source = "llm" if len([k for k in sections if sections[k]]) == 4 else "fallback"
    source = "llm" if para_source == "llm" else "fallback"

    print(f"  [Done] para={para_source}, dpma={dpma_source}, words={len(paragraph.split())}")

    return {
        "full_answer": paragraph,
        "sections": sections,
        "word_count": len(paragraph.split()),
        "structure": "DPMA",
        "source": source
    }