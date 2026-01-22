import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma:2b"

def generate_template_answer(question: str, keywords: list = None) -> dict:
    """Generate a structured template answer"""
    
    print("⚡ Generating template answer (instant)...")
    
    kw_str = ", ".join(keywords[:5]) if keywords else "key concepts"
    
    # Extract main topic from question
    topic = question.split("?")[0].replace("What is", "").replace("Explain", "").strip()
    
    template = f"""**Definition:** {topic} is a fundamental concept in technical implementations. It involves {kw_str} and plays a crucial role in modern systems.

**Process:** The process follows these steps: First, we identify the requirements and constraints. Then, we design the solution architecture. Next, we implement the core functionality using best practices. Finally, we test, optimize, and deploy the solution.

**Method:** The primary methods include using industry-standard tools and frameworks. Implementation typically involves {kw_str}. We follow established patterns with proper error handling, logging, and monitoring to ensure reliability and maintainability.

**Application:** This is widely used in real-world scenarios such as enterprise applications, scalable web services, and data-intensive systems. Common use cases include solving complex problems, improving system performance, and enabling better user experiences. It's particularly valuable in {topic.lower()} contexts where efficiency and reliability are critical."""
    
    sections = {
        "definition": f"{topic} is a fundamental concept in technical implementations. It involves {kw_str} and plays a crucial role in modern systems.",
        "process": "The process follows these steps: First, we identify the requirements and constraints. Then, we design the solution architecture. Next, we implement the core functionality using best practices. Finally, we test, optimize, and deploy the solution.",
        "method": f"The primary methods include using industry-standard tools and frameworks. Implementation typically involves {kw_str}. We follow established patterns with proper error handling, logging, and monitoring to ensure reliability and maintainability.",
        "application": f"This is widely used in real-world scenarios such as enterprise applications, scalable web services, and data-intensive systems. Common use cases include solving complex problems, improving system performance, and enabling better user experiences. It's particularly valuable in {topic.lower()} contexts where efficiency and reliability are critical."
    }
    
    return {
        "full_answer": template,
        "sections": sections,
        "word_count": len(template.split()),
        "structure": "DPMA",
        "generation_method": "template"
    }

def generate_ideal_answer(question: str, keywords: list = None) -> dict:
    """
    Generate ideal DPMA-structured answer
    Uses template generation for speed and reliability
    """
    
    print("="*60)
    print(f"💡 Generating ideal answer...")
    print(f"Question: {question[:60]}...")
    print("="*60)
    
    try:
        # Use template generation (instant, reliable)
        result = generate_template_answer(question, keywords)
        
        print("="*60)
        print(f"✅ Answer generated!")
        print(f"Word count: {result['word_count']}")
        print("="*60)
        
        return result
        
    except Exception as e:
        print(f"❌ Generation error: {e}")
        
        # Minimal fallback
        return {
            "full_answer": "A comprehensive answer following the DPMA structure would include: Definition (what it is), Process (how it works), Method (implementation approach), and Application (real-world examples).",
            "sections": {
                "definition": "The concept explained clearly.",
                "process": "Step-by-step workflow.",
                "method": "Implementation techniques.",
                "application": "Real-world use cases."
            },
            "word_count": 50,
            "structure": "DPMA",
            "generation_method": "fallback"
        }