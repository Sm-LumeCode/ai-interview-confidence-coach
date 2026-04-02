"""
LLM-Based Ideal Answer Generator
==================================
Changes from v1:
- Paragraph prompt: 120-150 words, no word limit stopping good answers mid-thought
- Section prompts: rewritten as direct Q&A — model answers immediately, no echoing
- Structure: DPMA removed; replaced with 5-7 concise bullet points for easy recall
- stop tokens: removed "\n\n" so model doesn't cut off mid-paragraph
- min word gate raised: paragraph must be >=30 words to count as valid
"""

import requests
import json
import re

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "gemma:2b"


# ── Prompt 1: Detailed natural paragraph ─────────────────────────────────────
# Target: 120-150 words so the model covers the concept properly.
# No "\n\n" stop token — that was cutting answers short.
# Framed as a direct answer, not as instructions the model might echo.

PARAGRAPH_PROMPT = """You are a senior software engineer giving a confident, clear answer in a job interview.

Interview question: {question}

Write your answer as one flowing paragraph of 6-8 sentences (around 120-150 words).
Cover: what it is, how it works internally, why it matters, and one real-world example of where it is used.
Do NOT use bullet points, headers, bold text, or numbered lists.
Do NOT say phrases like "Sure," "Great question," "Certainly," or repeat the question back.
Start your answer directly with the concept itself.

Answer:"""


# ── Prompt 2: Bullet points for quick recall ─────────────────────────────────
# Instead of 4 DPMA calls we now do ONE call asking for 5-7 bullet points.
# Framed as "List the key things to remember" — model answers directly.
# Using a few-shot example line to anchor the format.

BULLETS_PROMPT = """Interview question: {question}
Keywords to cover if relevant: {keywords}

List 5 to 7 short bullet points that cover the most important things to remember when answering this question in an interview.
Each bullet point should be one clear sentence — specific, factual, and useful.
Do NOT label or number them. Start each line with a dash (-).
Do NOT write headers, introductions, or summaries — only the bullet lines.
Do NOT say "Sure," "Here are," or any preamble. Start immediately with the first dash.

-"""


def _call_ollama(prompt: str, timeout: int = 40, max_tokens: int = 300) -> str | None:
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.35,
            "num_predict": max_tokens,
            "top_p": 0.9,
            "repeat_penalty": 1.15,
            # Removed "\n\n" from stop — it was terminating paragraphs too early.
            # Only stop on these clear restart signals:
            "stop": ["Question:", "Interview question:", "Keywords:", "List "]
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


def _clean_paragraph(text: str) -> str:
    """
    Clean a paragraph response:
    - Strip bold/italic markdown
    - Remove any headers
    - Remove preamble phrases the model might add
    - Collapse to clean flowing text
    """
    # Remove markdown
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)

    # Remove preamble filler lines
    preamble_patterns = [
        r"^(Sure[,!.]?|Great question[.!]?|Certainly[.!]?|Of course[.!]?|Absolutely[.!]?)\s*",
        r"^(Here is|Here's|Let me explain|I'll explain|Allow me)[^.]*\.\s*",
        r"^(In this answer|To answer this)[^.]*\.\s*",
    ]
    for pat in preamble_patterns:
        text = re.sub(pat, '', text, flags=re.IGNORECASE | re.MULTILINE)

    # Collapse multiple newlines into a single space
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def _parse_bullets(text: str) -> list[str]:
    """
    Parse bullet lines from model output.
    Accepts lines starting with -, •, *, or plain sentences.
    Returns a list of clean strings (no leading dash/bullet).
    """
    # Prepend the dash that was used as part of the prompt ending
    full_text = "- " + text if not text.startswith("-") else text

    lines = full_text.split("\n")
    bullets = []
    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Strip leading bullet chars
        line = re.sub(r'^[\-•*\d]+[\.\)]\s*', '', line).strip()

        # Remove markdown bold/italic
        line = re.sub(r'\*\*(.*?)\*\*', r'\1', line)
        line = re.sub(r'\*(.*?)\*', r'\1', line)

        # Skip meta/header-like lines
        if re.match(r'^(here are|key points|remember|note:|tip:|summary)', line, re.IGNORECASE):
            continue
        if len(line.split()) < 4:  # too short to be useful
            continue

        bullets.append(line)

    return bullets[:7]  # cap at 7


