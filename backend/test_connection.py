#!/usr/bin/env python3
"""
Quick diagnostic script to test your setup
Run this from the backend folder
"""

import sys
import os

print("="*70)
print("🔍 TESTING YOUR INTERVIEW APP SETUP")
print("="*70)

# Test 1: Check imports
print("\n1️⃣ Testing Python imports...")
try:
    from services.llm_evaluator import evaluate_answer
    from services.answer_generator import generate_ideal_answer
    print("   ✅ Service imports successful")
except ImportError as e:
    print(f"   ❌ Import error: {e}")
    sys.exit(1)

# Test 2: Check Ollama connection
print("\n2️⃣ Testing Ollama connection...")
try:
    import requests
    response = requests.get("http://localhost:11434/api/tags", timeout=5)
    if response.status_code == 200:
        models = response.json().get('models', [])
        model_names = [m.get('name', '') for m in models]
        print(f"   ✅ Ollama is running")
        print(f"   📦 Available models: {', '.join(model_names)}")
        
        # Check for gemma:2b
        if 'gemma:2b' in model_names:
            print("   ✅ gemma:2b model found")
        else:
            print("   ⚠️  gemma:2b not found, available models:")
            for name in model_names:
                print(f"      - {name}")
    else:
        print(f"   ❌ Ollama returned status: {response.status_code}")
except Exception as e:
    print(f"   ❌ Cannot connect to Ollama: {e}")
    print("   💡 Fix: Run 'ollama serve' in another terminal")
    sys.exit(1)

# Test 3: Test model response
print("\n3️⃣ Testing Gemma 2B response...")
try:
    import requests
    payload = {
        "model": "gemma:2b",
        "prompt": "Say 'test' in one word.",
        "stream": False,
        "options": {
            "num_predict": 5
        }
    }
    
    print("   ⏳ Sending test prompt to Gemma...")
    import time
    start = time.time()
    
    response = requests.post(
        "http://localhost:11434/api/generate",
        json=payload,
        timeout=30
    )
    
    elapsed = time.time() - start
    
    if response.status_code == 200:
        result = response.json()
        answer = result.get('response', '').strip()
        print(f"   ✅ Model responded in {elapsed:.1f}s: '{answer}'")
    else:
        print(f"   ❌ Model error: {response.status_code}")
        print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ❌ Model test failed: {e}")

# Test 4: Test evaluation function
print("\n4️⃣ Testing evaluation function...")
try:
    test_question = "What is Python?"
    test_answer = "Python is a high-level programming language used for web development and data science."
    test_keywords = ["python", "programming"]
    
    print("   ⏳ Running evaluation...")
    import time
    start = time.time()
    
    result = evaluate_answer(test_question, test_answer, test_keywords)
    
    elapsed = time.time() - start
    
    print(f"   ✅ Evaluation completed in {elapsed:.1f}s")
    print(f"   📊 Scores:")
    print(f"      - Technical: {result.get('technical_score', 0)}%")
    print(f"      - Structure: {result.get('structure_score', 0)}%")
    print(f"      - Overall: {result.get('overall_score', 0)}%")
    
    if elapsed > 25:
        print(f"   ⚠️  SLOW! Expected <20s, got {elapsed:.1f}s")
        print("   💡 Consider using tinyllama for faster response")
    
except Exception as e:
    print(f"   ❌ Evaluation failed: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Test answer generation
print("\n5️⃣ Testing answer generation...")
try:
    test_question = "What is Git?"
    test_keywords = ["version control", "git"]
    
    print("   ⏳ Generating ideal answer...")
    import time
    start = time.time()
    
    result = generate_ideal_answer(test_question, test_keywords)
    
    elapsed = time.time() - start
    
    print(f"   ✅ Answer generated in {elapsed:.1f}s")
    print(f"   📝 Word count: {result.get('word_count', 0)}")
    
    if elapsed > 30:
        print(f"   ⚠️  SLOW! Expected <25s, got {elapsed:.1f}s")
    
except Exception as e:
    print(f"   ❌ Answer generation failed: {e}")
    import traceback
    traceback.print_exc()

# Test 6: Check backend server
print("\n6️⃣ Testing backend API...")
try:
    import requests
    response = requests.get("http://localhost:8000/health", timeout=5)
    if response.status_code == 200:
        print("   ✅ Backend API is running")
    else:
        print(f"   ❌ Backend returned: {response.status_code}")
except Exception as e:
    print(f"   ⚠️  Backend not running (this is OK if you haven't started it yet)")
    print("   💡 Start with: python main.py")

# Summary
print("\n" + "="*70)
print("📋 SUMMARY")
print("="*70)

print("\n✅ If all tests passed:")
print("   1. Start backend: python main.py")
print("   2. Start frontend: cd ../frontend && npm run dev")
print("   3. Test in browser: http://localhost:3000")

print("\n⚠️  If tests failed:")
print("   - Check the error messages above")
print("   - Make sure Ollama is running: ollama serve")
print("   - Verify gemma:2b is installed: ollama list")
print("   - Update service files with optimized versions")

print("\n" + "="*70)