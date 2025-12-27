import re


def normalize_text(text: str) -> str:
    """
    Convert text to lowercase and remove extra spaces.
    """
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def word_count(text: str) -> int:
    """
    Count total words in the text.
    """
    words = re.findall(r"\b\w+\b", text)
    return len(words)


def split_sentences(text: str) -> list:
    """
    Split text into sentences using punctuation.
    """
    sentences = re.split(r"[.!?]+", text)
    return [s.strip() for s in sentences if s.strip()]


def count_repeated_words(text: str) -> int:
    """
    Detect consecutive repeated words like 'the the', 'I I'.
    """
    words = re.findall(r"\b\w+\b", text.lower())
    repeat_count = 0

    for i in range(len(words) - 1):
        if words[i] == words[i + 1]:
            repeat_count += 1

    return repeat_count
