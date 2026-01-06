from fastapi import APIRouter, HTTPException
import json, os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

@router.get("/questions/{category}")
def get_questions(category: str):
    file_path = os.path.join(DATA_DIR, f"{category}.json")

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"No questions found for role: {category}"
        )

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data if isinstance(data, list) else data.get("questions", [])
