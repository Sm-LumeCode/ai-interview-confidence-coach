import re
from models.filler_words import FILLER_WORDS
from utils.text_utils import (
    normalize_text,
    word_count,
    count_repeated_words
)


def count_fillers(text: str) -> int:
    """
    Count filler word occurrences using regex.
    """
    count = 0
    for filler in FILLER_WORDS:
        pattern = r"\b" + re.escape(filler) + r"\b"
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        count += len(matches)
    return count


def calculate_wpm(total_words: int, duration_seconds: float) -> int:
    """
    Calculate Words Per Minute (WPM).
    """
    if duration_seconds <= 0:
        return 0
    return int((total_words / duration_seconds) * 60)


def pace_label(wpm: int) -> str:
    """
    Label speaking pace.
    """
    if wpm < 100:
        return "slow"
    elif 100 <= wpm <= 160:
        return "good"
    else:
        return "fast"


def calculate_fluency_score(
    filler_count: int,
    wpm: int,
    repeated_words: int
) -> int:
    """
    Rule-based fluency score (0–10).
    """
    score = 10

    # Penalize fillers
    score -= min(filler_count, 5)

    # Penalize bad pacing
    if wpm < 80 or wpm > 180:
        score -= 2

    # Penalize repeated words
    score -= min(repeated_words, 3)

    return max(0, min(score, 10))


def analyze_communication(transcript: str, audio_duration: float) -> dict:
    """
    Main communication analysis function.
    """
    normalized_text = normalize_text(transcript)

    total_words = word_count(normalized_text)
    filler_count = count_fillers(normalized_text)
    wpm = calculate_wpm(total_words, audio_duration)
    pace = pace_label(wpm)
    repeated_words = count_repeated_words(normalized_text)

    fluency_score = calculate_fluency_score(
        filler_count=filler_count,
        wpm=wpm,
        repeated_words=repeated_words
    )

    return {
        "filler_count": filler_count,
        "wpm": wpm,
        "pace_label": pace,
        "fluency_score": fluency_score
    }
