#!/usr/bin/env python3
"""
Test the actual answer_generator function
"""

import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 70)
print("🧪 TESTING ANSWER GENERATOR")
print("=" * 70)

from services.answer_generator import generate_ideal_answer, _call_llm

# Test 1: Simple LLM call
print("\n[TEST 1] Testing _call_llm directly...")
test_prompt = "What is an API? Explain in one paragraph."
result = _call_llm(test_prompt, timeout=25, max_tokens=150)
print(f"Prompt: {test_prompt}")
print(f"Result type: {type(result)}")
print(f"Result: {result if result else 'None (FALLBACK USED)'}")

# Test 2: Full answer generation
print("\n[TEST 2] Testing generate_ideal_answer...")
question = "What is the difference between continuous delivery and continuous deployment?"
keywords = ["CI/CD", "automation", "deployment"]
result = generate_ideal_answer(question, keywords)

print(f"\nQuestion: {question}")
print(f"Keywords: {keywords}")
print(f"\nResult:")
print(f"  Source: {result['source']}")
print(f"  Word count: {result['word_count']}")
print(f"  Full answer: {result['full_answer'][:200]}...")
print(f"  Bullets: {result['bullets'][:2]}")
