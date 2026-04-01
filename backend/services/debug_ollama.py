"""
Run this first: python debug_ollama.py
It will tell you EXACTLY where the problem is.
"""

import requests
import json

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "gemma:2b"

print("=" * 60)
print("STEP 1: Check if Ollama is reachable")
print("=" * 60)
try:
    r = requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
    print(f"  Status: {r.status_code}")
    models = [m["name"] for m in r.json().get("models", [])]
    print(f"  Models found: {models}")
    print("  PASS: Ollama is reachable\n")
except Exception as e:
    print(f"  FAIL: {e}")
    print("  FIX: Make sure Ollama is running (ollama serve)\n")


print("=" * 60)
print("STEP 2: Test a simple prompt (no JSON)")
print("=" * 60)
try:
    payload = {
        "model": MODEL,
        "prompt": "Say the word HELLO only. Nothing else.",
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 20}
    }
    r = requests.post(OLLAMA_URL, json=payload, timeout=30)
    print(f"  Status: {r.status_code}")
    output = r.json().get("response", "").strip()
    print(f"  Response: '{output}'")
    print("  PASS: Model is responding\n")
except Exception as e:
    print(f"  FAIL: {e}\n")


print("=" * 60)
print("STEP 3: Test JSON output with a SHORT prompt")
print("=" * 60)
short_prompt = '''Return ONLY this JSON, no other text:
{"definition": "A test definition", "process": "A test process", "method": "A test method", "application": "A test application"}'''

try:
    payload = {
        "model": MODEL,
        "prompt": short_prompt,
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 200}
    }
    r = requests.post(OLLAMA_URL, json=payload, timeout=30)
    output = r.json().get("response", "").strip()
    print(f"  Raw output:\n  {output}\n")
    parsed = json.loads(output)
    print(f"  PASS: JSON parsed correctly\n")
except json.JSONDecodeError as e:
    print(f"  FAIL: JSON parse error - {e}")
    print("  This means gemma:2b is adding extra text around JSON\n")
except Exception as e:
    print(f"  FAIL: {e}\n")


print("=" * 60)
print("STEP 4: Test actual interview answer prompt")
print("=" * 60)
actual_prompt = """You are a technical interviewer. Answer this question in JSON only.
No extra text. No markdown. Just the JSON object.

Question: What is a REST API?
Keywords: HTTP, stateless, endpoints

Return exactly this structure:
{
  "definition": "one sentence definition here",
  "process": "step by step explanation here",
  "method": "implementation approach here",
  "application": "real world example here"
}"""

try:
    payload = {
        "model": MODEL,
        "prompt": actual_prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 400,
            "top_p": 0.9
        }
    }
    r = requests.post(OLLAMA_URL, json=payload, timeout=30)
    output = r.json().get("response", "").strip()
    print(f"  Raw output:\n{output}\n")

    # Try parsing
    try:
        parsed = json.loads(output)
        print("  PASS: Direct JSON parse worked!")
    except:
        import re
        match = re.search(r'\{[\s\S]*\}', output)
        if match:
            try:
                parsed = json.loads(match.group(0))
                print("  PASS: JSON extracted via regex!")
            except:
                print("  FAIL: Even regex extraction failed")
        else:
            print("  FAIL: No JSON object found in output at all")

except Exception as e:
    print(f"  FAIL: {e}\n")

print("\n" + "=" * 60)
print("Share the output of this script to diagnose the issue.")
print("=" * 60)