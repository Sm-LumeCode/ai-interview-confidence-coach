import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_questions_by_role(role: str):
    file_path = os.path.join(DATA_DIR, f"{role}.json")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"No data file found for role: {role}")

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data["questions"]


def load_single_question(role: str, question_id: str):
    questions = load_questions_by_role(role)
    for q in questions:
        if q["id"] == question_id:
            return q
    return None