def _extract_topic(question: str) -> str:
    """Extract a clean short topic from the question."""
    q = question.strip().rstrip("?")
    for phrase in [
        "what are", "what is", "explain", "describe", "how does", "how do",
        "why is", "why are", "when should", "what do you mean by",
        "can you explain", "tell me about", "differentiate between",
        "compare", "what are the differences between"
    ]:
        q = re.sub(rf"^\s*{phrase}\s+", "", q, flags=re.IGNORECASE).strip()
    words = q.split()
    return " ".join(words[:6]) if words else "this concept"


# ── Fallbacks ─────────────────────────────────────────────────────────────────

def _fallback_paragraph(question: str, keywords: list) -> str:
    kw_str = ", ".join(keywords[:4]) if keywords else "core technical concepts"
    topic = _extract_topic(question)
    return (
        f"{topic.capitalize()} is a fundamental concept in modern software engineering "
        f"that every developer is expected to understand deeply. "
        f"At its core, it revolves around {kw_str}, which together define how the system "
        f"behaves and why it is designed a certain way. "
        f"In practice, engineers use this knowledge when designing systems, debugging issues, "
        f"and making architectural decisions that need to scale. "
        f"For example, large-scale platforms like Google, Amazon, and Netflix rely on these "
        f"principles to serve millions of users reliably every day. "
        f"Understanding not just the what but also the why behind {topic} is what separates "
        f"a good engineer from a great one."
    )


def _fallback_bullets(question: str, keywords: list) -> list[str]:
    kw_str = ", ".join(keywords[:3]) if keywords else "core techniques"
    topic = _extract_topic(question)
    return [
        f"{topic.capitalize()} is a core concept that directly impacts system design and code quality.",
        f"Key terms to know: {kw_str} — be ready to define and use each one.",
        f"Always explain not just what it is, but why it exists and what problem it solves.",
        f"Give a concrete real-world example to demonstrate your understanding.",
        f"Mention trade-offs or limitations — interviewers appreciate nuanced thinking.",
        f"Connect it to your own project experience if possible for extra credibility.",
    ]


# ── Main function ─────────────────────────────────────────────────────────────

def generate_ideal_answer(question: str, keywords: list = None) -> dict:
    """
    Generate ideal interview answer.

    Returns:
        full_answer  — natural interview paragraph (120-150 words)
        bullets      — list of 5-7 key point strings (for quick recall UI)
        word_count   — int
        source       — "llm" | "fallback"
    """
    keywords = keywords or []
    topic = _extract_topic(question)
    kw_display = ", ".join(keywords[:6]) if keywords else "none"
    print(f"\n[generate_ideal_answer] Q: {question[:60]} | Topic: {topic}")

    # ── Step 1: Detailed paragraph ────────────────────────────────────────────
    para_raw = _call_ollama(
        PARAGRAPH_PROMPT.format(question=question.strip()),
        timeout=40,
        max_tokens=280   # enough for 150 words
    )
    if not para_raw:
        print("  [Paragraph] First attempt failed, retrying...")
        para_raw = _call_ollama(
            PARAGRAPH_PROMPT.format(question=question.strip()),
            timeout=40,
            max_tokens=280
        )

    paragraph = ""
    para_source = "fallback"
    if para_raw:
        paragraph = _clean_paragraph(para_raw)
        word_ct = len(paragraph.split())
        print(f"  [Paragraph] Got {word_ct} words from LLM")
        if word_ct >= 30:
            para_source = "llm"
        else:
            print(f"  [Paragraph] Too short ({word_ct} words), using fallback")
            paragraph = ""

    if not paragraph:
        paragraph = _fallback_paragraph(question, keywords)

    # ── Step 2: Bullet points for quick recall ────────────────────────────────
    bullets_raw = _call_ollama(
        BULLETS_PROMPT.format(
            question=question.strip(),
            keywords=kw_display
        ),
        timeout=35,
        max_tokens=250
    )

    bullets = []
    bullets_source = "fallback"
    if bullets_raw:
        bullets = _parse_bullets(bullets_raw)
        print(f"  [Bullets] Got {len(bullets)} bullets from LLM")
        if len(bullets) >= 3:
            bullets_source = "llm"
        else:
            print(f"  [Bullets] Too few ({len(bullets)}), using fallback")
            bullets = []

    if not bullets:
        bullets = _fallback_bullets(question, keywords)

    source = "llm" if para_source == "llm" else "fallback"
    print(f"  [Done] para={para_source}, bullets={bullets_source}, words={len(paragraph.split())}, bullet_count={len(bullets)}")

    return {
        "full_answer": paragraph,
        "bullets": bullets,          # NEW: replaces sections/DPMA
        "word_count": len(paragraph.split()),
        "source": source
    }