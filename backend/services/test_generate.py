"""
Run this from the SAME folder as answer_generator.py:
  python test_generate.py

This will show exactly where the fallback is triggered.
"""

from answer_generator import generate_ideal_answer

print("\n" + "=" * 60)
print("Testing generate_ideal_answer() directly")
print("=" * 60)

result = generate_ideal_answer(
    question="What is a REST API?",
    keywords=["HTTP", "stateless", "endpoints"]
)

print("\n--- RESULT ---")
print(f"source    : {result['source']}")   # 'llm' or 'fallback'
print(f"word_count: {result['word_count']}")
print(f"structure : {result['structure']}")
print("\n--- SECTIONS ---")
for key, val in result['sections'].items():
    print(f"\n[{key.upper()}]\n{val}")
print("\n--- FULL ANSWER ---")
print(result['full_answer'])