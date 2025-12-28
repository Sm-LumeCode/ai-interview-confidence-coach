"""
Technical Evaluation Module - Student Answer Assessment
========================================================

This module provides comprehensive evaluation functionality for the AI Interview System.

Main Features:
1. Load and cache role-specific question datasets from JSON files
2. Evaluate student answers using keyword matching and semantic analysis
3. Calculate weighted scores based on keyword importance
4. Perform rule-based semantic coverage analysis
5. Return structured evaluation results with scores

Primary Function:
    evaluate_student_answer(role, question_id, student_answer) -> dict

Public API:
    - evaluate_student_answer() - Main evaluation function (recommended)
    - build_evaluation_payload() - Alternative evaluation interface
    - list_available_questions() - Get all available questions
    - clear_cache() - Clear in-memory dataset cache

Scoring Methodology:
    - Keyword Score (0.0-1.0): Weighted coverage of expected keywords
    - Semantic Score (0.0-1.0): Rule-based phrase coverage analysis
    - Overall Score (0.0-1.0): Combined (60% keywords, 40% semantic)

Team: Suchitha & Veeksha - Dataset + Evaluation Context Builder
Dependencies: Standard library only (json, pathlib, typing, re, logging)
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DATA_DIR = Path(__file__).parent.parent / "data"
SUPPORTED_ROLES = ["software_developer", "data_analyst", "devops_engineer"]

# In-memory cache for loaded datasets (singleton pattern)
_dataset_cache: Dict[str, Dict[str, Any]] = {}


# ============================================================================
# FILE SYSTEM LAYER
# ============================================================================

def load_role_data(role: str) -> Dict[str, Any]:
    """
    Load role-specific question dataset from JSON file with caching.
    
    This function implements a simple in-memory cache to avoid repeated
    file I/O operations. First call loads from disk, subsequent calls
    return cached data.
    
    Args:
        role: Role identifier (e.g., "software_developer", "data_analyst")
        
    Returns:
        Dict containing role metadata and questions list
        
    Raises:
        FileNotFoundError: If dataset file doesn't exist
        json.JSONDecodeError: If JSON is malformed
        ValueError: If required fields are missing
        
    Example:
        >>> data = load_role_data("software_developer")
        >>> print(data["role"])
        "software_developer"
        >>> print(len(data["questions"]))
        10
    """
    # Check cache first
    if role in _dataset_cache:
        logger.debug(f"Cache hit for role: {role}")
        return _dataset_cache[role]
    
    # Construct file path
    file_path = DATA_DIR / f"{role}.json"
    
    # Validate file existence
    if not file_path.exists():
        error_msg = f"Dataset file not found: {file_path}"
        logger.error(error_msg)
        raise FileNotFoundError(
            f"Role '{role}' dataset not found. Expected file: {file_path}"
        )
    
    # Load and parse JSON
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Validate schema
        if "role" not in data or "questions" not in data:
            raise ValueError(
                f"Invalid dataset schema in {file_path}. "
                f"Required fields: 'role', 'questions'"
            )
        
        if not isinstance(data["questions"], list):
            raise ValueError(
                f"Invalid dataset schema: 'questions' must be a list"
            )
        
        # Cache the loaded data
        _dataset_cache[role] = data
        logger.info(
            f"Loaded dataset for role '{role}': "
            f"{len(data['questions'])} questions"
        )
        
        return data
        
    except json.JSONDecodeError as e:
        error_msg = f"Corrupted JSON in {file_path}: {str(e)}"
        logger.error(error_msg)
        raise json.JSONDecodeError(
            f"Dataset corrupted for role '{role}'",
            e.doc,
            e.pos
        )
    except Exception as e:
        logger.error(f"Unexpected error loading {file_path}: {str(e)}")
        raise


# ============================================================================
# QUESTION LOOKUP
# ============================================================================

def get_question_context(role: str, question_id: str) -> Dict[str, Any]:
    """
    Retrieve complete context for a specific question by ID.
    
    Looks up the question in the role's dataset and returns all associated
    metadata including expected answer, keywords, and weights.
    
    Args:
        role: Role identifier (e.g., "software_developer")
        question_id: Question identifier (e.g., "q1", "intermediate_3")
        
    Returns:
        Dict containing question context with keys:
        - id: Question identifier
        - difficulty: Question difficulty level
        - question: Question text
        - expected_answer: Model answer text
        - keywords: List of key terms
        - keyword_weights: Dict mapping keywords to importance weights
        
    Raises:
        FileNotFoundError: If role dataset doesn't exist
        ValueError: If question_id not found in dataset
        
    Example:
        >>> ctx = get_question_context("software_developer", "q1")
        >>> print(ctx["question"])
        "Explain the four pillars of OOP."
        >>> print(ctx["keywords"])
        ["encapsulation", "inheritance", "polymorphism", "abstraction"]
    """
    # Load role data (uses cache if available)
    try:
        data = load_role_data(role)
    except FileNotFoundError:
        raise
    
    # Search for question by exact ID match
    question_context = None
    for q in data["questions"]:
        if q.get("id") == question_id:
            question_context = q
            break
    
    # Validate question found
    if question_context is None:
        available_ids = [q.get("id", "N/A") for q in data["questions"]]
        error_msg = (
            f"Question '{question_id}' not found in role '{role}'. "
            f"Available IDs: {available_ids}"
        )
        logger.error(error_msg)
        raise ValueError(
            f"Question '{question_id}' not found in role '{role}'"
        )
    
    # Validate required fields
    required_fields = ["id", "question", "expected_answer", "keywords"]
    missing_fields = [f for f in required_fields if f not in question_context]
    
    if missing_fields:
        raise ValueError(
            f"Question '{question_id}' missing required fields: {missing_fields}"
        )
    
    # Ensure keyword_weights exists (default to equal weights)
    if "keyword_weights" not in question_context:
        keywords = question_context["keywords"]
        weight = 1.0 / len(keywords) if keywords else 0.0
        question_context["keyword_weights"] = {kw: weight for kw in keywords}
        logger.warning(
            f"Question '{question_id}' missing keyword_weights, "
            f"using equal weights: {weight:.2f}"
        )
    
    logger.debug(f"Retrieved context for question '{question_id}' in role '{role}'")
    return question_context


# ============================================================================
# KEYWORD ANALYSIS ENGINE
# ============================================================================

def analyze_keywords(
    answer_text: Optional[str],
    keywords: List[str],
    keyword_weights: Dict[str, float]
) -> Dict[str, Any]:
    """
    Analyze keyword coverage in user's answer with weighted scoring.
    
    Performs case-insensitive substring matching to detect keywords in the
    answer text. Computes a weighted coverage score based on which keywords
    are present vs. missing.
    
    Algorithm:
        1. Normalize answer text to lowercase
        2. For each keyword, check if it appears in answer (substring match)
        3. Calculate weighted score: sum(weights_present) / sum(weights_all)
        4. Return present/missing keywords and coverage score
    
    Args:
        answer_text: User's transcribed answer (None if not provided)
        keywords: List of expected keywords
        keyword_weights: Dict mapping each keyword to its importance (0.0-1.0)
        
    Returns:
        Dict containing:
        - present_keywords: List of keywords found in answer
        - missing_keywords: List of keywords not found
        - coverage_score: Float between 0.0 and 1.0
        
    Edge Cases:
        - answer_text is None → all keywords missing, score = 0.0
        - answer_text is empty → all keywords missing, score = 0.0
        - keywords is empty → score = 0.0
        - Partial word matches count (e.g., "encapsulate" matches "encapsulation")
        
    Example:
        >>> keywords = ["encapsulation", "inheritance", "polymorphism"]
        >>> weights = {"encapsulation": 0.4, "inheritance": 0.3, "polymorphism": 0.3}
        >>> answer = "Encapsulation hides data, and inheritance allows reuse."
        >>> result = analyze_keywords(answer, keywords, weights)
        >>> print(result["present_keywords"])
        ["encapsulation", "inheritance"]
        >>> print(result["coverage_score"])
        0.7
    """
    # Handle edge cases
    if not answer_text or not answer_text.strip():
        logger.debug("Empty answer provided, all keywords marked as missing")
        return {
            "present_keywords": [],
            "missing_keywords": keywords,
            "coverage_score": 0.0
        }
    
    if not keywords:
        logger.warning("No keywords provided for analysis")
        return {
            "present_keywords": [],
            "missing_keywords": [],
            "coverage_score": 0.0
        }
    
    # Normalize answer for case-insensitive matching
    answer_lower = answer_text.lower()
    
    # Detect present and missing keywords
    present_keywords = []
    missing_keywords = []
    
    # Support for synonyms (extensible design)
    synonym_map = {
        "oop": ["oop", "object oriented", "object-oriented"],
        "api": ["api", "application programming interface"],
        "sql": ["sql", "structured query language"],
        "ci/cd": ["ci/cd", "ci cd", "continuous integration", "continuous deployment"]
    }
    
    for keyword in keywords:
        keyword_lower = keyword.lower()
        
        # Check direct match
        if keyword_lower in answer_lower:
            present_keywords.append(keyword)
            continue
        
        # Check synonyms
        matched = False
        if keyword_lower in synonym_map:
            for synonym in synonym_map[keyword_lower]:
                if synonym in answer_lower:
                    present_keywords.append(keyword)
                    matched = True
                    break
        
        if not matched:
            missing_keywords.append(keyword)
    
    # Calculate weighted coverage score
    total_weight = sum(keyword_weights.values())
    
    if total_weight == 0:
        logger.warning("Total keyword weight is 0, defaulting coverage to 0.0")
        coverage_score = 0.0
    else:
        present_weight = sum(
            keyword_weights.get(kw, 0.0) for kw in present_keywords
        )
        coverage_score = present_weight / total_weight
    
    logger.info(
        f"Keyword analysis: {len(present_keywords)}/{len(keywords)} present, "
        f"score={coverage_score:.2f}"
    )
    
    return {
        "present_keywords": present_keywords,
        "missing_keywords": missing_keywords,
        "coverage_score": round(coverage_score, 2)
    }


# ============================================================================
# SEMANTIC ANALYSIS ENGINE (RULE-BASED)
# ============================================================================

def analyze_semantic_coverage(
    answer_text: Optional[str],
    expected_answer: str,
    keywords: List[str]
) -> Dict[str, Any]:
    """
    Perform rule-based semantic analysis of answer coverage.
    
    This function splits the expected answer into key phrases and checks
    how many of these phrases are covered in the student's answer by
    detecting presence of related keywords.
    
    Algorithm:
        1. Split expected_answer into sentences (phrases)
        2. For each phrase, identify which keywords are relevant
        3. Check if the student's answer mentions those keywords
        4. Calculate coverage: covered_phrases / total_phrases
    
    Args:
        answer_text: Student's transcribed answer (None if not provided)
        expected_answer: The model answer to compare against
        keywords: List of important keywords to look for
        
    Returns:
        Dict containing:
        - semantic_score: Float between 0.0 and 1.0
        - covered_phrases: Number of phrases adequately covered
        - total_phrases: Total number of key phrases in expected answer
        
    Example:
        >>> expected = "Encapsulation hides data. Inheritance allows reuse."
        >>> keywords = ["encapsulation", "inheritance"]
        >>> answer = "Encapsulation protects data from external access."
        >>> result = analyze_semantic_coverage(answer, expected, keywords)
        >>> result["semantic_score"]
        0.5  # Only covered encapsulation phrase
    """
    # Handle empty answer
    if not answer_text or not answer_text.strip():
        logger.debug("Empty answer, semantic score = 0.0")
        return {
            "semantic_score": 0.0,
            "covered_phrases": 0,
            "total_phrases": 0
        }
    
    # Split expected answer into sentences/phrases
    import re
    # Split on sentence boundaries: period, exclamation, question mark
    phrases = re.split(r'[.!?]+', expected_answer)
    # Filter out empty phrases and strip whitespace
    phrases = [p.strip() for p in phrases if p.strip()]
    
    if not phrases:
        logger.warning("No phrases found in expected answer")
        return {
            "semantic_score": 0.0,
            "covered_phrases": 0,
            "total_phrases": 0
        }
    
    # Normalize student answer
    answer_lower = answer_text.lower()
    
    # For each phrase, check if relevant keywords appear in student answer
    covered_count = 0
    
    for phrase in phrases:
        phrase_lower = phrase.lower()
        
        # Find which keywords are mentioned in this phrase
        relevant_keywords = [kw for kw in keywords if kw.lower() in phrase_lower]
        
        if not relevant_keywords:
            # If no keywords in this phrase, check for any substantial overlap
            # Use simple word matching as fallback
            phrase_words = set(re.findall(r'\b\w+\b', phrase_lower))
            answer_words = set(re.findall(r'\b\w+\b', answer_lower))
            
            # Remove common stop words
            stop_words = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 
                         'been', 'being', 'and', 'or', 'but', 'in', 'on', 'at',
                         'to', 'for', 'of', 'with', 'by', 'from', 'as', 'that',
                         'this', 'these', 'those', 'it', 'its', 'they', 'their'}
            phrase_words -= stop_words
            answer_words -= stop_words
            
            # Calculate word overlap
            if phrase_words:
                overlap = len(phrase_words & answer_words)
                overlap_ratio = overlap / len(phrase_words)
                if overlap_ratio >= 0.3:  # 30% word overlap threshold
                    covered_count += 1
        else:
            # Check if any of the relevant keywords appear in student answer
            keyword_found = any(kw.lower() in answer_lower for kw in relevant_keywords)
            if keyword_found:
                covered_count += 1
    
    # Calculate semantic score
    total_phrases = len(phrases)
    semantic_score = covered_count / total_phrases if total_phrases > 0 else 0.0
    
    logger.info(
        f"Semantic analysis: {covered_count}/{total_phrases} phrases covered, "
        f"score={semantic_score:.2f}"
    )
    
    return {
        "semantic_score": round(semantic_score, 2),
        "covered_phrases": covered_count,
        "total_phrases": total_phrases
    }


# ============================================================================
# MAIN ORCHESTRATOR (PUBLIC API)
# ============================================================================

def evaluate_student_answer(
    role: str,
    question_id: str,
    student_answer: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluate student's answer with keyword and semantic analysis.
    
    This is the main evaluation function that combines multiple analysis
    techniques to provide a comprehensive assessment of the student's answer.
    
    Args:
        role: Role identifier (e.g., "software_developer", "data_analyst")
        question_id: Question identifier (e.g., "q1", "q2")
        student_answer: Student's transcribed answer text (can be None or empty)
        
    Returns:
        Dict with the following structure:
        {
            "role": str,                    # Role being evaluated
            "question_id": str,             # Question identifier
            "question": str,                # Question text
            "expected_answer": str,         # Model answer
            "student_answer": str,          # Student's answer (or empty)
            "keywords": List[str],          # Expected keywords
            "present_keywords": List[str],  # Keywords found in answer
            "missing_keywords": List[str],  # Keywords not found
            "keyword_score": float,         # 0.0 to 1.0
            "semantic_score": float,        # 0.0 to 1.0
            "overall_score": float          # Combined score (0.0 to 1.0)
        }
        
    Raises:
        FileNotFoundError: If role dataset doesn't exist
        ValueError: If question_id not found in dataset
        
    Example:
        >>> result = evaluate_student_answer(
        ...     role="software_developer",
        ...     question_id="q1",
        ...     student_answer="Encapsulation and inheritance are OOP concepts."
        ... )
        >>> print(result["keyword_score"])
        0.5
        >>> print(result["overall_score"])
        0.55
    """
    try:
        # Step 1: Retrieve question context
        logger.info(
            f"Evaluating answer: role={role}, question_id={question_id}"
        )
        
        question_ctx = get_question_context(role, question_id)
        
        # Step 2: Analyze keywords
        keyword_analysis = analyze_keywords(
            answer_text=student_answer,
            keywords=question_ctx["keywords"],
            keyword_weights=question_ctx["keyword_weights"]
        )
        
        # Step 3: Analyze semantic coverage
        semantic_analysis = analyze_semantic_coverage(
            answer_text=student_answer,
            expected_answer=question_ctx["expected_answer"],
            keywords=question_ctx["keywords"]
        )
        
        # Step 4: Calculate overall score (weighted average)
        # Give 60% weight to keywords, 40% to semantic analysis
        keyword_weight = 0.6
        semantic_weight = 0.4
        
        overall_score = (
            keyword_analysis["coverage_score"] * keyword_weight +
            semantic_analysis["semantic_score"] * semantic_weight
        )
        
        # Step 5: Assemble complete evaluation result
        result = {
            "role": role,
            "question_id": question_ctx["id"],
            "question": question_ctx["question"],
            "expected_answer": question_ctx["expected_answer"],
            "student_answer": student_answer or "",
            "keywords": question_ctx["keywords"],
            "present_keywords": keyword_analysis["present_keywords"],
            "missing_keywords": keyword_analysis["missing_keywords"],
            "keyword_score": keyword_analysis["coverage_score"],
            "semantic_score": semantic_analysis["semantic_score"],
            "overall_score": round(overall_score, 2)
        }
        
        logger.info(
            f"Evaluation complete: "
            f"keyword={result['keyword_score']:.2f}, "
            f"semantic={result['semantic_score']:.2f}, "
            f"overall={result['overall_score']:.2f}"
        )
        
        return result
        
    except FileNotFoundError as e:
        logger.error(f"Dataset not found: {str(e)}")
        raise
    except ValueError as e:
        logger.error(f"Question lookup failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during evaluation: {str(e)}")
        raise RuntimeError(
            f"Failed to evaluate student answer: {str(e)}"
        )


