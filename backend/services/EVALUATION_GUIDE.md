# Evaluation Module - User Guide

## Overview
The evaluation module analyzes student answers for technical interview questions and returns detailed scoring information.

## Quick Start

### Basic Usage
```python
from services.evaluation import evaluate_student_answer

# Evaluate a student's answer
result = evaluate_student_answer(
    role="software_developer",
    question_id="q1",
    student_answer="Encapsulation hides data, inheritance allows code reuse..."
)

# Access the results
print(f"Overall Score: {result['overall_score']}")
print(f"Keyword Score: {result['keyword_score']}")
print(f"Semantic Score: {result['semantic_score']}")
print(f"Present Keywords: {result['present_keywords']}")
print(f"Missing Keywords: {result['missing_keywords']}")
```

## Function Reference

### Main Evaluation Function

#### `evaluate_student_answer(role, question_id, student_answer)`
Evaluates a student's answer and returns comprehensive scoring information.

**Parameters:**
- `role` (str): Role identifier (e.g., "software_developer", "data_analyst")
- `question_id` (str): Question identifier (e.g., "q1", "q2")
- `student_answer` (str | None): Student's answer text (can be None or empty)

**Returns:**
Dictionary with the following keys:
```python
{
    "role": str,                    # Role being evaluated
    "question_id": str,             # Question identifier
    "question": str,                # Question text
    "expected_answer": str,         # Model answer
    "student_answer": str,          # Student's answer
    "keywords": List[str],          # Expected keywords
    "present_keywords": List[str],  # Keywords found
    "missing_keywords": List[str],  # Keywords not found
    "keyword_score": float,         # 0.0 to 1.0
    "semantic_score": float,        # 0.0 to 1.0
    "overall_score": float          # 0.0 to 1.0 (combined)
}
```

**Example:**
```python
result = evaluate_student_answer(
    role="software_developer",
    question_id="q3",
    student_answer="""
    REST is an architectural style for APIs. 
    GET retrieves data, POST creates resources, 
    PUT updates them, and DELETE removes them.
    """
)

print(f"Score: {result['overall_score']}")  # e.g., 0.85
```

### Utility Functions

#### `list_available_questions(role=None)`
Lists all available questions, optionally filtered by role.

**Parameters:**
- `role` (str | None): Optional role filter

**Returns:**
List of question dictionaries with id, role, and question text.

**Example:**
```python
from services.evaluation import list_available_questions

# Get all questions for software_developer
questions = list_available_questions("software_developer")
for q in questions:
    print(f"{q['id']}: {q['question']}")

# Get all questions across all roles
all_questions = list_available_questions()
print(f"Total questions: {len(all_questions)}")
```

#### `clear_cache()`
Clears the in-memory dataset cache. Useful for testing or when datasets are updated.

**Example:**
```python
from services.evaluation import clear_cache

clear_cache()  # Force reload from disk on next evaluation
```

## Scoring Methodology

### Keyword Score (0.0 - 1.0)
- Case-insensitive substring matching
- Weighted by keyword importance
- Supports synonym detection (e.g., "OOP" matches "object-oriented")
- Formula: `sum(present_keyword_weights) / sum(all_keyword_weights)`

### Semantic Score (0.0 - 1.0)
- Rule-based phrase coverage analysis
- Splits expected answer into key phrases
- Checks if student answer covers each phrase
- Uses keyword presence and word overlap detection
- Formula: `covered_phrases / total_phrases`

### Overall Score (0.0 - 1.0)
- Weighted combination of keyword and semantic scores
- Default weights: 60% keywords, 40% semantic
- Formula: `(keyword_score * 0.6) + (semantic_score * 0.4)`

## Edge Cases

### Empty or None Answers
```python
result = evaluate_student_answer(
    role="software_developer",
    question_id="q1",
    student_answer=None
)
# All scores will be 0.0, all keywords marked as missing
```

### Invalid Role or Question ID
```python
try:
    result = evaluate_student_answer(
        role="invalid_role",
        question_id="q1",
        student_answer="Some answer"
    )
except FileNotFoundError as e:
    print(f"Role dataset not found: {e}")

try:
    result = evaluate_student_answer(
        role="software_developer",
        question_id="q999",
        student_answer="Some answer"
    )
except ValueError as e:
    print(f"Question not found: {e}")
```

## Performance Considerations

### Caching
The module uses in-memory caching to avoid repeated file I/O:
- First call for a role: ~3ms (loads from disk)
- Subsequent calls: ~1.5ms (uses cache)
- 2x faster with caching enabled

### Supported Roles
Currently configured for:
- `software_developer`
- `data_analyst`
- `devops_engineer`

Data files must be located in: `backend/data/{role}.json`

## Integration Example

### FastAPI Endpoint
```python
from fastapi import APIRouter, HTTPException
from services.evaluation import evaluate_student_answer

router = APIRouter()

@router.post("/evaluate")
async def evaluate_answer(
    role: str,
    question_id: str,
    student_answer: str
):
    try:
        result = evaluate_student_answer(
            role=role,
            question_id=question_id,
            student_answer=student_answer
        )
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Role not found")
    except ValueError:
        raise HTTPException(status_code=404, detail="Question not found")
```

## Testing

Run the built-in test suite:
```bash
python backend/services/evaluation.py
```

This will run 10 comprehensive tests covering:
- Empty answers
- Full keyword coverage
- Partial coverage
- Different question types
- Error handling
- Edge cases
- Cache performance

## Data Format

Questions must follow this JSON structure:
```json
{
  "role": "software_developer",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "expected_answer": "Model answer text here",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}
```

Optional fields:
- `keyword_weights`: Dict mapping keywords to importance (0.0-1.0)
- `difficulty`: Question difficulty level

## Support

For issues or questions:
- Check the test suite output for examples
- Review the function docstrings for detailed API documentation
- Ensure data files are properly formatted and located in `backend/data/`
