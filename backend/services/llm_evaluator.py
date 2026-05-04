import json
import re

from services.groq_client import call_groq_chat


FEEDBACK_PROMPT_TEMPLATE = """Give personalized feedback on this student's interview answer.

Question: {question}

Student answer: {answer}

Scores:
- Technical: {technical_score}%
- Communication: {communication_score}%
- Confidence: {confidence_score}%

Keywords expected: {keywords_expected}
Keywords covered: {keywords_covered}
Keywords missing: {keywords_missing}

Rules:
- Be specific to this answer.
- Use simple, practical student-friendly language.
- Keep each item useful and human-sounding.
- Return only valid JSON. No markdown. No extra text.

Return exactly this JSON shape:
{{
  "what_you_covered": ["point 1", "point 2", "point 3"],
  "what_you_missed": ["point 1", "point 2", "point 3"],
  "how_to_improve": ["tip 1", "tip 2", "tip 3"],
  "suggested_additions": ["addition 1", "addition 2"]
}}"""


def _call_llm(prompt: str, timeout: int = 25) -> str | None:
    return call_groq_chat(
        prompt,
        timeout=timeout,
        max_tokens=650,
        temperature=0.3,
    )


def _extract_json(raw: str) -> dict | None:
    if not raw:
        return None

    cleaned = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE).replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = cleaned[start:end + 1]
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            pass

        try:
            fixed = re.sub(r",\s*([}\]])", r"\1", candidate)
            return json.loads(fixed)
        except (json.JSONDecodeError, ValueError):
            pass

    print(f"  [Feedback JSON] Extraction failed. Raw:\n{raw[:300]}")
    return None


def _validate_feedback(data: dict) -> dict:
    required = ["what_you_covered", "what_you_missed", "how_to_improve", "suggested_additions"]
    for key in required:
        if key not in data or not isinstance(data[key], list):
            data[key] = []
        data[key] = [str(item) for item in data[key] if item]
    return data


def generate_structured_feedback(
    question: str,
    answer: str,
    keywords: list = None,
    scores: dict = None,
) -> dict:
    """Generate structured feedback ONLY through Groq API. NO FALLBACK."""
    keywords = keywords or []
    scores = scores or {}
    kw_coverage = scores.get("keyword_coverage", {})

    context = {
        "question": question,
        "answer": answer[:1200],
        "technical_score": scores.get("technical_score", 0),
        "communication_score": scores.get("communication_score", 0),
        "confidence_score": scores.get("confidence_score", 0),
        "keywords_expected": ", ".join(keywords) if keywords else "none",
        "keywords_covered": ", ".join(kw_coverage.get("covered", []) or kw_coverage.get("found", [])) or "none",
        "keywords_missing": ", ".join(kw_coverage.get("missing", [])) or "none",
    }

    prompt = FEEDBACK_PROMPT_TEMPLATE.format(**context)

    print(f"\n[generate_structured_feedback] Generating for answer ({len(answer)} chars) via Groq API...")
    raw = _call_llm(prompt, timeout=25)
    
    if raw is None:
        print("  [Feedback] ❌ Groq API call failed. Retrying once...")
        raw = _call_llm(prompt, timeout=25)

    if raw is None:
        print("  [Feedback] ❌ FAILED: Groq API unavailable. Returning error.")
        raise Exception("Groq API feedback generation failed. No fallback available.")

    parsed = _extract_json(raw)
    if parsed is None:
        print("  [Feedback] ❌ FAILED: Could not parse JSON from Groq response.")
        raise Exception("Groq API returned invalid JSON. No fallback available.")

    print("  [Feedback] ✅ Successfully generated via Groq API")
    return {
        "success": True,
        "feedback": _validate_feedback(parsed),
        "method": "groq_generated",
    }

