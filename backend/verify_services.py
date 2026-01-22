#!/usr/bin/env python3
"""
Verify that service files are configured correctly
Run from backend folder
"""

import os
import re

print("="*70)
print("🔍 CHECKING SERVICE FILE CONFIGURATION")
print("="*70)

def check_file(filepath, checks):
    """Check if a file contains required configurations"""
    print(f"\n📄 Checking: {filepath}")
    
    if not os.path.exists(filepath):
        print(f"   ❌ File not found!")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    all_good = True
    
    for check_name, pattern, expected, advice in checks:
        matches = re.findall(pattern, content)
        if matches:
            value = matches[0] if matches else None
            if expected in str(value):
                print(f"   ✅ {check_name}: {value}")
            else:
                print(f"   ⚠️  {check_name}: {value}")
                print(f"      Expected: {expected}")
                print(f"      💡 {advice}")
                all_good = False
        else:
            print(f"   ❌ {check_name}: Not found")
            print(f"      💡 {advice}")
            all_good = False
    
    return all_good

# Check llm_evaluator.py
evaluator_checks = [
    (
        "Model",
        r'MODEL\s*=\s*["\']([^"\']+)["\']',
        "gemma:2b",
        "Change MODEL to 'gemma:2b' for faster evaluation"
    ),
    (
        "Ollama URL",
        r'OLLAMA_URL\s*=\s*["\']([^"\']+)["\']',
        "localhost:11434",
        "Should be 'http://localhost:11434/api/generate'"
    ),
    (
        "Temperature",
        r'["\']temperature["\']\s*:\s*([0-9.]+)',
        "0.",
        "Should be low (0.1-0.3) for consistent scoring"
    ),
]

evaluator_ok = check_file("services/llm_evaluator.py", evaluator_checks)

# Check answer_generator.py
generator_checks = [
    (
        "Model",
        r'MODEL\s*=\s*["\']([^"\']+)["\']',
        "gemma:2b",
        "Change MODEL to 'gemma:2b' for faster generation"
    ),
    (
        "Ollama URL",
        r'OLLAMA_URL\s*=\s*["\']([^"\']+)["\']',
        "localhost:11434",
        "Should be 'http://localhost:11434/api/generate'"
    ),
]

generator_ok = check_file("services/answer_generator.py", generator_checks)

# Summary
print("\n" + "="*70)
print("📋 SUMMARY")
print("="*70)

if evaluator_ok and generator_ok:
    print("\n✅ All service files are configured correctly!")
    print("\nNext steps:")
    print("   1. Run: python test_connection.py")
    print("   2. If that passes, start backend: python main.py")
else:
    print("\n⚠️  Some configuration issues found")
    print("\n🔧 How to fix:")
    print("   1. Open the files mentioned above")
    print("   2. Make the suggested changes")
    print("   3. Or replace with optimized versions from artifacts")
    
print("\n" + "="*70)

# Additional check - show first 20 lines of each file
print("\n📝 FILE PREVIEWS (first 10 lines):")
print("="*70)

for filename in ["services/llm_evaluator.py", "services/answer_generator.py"]:
    print(f"\n{filename}:")
    print("-"*70)
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            lines = f.readlines()[:10]
            for i, line in enumerate(lines, 1):
                print(f"{i:2d} | {line.rstrip()}")
    else:
        print("   [FILE NOT FOUND]")