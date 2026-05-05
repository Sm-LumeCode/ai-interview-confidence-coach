import re

from services.groq_client import call_groq_chat


PARAGRAPH_PROMPT = """Interview question: {question}

Write a strong sample answer for a student preparing for interviews.
Make it one natural paragraph of 6-8 sentences, around 120-160 words.
Cover what the concept is, how it works, why it matters, and one real-world example.
Keep it human, clear, and practical.
Do not use bullet points, headers, markdown, or numbered lists.
Do not say "Sure", "Great question", "Certainly", or repeat the question.
Start directly with the answer."""


BULLETS_PROMPT = """Interview question: {question}
Keywords to cover if relevant: {keywords}

List 5 to 7 short points a student should remember for this interview question.
Each point should be specific, useful, and easy to revise.
Start each line with a dash.
Do not write an introduction, heading, or summary."""


def _call_llm(prompt: str, timeout: int = 25, max_tokens: int = 350) -> str | None:
    return call_groq_chat(
        prompt,
        timeout=timeout,
        max_tokens=max_tokens,
        temperature=0.35,
    )


def _clean_paragraph(text: str) -> str:
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"^#+\s+", "", text, flags=re.MULTILINE)

    preamble_patterns = [
        r"^(Sure[,!.]?|Great question[.!]?|Certainly[.!]?|Of course[.!]?|Absolutely[.!]?)\s*",
        r"^(Here is|Here's|Let me explain|I'll explain|Allow me)[^.]*\.\s*",
        r"^(In this answer|To answer this)[^.]*\.\s*",
    ]
    for pattern in preamble_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE | re.MULTILINE)

    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def _parse_bullets(text: str) -> list[str]:
    lines = text.splitlines()
    bullets = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        line = re.sub(r"^[\-*•\d]+[\.\)]?\s*", "", line).strip()
        line = re.sub(r"\*\*(.*?)\*\*", r"\1", line)
        line = re.sub(r"\*(.*?)\*", r"\1", line)

        if re.match(r"^(here are|key points|remember|summary)", line, re.IGNORECASE):
            continue
        if len(line.split()) < 4:
            continue

        bullets.append(line)

    return bullets[:7]


def _extract_topic(question: str) -> str:
    q = question.strip().rstrip("?")
    for phrase in [
        "what are", "what is", "explain", "describe", "how does", "how do",
        "why is", "why are", "when should", "what do you mean by",
        "can you explain", "tell me about", "differentiate between",
        "compare", "what are the differences between",
    ]:
        q = re.sub(rf"^\s*{phrase}\s+", "", q, flags=re.IGNORECASE).strip()
    words = q.split()
    return " ".join(words[:6]) if words else "this concept"


def _fallback_paragraph(question: str, keywords: list) -> str:
    keyword_text = ", ".join(keywords[:4]) if keywords else "the core ideas behind it"
    topic = _extract_topic(question)
    return (
        f"{topic.capitalize()} is an important interview concept because it helps explain how a system or program behaves in real situations. "
        f"At a basic level, it connects to {keyword_text}, so a good answer should define the idea first and then explain why it is useful. "
        f"In practice, students should focus on the problem it solves, the way it works, and the trade-offs involved. "
        f"For example, in a real project, this concept may affect how data is stored, how performance is handled, or how reliable the application becomes. "
        f"A strong interview answer should stay simple, use the correct terms, and include one example that proves you understand the concept beyond memorizing a definition."
    )


def _fallback_bullets(question: str, keywords: list) -> list[str]:
    keyword_text = ", ".join(keywords[:3]) if keywords else "the main technical terms"
    topic = _extract_topic(question)
    return [
        f"Start by defining {topic} in one simple sentence.",
        f"Mention the important terms, especially {keyword_text}.",
        "Explain the problem it solves instead of only giving a textbook definition.",
        "Add one small real-world example from an app, website, or project.",
        "Include one benefit and one limitation if the question allows it.",
        "End with why the concept matters in practical software development.",
    ]


def generate_ideal_answer(question: str, keywords: list = None) -> dict:
    keywords = keywords or []
    keyword_display = ", ".join(keywords[:6]) if keywords else "none"

    print(f"\n[generate_ideal_answer] Q: {question[:60]}")
    print(f"[generate_ideal_answer] Keywords: {keyword_display}")

    # Generate paragraph from LLM
    paragraph_raw = _call_llm(
        PARAGRAPH_PROMPT.format(question=question.strip()),
        timeout=25,
        max_tokens=360,
    )

    paragraph = ""
    paragraph_source = "fallback"
    if paragraph_raw:
        paragraph = _clean_paragraph(paragraph_raw)
        word_count = len(paragraph.split())
        print(f"[generate_ideal_answer] LLM paragraph: {word_count} words")
        if word_count >= 30:
            paragraph_source = "llm"
            print(f"[generate_ideal_answer] OK: Using LLM paragraph (meets {word_count} >= 30 word requirement)")
        else:
            paragraph = ""
            print(f"[generate_ideal_answer] WARNING: LLM paragraph too short ({word_count} < 30 words), using fallback")
    else:
        print(f"[generate_ideal_answer] WARNING: LLM paragraph call failed, using fallback")

    if not paragraph:
        paragraph = _fallback_paragraph(question, keywords)

    # Generate bullets from LLM
    bullets_raw = _call_llm(
        BULLETS_PROMPT.format(question=question.strip(), keywords=keyword_display),
        timeout=20,
        max_tokens=260,
    )

    bullets = _parse_bullets(bullets_raw) if bullets_raw else []
    print(f"[generate_ideal_answer] LLM bullets: {len(bullets)} parsed")
    if len(bullets) < 3:
        if bullets_raw:
            print(f"[generate_ideal_answer] WARNING: Only {len(bullets)} bullets parsed from LLM, using fallback")
        else:
            print(f"[generate_ideal_answer] WARNING: LLM bullets call failed, using fallback")
        bullets = _fallback_bullets(question, keywords)
    else:
        print(f"[generate_ideal_answer] OK: Using LLM bullets ({len(bullets)} bullets)")

    final_word_count = len(paragraph.split())
    print(f"[generate_ideal_answer] Final result: {final_word_count} words, {len(bullets)} bullets, source={paragraph_source}")
    
    return {
        "full_answer": paragraph,
        "bullets": bullets,
        "word_count": final_word_count,
        "source": paragraph_source,
    }
