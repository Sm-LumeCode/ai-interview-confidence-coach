"""
Real-Time AI Structured Feedback Generator
==========================================
- Generates personalized feedback using Ollama (gemma:2b)
- Called AFTER scores are displayed (non-blocking)
- Fixed: json_str referenced before assignment bug
- Simplified prompt so gemma:2b reliably returns valid JSON
"""

import requests
import json
import re

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "gemma:2b"


FEEDBACK_PROMPT_TEMPLATE = """You are an interview coach. Give feedback on this candidate's answer.

Question: {question}

Candidate's Answer: {answer}

Scores:
- Technical: {technical_score}%
- Communication: {communication_score}%
- Confidence: {confidence_score}%

Keywords expected: {keywords_expected}
Keywords covered: {keywords_covered}
Keywords missing: {keywords_missing}

Rules:
* Be specific to THIS answer
* Reference what the candidate actually said
* Keep each point to 1 sentence
* Return ONLY valid JSON, no markdown, no extra text

Return exactly this JSON:
{{
  "what_you_covered": ["point 1", "point 2", "point 3"],
  "what_you_missed": ["point 1", "point 2", "point 3"],
  "how_to_improve": ["tip 1", "tip 2", "tip 3"],
  "suggested_additions": ["addition 1", "addition 2"]
}}"""


def _call_ollama(prompt: str, timeout: int = 20) -> str | None:
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 500,
            "top_p": 0.9,
            "repeat_penalty": 1.1
        }
    }
    try:
        print(f"  [Feedback Ollama] Sending request...")
        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        print(f"  [Feedback Ollama] Status: {response.status_code}")
        if response.status_code != 200:
            return None
        raw = response.json().get("response", "").strip()
        print(f"  [Feedback Ollama] Raw ({len(raw)} chars): {raw[:120]}...")
        return raw
    except requests.exceptions.Timeout:
        print(f"  [Feedback Ollama] TIMEOUT after {timeout}s")
    except requests.exceptions.ConnectionError as e:
        print(f"  [Feedback Ollama] CONNECTION ERROR: {e}")
    except Exception as e:
        print(f"  [Feedback Ollama] ERROR: {e}")
    return None


def _extract_json(raw: str) -> dict | None:
    """Robustly extract JSON — fixes the json_str-before-assignment bug."""
    if not raw:
        return None

    # Remove markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).replace("```", "").strip()

    # Try direct parse
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        pass

    # Find first { to last }
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = cleaned[start:end + 1]
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            pass

        # Fix trailing commas
        try:
            fixed = re.sub(r",\s*([}\]])", r"\1", candidate)
            return json.loads(fixed)
        except (json.JSONDecodeError, ValueError):
            pass

    print(f"  [Feedback JSON] All extraction failed. Raw:\n{raw[:300]}")
    return None


def _validate_feedback(data: dict) -> dict:
    """Ensure all required keys exist and are lists of strings."""
    required = ["what_you_covered", "what_you_missed", "how_to_improve", "suggested_additions"]
    for key in required:
        if key not in data or not isinstance(data[key], list):
            data[key] = []
        # Ensure each item is a string
        data[key] = [str(item) for item in data[key] if item]
    return data


def generate_structured_feedback(
    question: str,
    answer: str,
    keywords: list = None,
    scores: dict = None
) -> dict:
    """
    Generate personalized AI feedback on a candidate's answer.

    Returns dict with:
        success  — bool
        feedback — dict with what_you_covered, what_you_missed, how_to_improve, suggested_additions
        method   — "llm_generated" | "fallback_generated"
    """
    keywords = keywords or []
    scores = scores or {}

    kw_coverage = scores.get("keyword_coverage", {})

    context = {
        "question": question,
        "answer": answer[:800],
        "technical_score": scores.get("technical_score", 0),
        "communication_score": scores.get("communication_score", 0),
        "confidence_score": scores.get("confidence_score", 0),
        "keywords_expected": ", ".join(keywords) if keywords else "none",
        "keywords_covered": ", ".join(kw_coverage.get("covered", [])) or "none",
        "keywords_missing": ", ".join(kw_coverage.get("missing", [])) or "none",
    }

    prompt = FEEDBACK_PROMPT_TEMPLATE.format(**context)

    print(f"\n[generate_structured_feedback] Generating for answer ({len(answer)} chars)...")

    # Try with one retry
    raw = _call_ollama(prompt, timeout=20)
    if raw is None:
        print("  [Feedback] First attempt failed, retrying...")
        raw = _call_ollama(prompt, timeout=20)

    if raw is None:
        print("  [Feedback] Both attempts failed, using fallback.")
        return generate_fallback_feedback(question, answer, keywords, scores)

    parsed = _extract_json(raw)

    if parsed is None:
        print("  [Feedback] JSON extraction failed, using fallback.")
        return generate_fallback_feedback(question, answer, keywords, scores)

    feedback = _validate_feedback(parsed)

    print(f"  [Feedback] LLM feedback generated successfully.")
    return {
        "success": True,
        "feedback": feedback,
        "method": "llm_generated"
    }


def generate_fallback_feedback(
    question: str,
    answer: str,
    keywords: list = None,
    scores: dict = None
) -> dict:
    """Fallback feedback when LLM is unavailable."""
    keywords = keywords or []
    scores = scores or {}

    kw_covered = scores.get("keyword_coverage", {}).get("covered", [])
    kw_missing = scores.get("keyword_coverage", {}).get("missing", [])

    sentences = [s.strip() for s in re.split(r"[.!?]+", answer) if len(s.strip()) > 10]

    what_covered = []
    if kw_covered:
        what_covered.append(f"You mentioned key concepts: {', '.join(kw_covered[:3])}")
    if sentences:
        what_covered.append(f"You started your answer with a relevant point about the topic")
    if not what_covered:
        what_covered.append("You attempted to answer the question")

    what_missed = []
    for kw in kw_missing[:3]:
        what_missed.append(f"No explanation of '{kw}' — this is a key concept for this question")
    if scores.get("technical_score", 0) < 50:
        what_missed.append("Limited technical depth — answer needs more detailed explanations")
    if not what_missed:
        what_missed.append("Could provide more comprehensive coverage of the topic")

    how_to_improve = [
        "Structure your answer: start with what it is, then how it works, then a real example",
        "Use more specific technical terms relevant to the question",
        "Practice speaking in complete, confident sentences without filler words",
    ]

    comm = scores.get("communication_details", {})
    if comm.get("issues"):
        how_to_improve.insert(0, f"Fix grammar: {comm['issues'][0]}")

    suggested_additions = []
    for kw in kw_missing[:2]:
        suggested_additions.append(f"Add an explanation of {kw} and why it matters here")
    suggested_additions.append("Include a real-world example to demonstrate your understanding")

    print("  [Feedback] Using fallback feedback.")
    return {
        "success": False,
        "feedback": {
            "what_you_covered": what_covered[:3],
            "what_you_missed": what_missed[:3],
            "how_to_improve": how_to_improve[:3],
            "suggested_additions": suggested_additions[:3],
        },
        "method": "fallback_generated"
    }