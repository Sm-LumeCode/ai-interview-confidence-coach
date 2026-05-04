#!/usr/bin/env python3
"""
Debug Groq API integration
Run this to identify the exact issue preventing Groq calls
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment
load_dotenv()

print("=" * 70)
print("🔍 GROQ API DEBUG SCRIPT")
print("=" * 70)

# Step 1: Check environment variables
print("\n[STEP 1] Checking environment variables...")
groq_api_key = os.getenv("GROQ_API_KEY")
groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if groq_api_key:
    print(f"  ✅ GROQ_API_KEY found: {groq_api_key[:20]}...{groq_api_key[-10:]}")
else:
    print(f"  ❌ GROQ_API_KEY NOT FOUND")
    print("  Fix: Add GROQ_API_KEY to .env file")
    exit(1)

print(f"  ✅ GROQ_MODEL: {groq_model}")

# Step 2: Test API endpoint
print("\n[STEP 2] Testing Groq API endpoint...")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

payload = {
    "model": groq_model,
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Say the word HELLO only."}
    ],
    "temperature": 0.35,
    "max_tokens": 50,
    "top_p": 0.9,
    "stream": False,
}

headers = {
    "Authorization": f"Bearer {groq_api_key}",
    "Content-Type": "application/json",
}

print(f"  URL: {GROQ_API_URL}")
print(f"  Model: {groq_model}")
print(f"  Headers: Authorization: Bearer {groq_api_key[:20]}...")
print(f"  Payload: {json.dumps(payload, indent=2)}")

try:
    print("\n  Sending request...")
    response = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=20)
    
    print(f"  Status Code: {response.status_code}")
    print(f"  Response Headers: {dict(response.headers)}")
    print(f"  Response Body: {response.text[:500]}")
    
    if response.status_code == 200:
        print("\n  ✅ SUCCESS!")
        result = response.json()
        message = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        print(f"  Message: {message}")
    else:
        print(f"\n  ❌ ERROR!")
        print(f"  Status: {response.status_code}")
        try:
            error_detail = response.json()
            print(f"  Error: {json.dumps(error_detail, indent=2)}")
        except:
            print(f"  Error: {response.text}")
            
except requests.exceptions.Timeout as e:
    print(f"  ❌ TIMEOUT: {e}")
    print("  Fix: Check your internet connection or increase timeout")
except requests.exceptions.ConnectionError as e:
    print(f"  ❌ CONNECTION ERROR: {e}")
    print("  Fix: Check internet connection or Groq API availability")
except Exception as e:
    print(f"  ❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