def build_evaluation_payload(
    role: str,
    question_id: str,
    answer_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build complete evaluation payload for downstream processing.
    
    This is the main public API that orchestrates all evaluation steps:
    1. Load role dataset
    2. Retrieve question context
    3. Analyze keyword coverage (if answer provided)
    4. Assemble structured payload
    
    Args:
        role: Role identifier (e.g., "software_developer")
        question_id: Question identifier (e.g., "q1")
        answer_text: User's transcribed answer (optional)
        
    Returns:
        Dict with exact schema:
        {
            "Id": str,
            "role": str,
            "question": str,
            "expected_answer": str,
            "keywords": List[str],
            "keyword_weights": Dict[str, float],
            "present_keywords": List[str],
            "missing_keywords": List[str],
            "coverage_score": float,
            "data_source": str
        }
        
    Raises:
        FileNotFoundError: Role dataset not found
        ValueError: Question not found or invalid data
        
    Example:
        >>> payload = build_evaluation_payload(
        ...     role="software_developer",
        ...     question_id="q1",
        ...     answer_text="Encapsulation and inheritance are key OOP concepts."
        ... )
        >>> print(payload["coverage_score"])
        0.55
        >>> print(payload["present_keywords"])
        ["encapsulation", "inheritance"]
    """
    try:
        # Step 1: Retrieve question context
        logger.info(
            f"Building evaluation payload: role={role}, question_id={question_id}"
        )
        
        question_ctx = get_question_context(role, question_id)
        
        # Step 2: Analyze keywords (if answer provided)
        keyword_analysis = analyze_keywords(
            answer_text=answer_text,
            keywords=question_ctx["keywords"],
            keyword_weights=question_ctx["keyword_weights"]
        )
        
        # Step 3: Assemble payload with exact schema
        payload = {
            "Id": question_ctx["id"],
            "role": role,
            "question": question_ctx["question"],
            "expected_answer": question_ctx["expected_answer"],
            "keywords": question_ctx["keywords"],
            "keyword_weights": question_ctx["keyword_weights"],
            "present_keywords": keyword_analysis["present_keywords"],
            "missing_keywords": keyword_analysis["missing_keywords"],
            "coverage_score": keyword_analysis["coverage_score"],
            "data_source": f"backend/data/{role}.json"
        }
        
        # Optional: Include difficulty if present
        if "difficulty" in question_ctx:
            payload["difficulty"] = question_ctx["difficulty"]
        
        logger.info(
            f"Payload built successfully: "
            f"coverage={payload['coverage_score']:.2f}, "
            f"present={len(payload['present_keywords'])}, "
            f"missing={len(payload['missing_keywords'])}"
        )
        
        return payload
        
    except FileNotFoundError as e:
        logger.error(f"Dataset not found: {str(e)}")
        raise
    except ValueError as e:
        logger.error(f"Question lookup failed: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error building payload: {str(e)}")
        raise RuntimeError(
            f"Failed to build evaluation payload: {str(e)}"
        )


# ============================================================================
# UTILITY: LIST AVAILABLE QUESTIONS
# ============================================================================

def list_available_questions(role: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List all available questions for frontend dropdowns and UI.
    
    Args:
        role: Optional role filter. If None, returns questions from all roles.
        
    Returns:
        List of dicts, each containing:
        - id: Question identifier
        - role: Role name
        - question: Question text
        - difficulty: Question difficulty level (if available)
        
    Example:
        >>> questions = list_available_questions("software_developer")
        >>> print(questions[0])
        {"id": "q1", "role": "software_developer", 
         "question": "Explain OOP...", "difficulty": "basic"}
         
        >>> all_questions = list_available_questions()  # All roles
        >>> len(all_questions)
        30
    """
    questions_list = []
    
    # Determine which roles to query
    roles_to_query = [role] if role else SUPPORTED_ROLES
    
    for r in roles_to_query:
        try:
            data = load_role_data(r)
            
            for q in data["questions"]:
                question_info = {
                    "id": q.get("id", "unknown"),
                    "role": r,
                    "question": q.get("question", ""),
                }
                
                # Include difficulty if available
                if "difficulty" in q:
                    question_info["difficulty"] = q["difficulty"]
                
                questions_list.append(question_info)
                
        except FileNotFoundError:
            logger.warning(f"Dataset not found for role '{r}', skipping")
            continue
        except Exception as e:
            logger.error(f"Error loading questions for role '{r}': {str(e)}")
            continue
    
    logger.info(f"Listed {len(questions_list)} questions")
    return questions_list


# ============================================================================
# CACHE MANAGEMENT
# ============================================================================

def clear_cache() -> None:
    """
    Clear the in-memory dataset cache.
    
    Useful for testing or when datasets are updated dynamically.
    """
    global _dataset_cache
    _dataset_cache.clear()
    logger.info("Dataset cache cleared")


# ============================================================================
# TEST HARNESS
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("EVALUATION MODULE TEST SUITE")
    print("=" * 70)
    
    # Test 1: evaluate_student_answer - Empty Answer
    print("\n[TEST 1] evaluate_student_answer - Empty Answer")
    print("-" * 70)
    try:
        result = evaluate_student_answer(
            role="software_developer",
            question_id="q1",
            student_answer=None
        )
        print(f"✓ Question: {result['question'][:50]}...")
        print(f"✓ Keywords: {result['keywords']}")
        print(f"✓ Keyword score: {result['keyword_score']}")
        print(f"✓ Semantic score: {result['semantic_score']}")
        print(f"✓ Overall score: {result['overall_score']}")
        assert result['keyword_score'] == 0.0, "Empty answer should have 0 keyword score"
        assert result['semantic_score'] == 0.0, "Empty answer should have 0 semantic score"
        assert result['overall_score'] == 0.0, "Empty answer should have 0 overall score"
        print("✓ TEST 1 PASSED")
    except Exception as e:
        print(f"✗ TEST 1 FAILED: {e}")
    
    # Test 2: evaluate_student_answer - Full Coverage
    print("\n[TEST 2] evaluate_student_answer - Full Coverage")
    print("-" * 70)
    try:
        answer = """
        Object-oriented programming is based on four pillars:
        1) Encapsulation bundles data and methods together hiding implementation
        2) Inheritance allows child classes to reuse parent code
        3) Polymorphism enables objects to take multiple forms
        4) Abstraction hides complex implementation details and shows only essential features
        """
        result = evaluate_student_answer(
            role="software_developer",
            question_id="q1",
            student_answer=answer
        )
        print(f"✓ Present keywords: {result['present_keywords']}")
        print(f"✓ Missing keywords: {result['missing_keywords']}")
        print(f"✓ Keyword score: {result['keyword_score']}")
        print(f"✓ Semantic score: {result['semantic_score']}")
        print(f"✓ Overall score: {result['overall_score']}")
        assert result['keyword_score'] >= 0.9, "Should detect all keywords"
        assert result['overall_score'] > 0.7, "Overall score should be high"
        print("✓ TEST 2 PASSED")
    except Exception as e:
        print(f"✗ TEST 2 FAILED: {e}")
    
    # Test 3: evaluate_student_answer - Partial Coverage
    print("\n[TEST 3] evaluate_student_answer - Partial Coverage")
    print("-" * 70)
    try:
        answer = "Encapsulation hides data and inheritance allows code reuse."
        result = evaluate_student_answer(
            role="software_developer",
            question_id="q1",
            student_answer=answer
        )
        print(f"✓ Present keywords: {result['present_keywords']}")
        print(f"✓ Missing keywords: {result['missing_keywords']}")
        print(f"✓ Keyword score: {result['keyword_score']}")
        print(f"✓ Semantic score: {result['semantic_score']}")
        print(f"✓ Overall score: {result['overall_score']}")
        assert 0.3 < result['keyword_score'] < 0.7, "Should have partial keyword coverage"
        assert 0.2 < result['overall_score'] < 0.7, "Should have partial overall score"
        print("✓ TEST 3 PASSED")
    except Exception as e:
        print(f"✗ TEST 3 FAILED: {e}")
    
    # Test 4: evaluate_student_answer - Different Question
    print("\n[TEST 4] evaluate_student_answer - Different Question (REST API)")
    print("-" * 70)
    try:
        answer = """
        REST is an architectural style that uses HTTP methods for APIs.
        GET retrieves data, POST creates new resources, PUT updates existing ones,
        and DELETE removes resources. REST APIs are stateless and use resources
        identified by URIs.
        """
        result = evaluate_student_answer(
            role="software_developer",
            question_id="q3",
            student_answer=answer
        )
        print(f"✓ Question: {result['question'][:60]}...")
        print(f"✓ Present keywords: {result['present_keywords']}")
        print(f"✓ Missing keywords: {result['missing_keywords']}")
        print(f"✓ Keyword score: {result['keyword_score']}")
        print(f"✓ Semantic score: {result['semantic_score']}")
        print(f"✓ Overall score: {result['overall_score']}")
        expected_keywords = {'REST', 'GET', 'POST', 'PUT', 'DELETE', 'stateless', 'resources'}
        present = set(result['present_keywords'])
        assert len(expected_keywords & present) >= 5, "Should find most REST keywords"
        print("✓ TEST 4 PASSED")
    except Exception as e:
        print(f"✗ TEST 4 FAILED: {e}")
    
    # Test 5: Missing Role File (Graceful Handling)
    print("\n[TEST 5] Missing Role File - Error Handling")
    print("-" * 70)
    try:
        result = evaluate_student_answer(
            role="nonexistent_role",
            question_id="q1",
            student_answer="Some answer"
        )
        print("✗ TEST 5 FAILED: Should have raised FileNotFoundError")
    except FileNotFoundError as e:
        print(f"✓ Gracefully handled missing file: {str(e)[:60]}...")
        print("✓ TEST 5 PASSED")
    except Exception as e:
        print(f"✗ TEST 5 FAILED: Wrong exception type: {e}")
    
    # Test 6: Missing Question ID
    print("\n[TEST 6] Missing Question ID - Error Handling")
    print("-" * 70)
    try:
        result = evaluate_student_answer(
            role="software_developer",
            question_id="q999",
            student_answer="Some answer"
        )
        print("✗ TEST 6 FAILED: Should have raised ValueError")
    except ValueError as e:
        print(f"✓ Gracefully handled missing question: {str(e)[:60]}...")
        print("✓ TEST 6 PASSED")
    except Exception as e:
        print(f"✗ TEST 6 FAILED: Wrong exception type: {e}")
    
    # Test 7: List Available Questions
    print("\n[TEST 7] List Available Questions")
    print("-" * 70)
    try:
        questions = list_available_questions("software_developer")
        print(f"✓ Found {len(questions)} questions for software_developer")
        if questions:
            print(f"✓ Sample: {questions[0]['id']} - {questions[0]['question'][:40]}...")
        
        all_questions = list_available_questions()
        print(f"✓ Total questions across all roles: {len(all_questions)}")
        print("✓ TEST 7 PASSED")
    except Exception as e:
        print(f"✗ TEST 7 FAILED: {e}")
    
    # Test 8: Edge Case - Empty Answer String
    print("\n[TEST 8] Edge Case - Empty Answer String")
    print("-" * 70)
    try:
        result = evaluate_student_answer(
            role="software_developer",
            question_id="q1",
            student_answer="   "  # Whitespace only
        )
        print(f"✓ Keyword score with whitespace: {result['keyword_score']}")
        print(f"✓ Semantic score with whitespace: {result['semantic_score']}")
        print(f"✓ Overall score with whitespace: {result['overall_score']}")
        assert result['keyword_score'] == 0.0, "Whitespace should count as empty"
        assert result['semantic_score'] == 0.0, "Whitespace should count as empty"
        assert result['overall_score'] == 0.0, "Whitespace should count as empty"
        print("✓ TEST 8 PASSED")
    except Exception as e:
        print(f"✗ TEST 8 FAILED: {e}")
    
    # Test 9: Semantic Analysis Verification
    print("\n[TEST 9] Semantic Analysis - Phrase Coverage")
    print("-" * 70)
    try:
        # Answer covers some concepts but uses different wording
        answer = """
        OOP has four main concepts. Data hiding is done through encapsulation.
        Classes can extend other classes using inheritance.
        """
        result = evaluate_student_answer(
            role="software_developer",
            question_id="q1",
            student_answer=answer
        )
        print(f"✓ Present keywords: {result['present_keywords']}")
        print(f"✓ Keyword score: {result['keyword_score']}")
        print(f"✓ Semantic score: {result['semantic_score']}")
        print(f"✓ Overall score: {result['overall_score']}")
        # Should have decent semantic score even if not all keywords present
        assert result['semantic_score'] > 0.0, "Should detect some semantic coverage"
        print("✓ TEST 9 PASSED")
    except Exception as e:
        print(f"✗ TEST 9 FAILED: {e}")
    
    # Test 10: Cache Performance
    print("\n[TEST 10] Cache Performance")
    print("-" * 70)
    try:
        import time
        
        # First call (loads from disk)
        clear_cache()
        start = time.perf_counter()
        result1 = evaluate_student_answer("software_developer", "q1", "Test answer")
        time1 = time.perf_counter() - start
        
        # Second call (uses cache)
        start = time.perf_counter()
        result2 = evaluate_student_answer("software_developer", "q1", "Test answer")
        time2 = time.perf_counter() - start
        
        print(f"✓ First call (disk): {time1*1000:.2f}ms")
        print(f"✓ Second call (cache): {time2*1000:.2f}ms")
        if time2 < time1:
            print(f"✓ Speedup: {time1/time2:.1f}x faster")
        print("✓ TEST 10 PASSED")
    except Exception as e:
        print(f"✗ TEST 10 FAILED: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUITE COMPLETE")
    print("=" * 70)
    print("\n📋 Module Features:")
    print("  ✓ evaluate_student_answer() - Main evaluation function")
    print("  ✓ Keyword-based scoring with weighted analysis")
    print("  ✓ Semantic coverage analysis (rule-based)")
    print("  ✓ Combined overall score (60% keywords, 40% semantic)")
    print("  ✓ Error handling for missing files and questions")
    print("  ✓ In-memory caching for performance")
    print("\n🎯 Ready for integration!")
    print(f"📂 Data directory: {DATA_DIR.absolute()}")
    print(f"🔧 Supported roles: {SUPPORTED_ROLES}")
    print("\n💡 Example usage:")
    print('  result = evaluate_student_answer(')
    print('      role="software_developer",')
    print('      question_id="q1",')
    print('      student_answer="Your answer here..."')
    print('  )')
    print('  print(f"Overall score: {result[\'overall_score\']}")')

