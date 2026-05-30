import os
import json
import re
import time
from google import genai

# ================================
# CONFIG
# ================================

DEBUG_MODE = True   # Set False in production
MODEL_NAME = "gemini-2.5-flash"

# 🔴 DIRECT API KEY (LOCAL TESTING ONLY)
# ❗ Revoke & rotate this key after testing
# GEMINI_API_KEY = "gemini api key"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ================================
# LOGGER
# ================================

def log(message: str):
    if DEBUG_MODE:
        print(f"[DEBUG] {message}")


# ================================
# GEMINI CLIENT
# ================================

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is empty")

client = genai.Client(api_key=GEMINI_API_KEY)


# ================================
# PROMPT LOADER
# ================================

PROMPT_FOLDER = os.path.join(os.path.dirname(__file__), "prompts")

def load_prompt(filename: str) -> str:
    path = os.path.join(PROMPT_FOLDER, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ================================
# LLM CALL
# ================================

def call_llm(prompt: str) -> str:
    """
    Sends a prompt to Gemini and returns raw output text.
    """
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={"temperature": 0.2}
        )
        return response.text or ""
    except Exception as e:
        print("LLM ERROR:", e)
        return "{}"


# ================================
# JSON EXTRACTION
# ================================

def extract_json(text: str) -> str:
    """
    Extract first JSON object from text.
    """
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return match.group(0)
    except Exception:
        pass
    return text


# ================================
# SAFE JSON PARSER
# ================================

def safe_json_parse(text: str) -> dict:
    cleaned = extract_json(text)
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    # Direct parse
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Repair attempts
    try:
        repaired = cleaned
        repaired = re.sub(r",\s*}", "}", repaired)
        repaired = re.sub(r",\s*]", "]", repaired)
        repaired = re.sub(r"(\w+)\s*:", r'"\1":', repaired)
        return json.loads(repaired)
    except Exception:
        return {}


# ================================
# VALIDATORS
# ================================

def validate_list_field(data: dict, field: str):
    value = data.get(field, [])
    return value if isinstance(value, list) else []


def normalize_string_list(items):
    if not isinstance(items, list):
        return []

    cleaned = []
    for item in items:
        if isinstance(item, str):
            cleaned.append(item.strip())
        elif isinstance(item, dict):
            cleaned.append(", ".join(f"{k}: {v}" for k, v in item.items()))
    return cleaned


# ================================
# RETRY LOGIC
# ================================

def call_llm_with_retry(prompt: str, max_retries: int = 2, interval: float = 0.5):
    attempt = 0
    last_output = "{}"

    while attempt <= max_retries:
        log(f"LLM attempt {attempt + 1} of {max_retries + 1}")

        raw = call_llm(prompt)
        last_output = raw

        parsed = safe_json_parse(raw)
        if parsed:
            return parsed

        log("Parse failed. Retrying...")
        attempt += 1
        time.sleep(interval)

    log("All retries failed.")
    return safe_json_parse(last_output) or {}


# ================================
# MAIN FEEDBACK GENERATOR
# ================================

def generate_feedback(jd_text: str, cv_text: str, score: float) -> dict:
    log("Loading prompts...")

    strengths_prompt = load_prompt("strengths.txt")
    weaknesses_prompt = load_prompt("weaknesses.txt")
    role_fit_prompt = load_prompt("role_fit.txt")

    strengths_filled = strengths_prompt.format(
        jd_text=jd_text,
        cv_text=cv_text
    )
    weaknesses_filled = weaknesses_prompt.format(
        jd_text=jd_text,
        cv_text=cv_text
    )
    role_fit_filled = role_fit_prompt.format(
        jd_text=jd_text,
        cv_text=cv_text,
        score=score
    )

    log("Calling Gemini for strengths...")
    parsed_strengths = call_llm_with_retry(strengths_filled)

    log("Calling Gemini for weaknesses...")
    parsed_weaknesses = call_llm_with_retry(weaknesses_filled)

    log("Calling Gemini for role fit...")
    parsed_role_fit = call_llm_with_retry(role_fit_filled)

    strengths_list = normalize_string_list(
        validate_list_field(parsed_strengths, "strengths")
    )

    weaknesses_list = normalize_string_list(
        validate_list_field(parsed_weaknesses, "weaknesses")
    )

    feedback = {
        "strengths": strengths_list if strengths_list else ["No strengths"],
        "weaknesses": weaknesses_list if weaknesses_list else ["No weaknesses"],
        "role_fit_explanation": parsed_role_fit.get(
            "role_fit_explanation", ""
        )
    }

    return feedback


# ================================
# LOCAL TESTING
# ================================

if __name__ == "__main__":

    jd_backend = """
    We are hiring a Backend Engineer with experience in:
    Python, FastAPI or Django, REST APIs, SQL, PostgreSQL,
    Docker, CI/CD, AWS.
    """

    cv_backend = """
    Software Engineer with Python, Flask, REST APIs, SQL,
    MySQL, Docker. Learning FastAPI and PostgreSQL.
    """

    tests = [
        ("Backend Engineer", jd_backend, cv_backend, 72.0),
    ]

    for name, jd, cv, score in tests:
        print(f"\n===== TESTING: {name} =====")
        result = generate_feedback(jd, cv, score)
        print(json.dumps(result, indent=2))

    print("\n========== STABILITY TESTS ==========\n")

    stability_tests = [
        (
            "Noisy CV",
            "Python, SQL, Docker, FastAPI",
            "asd qwerty ???",
            50.0
        ),
        (
            "Irrelevant CV",
            "React, JavaScript",
            "Professional chef with 5 years experience",
            20.0
        ),
        (
            "Perfect Match",
            "Python, FastAPI, SQL, Docker",
            "Python FastAPI SQL Docker expert",
            95.0
        )
    ]

    for name, jd, cv, score in stability_tests:
        print(f"\n===== STABILITY TEST: {name} =====")
        result = generate_feedback(jd, cv, score)
        print(json.dumps(result, indent=2))