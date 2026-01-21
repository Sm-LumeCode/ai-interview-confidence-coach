"""
Simple Answer Generator - Template-based, instant generation
"""

def generate_ideal_answer(question: str, keywords: list = None) -> dict:
    """
    Generate ideal DPMA-structured answer using templates.
    Completes instantly without LLM dependency.
    """
    
    keywords = keywords or []
    kw_str = ", ".join(keywords[:5]) if keywords else "key technical concepts"
    
    # Extract topic from question
    topic = question.replace("?", "").replace("What is", "").replace("Explain", "").replace("Describe", "").strip()
    if not topic:
        topic = "the concept"
    
    # Generate DPMA structured answer
    definition = f"{topic.capitalize()} is a fundamental concept that involves {kw_str}. It plays a critical role in modern software development and system design by providing structured approaches to solving technical challenges."
    
    process = f"The process of implementing {topic} follows these key steps: First, we analyze the requirements and constraints. Then, we design the solution architecture considering scalability and maintainability. Next, we implement the core functionality using industry best practices. Finally, we test, optimize, and deploy the solution while monitoring for performance."
    
    method = f"The primary methods for working with {topic} include using proven frameworks and design patterns. Implementation typically involves {kw_str} with proper error handling, logging, and documentation. We follow established coding standards and conduct thorough code reviews to ensure quality."
    
    application = f"In real-world applications, {topic} is widely used across various industries. Common use cases include building scalable web applications, processing large datasets, optimizing system performance, and solving complex business problems. It's particularly valuable in scenarios requiring {kw_str} where reliability and efficiency are paramount."
    
    full_answer = f"{definition}\n\n{process}\n\n{method}\n\n{application}"
    
    return {
        "full_answer": full_answer,
        "sections": {
            "definition": definition,
            "process": process,
            "method": method,
            "application": application
        },
        "word_count": len(full_answer.split()),
        "structure": "DPMA"
    }