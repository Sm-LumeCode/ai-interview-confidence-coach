"""
Simple Example - Using the Evaluation Module

This script demonstrates basic usage of the evaluation module
for beginners who want to understand how to evaluate student answers.
"""

from evaluation import evaluate_student_answer, list_available_questions

def main():
    print("=" * 70)
    print("EVALUATION MODULE - BEGINNER'S GUIDE")
    print("=" * 70)
    
    # Example 1: List available questions
    print("\n📋 Example 1: List Available Questions")
    print("-" * 70)
    questions = list_available_questions("software_developer")
    print(f"Found {len(questions)} questions:\n")
    for i, q in enumerate(questions, 1):
        print(f"{i}. [{q['id']}] {q['question'][:60]}...")
    
    # Example 2: Evaluate a good answer
    print("\n\n✅ Example 2: Evaluating a Good Answer")
    print("-" * 70)
    good_answer = """
    Object-oriented programming has four main pillars:
    
    1. Encapsulation: This bundles data and methods together in a class,
       hiding the internal implementation details from the outside.
    
    2. Inheritance: This allows classes to inherit properties and methods
       from parent classes, promoting code reuse.
    
    3. Polymorphism: This enables objects to take multiple forms, allowing
       the same interface to work with different data types.
    
    4. Abstraction: This hides complex implementation details and shows
       only the essential features to the user.
    """
    
    result = evaluate_student_answer(
        role="software_developer",
        question_id="q1",
        student_answer=good_answer
    )
    
    print(f"Question: {result['question']}\n")
    print(f"📊 Scores:")
    print(f"  • Keyword Score:  {result['keyword_score']} / 1.0")
    print(f"  • Semantic Score: {result['semantic_score']} / 1.0")
    print(f"  • Overall Score:  {result['overall_score']} / 1.0")
    print(f"\n✓ Present Keywords: {', '.join(result['present_keywords'])}")
    print(f"✗ Missing Keywords: {', '.join(result['missing_keywords']) if result['missing_keywords'] else 'None'}")
    
    # Example 3: Evaluate a partial answer
    print("\n\n⚠️  Example 3: Evaluating a Partial Answer")
    print("-" * 70)
    partial_answer = "OOP has encapsulation which hides data, and inheritance for code reuse."
    
    result = evaluate_student_answer(
        role="software_developer",
        question_id="q1",
        student_answer=partial_answer
    )
    
    print(f"Student Answer: {partial_answer}\n")
    print(f"📊 Scores:")
    print(f"  • Keyword Score:  {result['keyword_score']} / 1.0")
    print(f"  • Semantic Score: {result['semantic_score']} / 1.0")
    print(f"  • Overall Score:  {result['overall_score']} / 1.0")
    print(f"\n✓ Present Keywords: {', '.join(result['present_keywords'])}")
    print(f"✗ Missing Keywords: {', '.join(result['missing_keywords'])}")
    
    # Example 4: Evaluate an empty answer
    print("\n\n❌ Example 4: Evaluating an Empty Answer")
    print("-" * 70)
    result = evaluate_student_answer(
        role="software_developer",
        question_id="q1",
        student_answer=""
    )
    
    print(f"Student Answer: (empty)\n")
    print(f"📊 Scores:")
    print(f"  • Keyword Score:  {result['keyword_score']} / 1.0")
    print(f"  • Semantic Score: {result['semantic_score']} / 1.0")
    print(f"  • Overall Score:  {result['overall_score']} / 1.0")
    print(f"\n✗ Missing Keywords: {', '.join(result['missing_keywords'])}")
    
    # Example 5: Different question type
    print("\n\n🌐 Example 5: Different Question Type (REST API)")
    print("-" * 70)
    rest_answer = """
    REST stands for Representational State Transfer. It's an architectural
    style for building APIs that use HTTP methods. The main HTTP methods are:
    - GET for retrieving data
    - POST for creating new resources
    - PUT for updating existing resources
    - DELETE for removing resources
    REST APIs should be stateless and use resources identified by URIs.
    """
    
    result = evaluate_student_answer(
        role="software_developer",
        question_id="q3",
        student_answer=rest_answer
    )
    
    print(f"Question: {result['question'][:60]}...\n")
    print(f"📊 Scores:")
    print(f"  • Keyword Score:  {result['keyword_score']} / 1.0")
    print(f"  • Semantic Score: {result['semantic_score']} / 1.0")
    print(f"  • Overall Score:  {result['overall_score']} / 1.0")
    print(f"\n✓ Present Keywords: {', '.join(result['present_keywords'])}")
    print(f"✗ Missing Keywords: {', '.join(result['missing_keywords']) if result['missing_keywords'] else 'None'}")
    
    # Example 6: Understanding the scores
    print("\n\n📚 Example 6: Understanding the Scoring System")
    print("-" * 70)
    print("""
    The evaluation system uses three scores:
    
    1. Keyword Score (0.0 - 1.0)
       - Measures how many expected keywords appear in the answer
       - Uses case-insensitive matching
       - Weighted by keyword importance
    
    2. Semantic Score (0.0 - 1.0)
       - Measures how well the answer covers key concepts
       - Analyzes phrase coverage from the expected answer
       - Uses rule-based text analysis
    
    3. Overall Score (0.0 - 1.0)
       - Combines keyword and semantic scores
       - Formula: (keyword_score × 0.6) + (semantic_score × 0.4)
       - Gives more weight to keywords (60%) than semantics (40%)
    
    💡 Tip: A good answer should have:
       - Overall Score ≥ 0.7 for proficient understanding
       - Overall Score ≥ 0.85 for excellent understanding
    """)
    
    print("\n" + "=" * 70)
    print("✨ End of Examples - You're ready to use the evaluation module!")
    print("=" * 70)
    
    print("\n💡 Next Steps:")
    print("  1. Try evaluating your own answers")
    print("  2. Experiment with different question IDs (q1, q2, q3, q4, q5)")
    print("  3. See how keyword presence affects the scores")
    print("  4. Check the EVALUATION_GUIDE.md for more details")


if __name__ == "__main__":
    main()
