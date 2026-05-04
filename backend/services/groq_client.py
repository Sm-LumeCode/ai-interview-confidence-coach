import os
from typing import Dict, List, Optional
import time

import requests


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
MAX_RETRIES = 3
RETRY_DELAY = 0.5  # seconds

INTERVIEW_COACH_SYSTEM_PROMPT = """You are an interview coach for students.
Give clear, practical, human-sounding answers.
Do not sound robotic or overly formal.
Explain concepts in simple language.
Use examples where helpful.
Give detailed but not boring answers.
Focus on what the student can improve next."""


def call_groq_chat(
    user_prompt: str,
    *,
    system_prompt: str = INTERVIEW_COACH_SYSTEM_PROMPT,
    timeout: int = 20,
    max_tokens: int = 600,
    temperature: float = 0.35,
) -> Optional[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("  [Groq] ❌ GROQ_API_KEY is missing, using fallback.")
        return None

    payload = {
        "model": os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL),
        "messages": _build_messages(system_prompt, user_prompt),
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 0.9,
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # Retry logic for transient failures
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=timeout)
            
            if response.status_code == 200:
                choices = response.json().get("choices", [])
                if not choices:
                    print(f"  [Groq] ⚠️  No choices in response, using fallback.")
                    return None
                
                content = choices[0].get("message", {}).get("content", "").strip()
                if content:
                    print(f"  [Groq] ✅ SUCCESS (attempt {attempt + 1}/{MAX_RETRIES})")
                    return content
                else:
                    print(f"  [Groq] ⚠️  Empty content in response, using fallback.")
                    return None
            
            # Handle rate limiting with exponential backoff
            elif response.status_code == 429:
                wait_time = RETRY_DELAY * (2 ** attempt)
                if attempt < MAX_RETRIES - 1:
                    print(f"  [Groq] ⏱️  Rate limited. Retrying in {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"  [Groq] ❌ Rate limited after {MAX_RETRIES} attempts, using fallback.")
                    return None
            
            # Handle other HTTP errors
            else:
                error_msg = response.text[:200]
                print(f"  [Groq] ❌ HTTP {response.status_code}: {error_msg}, using fallback.")
                return None
                
        except requests.exceptions.Timeout:
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (2 ** attempt)
                print(f"  [Groq] ⏱️  TIMEOUT after {timeout}s. Retrying in {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})...")
                time.sleep(wait_time)
            else:
                print(f"  [Groq] ❌ TIMEOUT after {MAX_RETRIES} attempts, using fallback.")
                return None
                
        except requests.exceptions.ConnectionError as exc:
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (2 ** attempt)
                print(f"  [Groq] 🔗 CONNECTION ERROR: {str(exc)[:80]}. Retrying in {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})...")
                time.sleep(wait_time)
            else:
                print(f"  [Groq] ❌ CONNECTION ERROR after {MAX_RETRIES} attempts: {exc}, using fallback.")
                return None
                
        except Exception as exc:
            print(f"  [Groq] ❌ UNEXPECTED ERROR: {exc}")
            import traceback
            traceback.print_exc()
            return None

    return None


def _build_messages(system_prompt: str, user_prompt: str) -> List[Dict[str, str]]:
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
