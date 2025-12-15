import os
import json
from langchain_ollama import OllamaLLM

# ================================
# CONFIG
# ================================

DEBUG_MODE = True   # Set to False in production


# ================================
# LOGGER
# ================================

def log(message: str):
    if DEBUG_MODE:
        print(f"[DEBUG] {message}")


# ================================
# MODEL LOADER (LLaMA 3 via Ollama)
# ================================

def get_llama_model():
    """
    Loads the local LLaMA 3 model through Ollama.
    """
    return OllamaLLM(
        model="llama3",
        temperature=0.2
    )


# ================================
# PROMPT LOADER
# ================================

PROMPT_FOLDER = os.path.join(os.path.dirname(__file__), "prompts")

def load_prompt(filename: str) -> str:
    """Load a prompt from the prompts folder."""
    path = os.path.join(PROMPT_FOLDER, filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ================================
# LLM CALL WRAPPER
# ================================

def call_llm(prompt: str) -> str:
    """
    Sends a prompt to the local LLaMA 3 model and returns raw output text.
    """
    llm = get_llama_model()

    try:
        response = llm.invoke(prompt)
        return response
    except Exception as e:
        print("LLM ERROR:", e)
        return "{}"  # fail-safe empty JSON



import re

def extract_json(text: str) -> str:
    """
    Extract the first JSON object found in the text.
    Useful when LLM outputs explanations before/after JSON.
    """
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return match.group(0)
    except:
        pass
    return text  # fallback: return original





# ================================
# SAFE JSON PARSER
# ================================

def safe_json_parse(text: str) -> dict:
    """
    Robust JSON parser that:
    - extracts JSON from extra text
    - cleans formatting
    - attempts repair of common JSON issues
    - guarantees a dict is returned
    """
    # Step 1: extract JSON portion only
    cleaned = extract_json(text)

    # Step 2: remove code fences
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    # Step 3: try direct parse
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # Step 4: try common repairs
    try:
        repaired = cleaned

        # Fix trailing commas
        repaired = re.sub(r',\s*}', '}', repaired)
        repaired = re.sub(r',\s*]', ']', repaired)

        # Fix missing quotes: rare but possible
        repaired = re.sub(r'(\w+)\s*:', r'"\1":', repaired)

        return json.loads(repaired)
    except Exception:
        return {}  # final fallback


def validate_list_field(data: dict, field: str):
    """
    Ensures a field exists and is a list. If not, return [].
    Use this to clean strengths/weaknesses outputs.
    """
    value = data.get(field, [])
    return value if isinstance(value, list) else []

def normalize_string_list(items):
    """
    Ensures the list contains only strings.
    Converts objects into readable strings if needed.
    Filters out invalid items.
    """
    if not isinstance(items, list):
        return []

    cleaned = []
    for item in items:
        if isinstance(item, str):
            cleaned.append(item.strip())
        elif isinstance(item, dict):
            # Convert dicts to readable strings
            cleaned.append(", ".join([f"{k}: {v}" for k, v in item.items()]))
        else:
            # Ignore numbers, booleans, etc.
            continue

    return cleaned


import time

def call_llm_with_retry(prompt: str, max_retries: int = 2, interval: float = 0.5):
    """
    Calls the LLM with retry logic.
    - If parsing fails, tries again up to max_retries.
    - Helps handle temporary bad JSON or partial outputs.
    """
    attempt = 0
    last_output = "{}"  # in case all retries fail

    while attempt <= max_retries:
        log(f"LLM attempt {attempt + 1} of {max_retries + 1}")

        raw = call_llm(prompt)
        last_output = raw  

        parsed = safe_json_parse(raw)

        if parsed:  # success
            return parsed

        log("Parse failed. Retrying...")
        attempt += 1
        time.sleep(interval)

    log("All retries failed. Returning last output.")
    return safe_json_parse(last_output) or {}



# ================================
# MAIN FEEDBACK GENERATOR
# ================================
def generate_feedback(jd_text: str, cv_text: str, score: float) -> dict:
    """
    Generates STRENGTHS, WEAKNESSES, and ROLE-FIT EXPLANATION
    using LLaMA 3 + retry, JSON repair, validation & normalization.
    """

    log("Loading prompts...")

    strengths_prompt = load_prompt("strengths.txt")
    weaknesses_prompt = load_prompt("weaknesses.txt")
    role_fit_prompt = load_prompt("role_fit.txt")

    log("Formatting prompts...")

    strengths_filled = strengths_prompt.format(jd_text=jd_text, cv_text=cv_text)
    weaknesses_filled = weaknesses_prompt.format(jd_text=jd_text, cv_text=cv_text)
    role_fit_filled = role_fit_prompt.format(jd_text=jd_text, cv_text=cv_text, score=score)

    log("Calling LLaMA with retry for strengths...")
    parsed_strengths = call_llm_with_retry(strengths_filled)

    log("Calling LLaMA with retry for weaknesses...")
    parsed_weaknesses = call_llm_with_retry(weaknesses_filled)

    log("Calling LLaMA with retry for role fit...")
    parsed_role_fit = call_llm_with_retry(role_fit_filled)

    log("Validating and normalizing outputs...")

    feedback = {
        "strengths": normalize_string_list(
            validate_list_field(parsed_strengths, "strengths")
        ),

        "weaknesses": normalize_string_list(
            validate_list_field(parsed_weaknesses, "weaknesses")
        ),

        "role_fit_explanation": parsed_role_fit.get("role_fit_explanation", "")
    }

    return feedback

# ================================
# LOCAL TESTING (DEV ONLY)
# ================================
if __name__ == "__main__":

    # ----------------------------
    # Benchmark CV + JD Samples
    # ----------------------------

    jd_backend = """
    We are hiring a Backend Engineer with experience in:
    - Python
    - FastAPI or Django
    - REST APIs
    - SQL and PostgreSQL
    - Docker and CI/CD
    - AWS or cloud deployment
    Preferred: Redis, Kubernetes, microservices architecture.
    """

    cv_backend = """
    Software Engineer with 1.5 years of backend development experience.
    Skills: Python, Flask, REST APIs, SQL, MySQL, Docker.
    Built several APIs for internal automation.
    Worked with Git and basic CI workflows.
    Learning FastAPI and PostgreSQL.
    No cloud deployment yet.
    """

    jd_frontend = """
    Looking for a Frontend Engineer with:
    - React
    - JavaScript/TypeScript
    - HTML/CSS
    - REST API integration
    - State management (Redux/Zustand)
    Preferred: Tailwind, Next.js, UI performance tuning.
    """

    cv_frontend = """
    Frontend Developer Intern.
    Skills: React, JavaScript, HTML, CSS, Axios for API calls.
    Built multiple UI components and dashboards.
    Some experience with Tailwind CSS.
    No TypeScript or Redux used yet.
    No Next.js experience.
    """

    jd_ml = """
    We need an ML Engineer with:
    - Python, NumPy, Pandas
    - Scikit-learn, TensorFlow, PyTorch
    - Data preprocessing, model training & evaluation
    - MLOps experience (Docker, MLflow)
    Preferred: NLP, LLMs, embeddings.
    """

    cv_ml = """
    ML Engineer with internship experience.
    Skills: Python, NumPy, Pandas, Scikit-learn.
    Built classification and regression models.
    Familiar with TensorFlow but no PyTorch experience.
    Used Docker for packaging ML models.
    No experience with MLflow or MLOps pipelines.
    Basics of NLP.
    """

    jd_fresher = """
    Entry-level Software Developer with:
    - Programming fundamentals (Python/Java)
    - Data structures & algorithms
    - Web development basics
    - SQL knowledge
    Preferred: Git, debugging experience.
    """

    cv_fresher = """
    CS undergraduate seeking SWE role.
    Skills: Python, data structures, algorithms.
    Built small personal projects with HTML/CSS and basic Flask apps.
    Knowledge of SQL basics.
    Familiar with Git.
    """

    # ----------------------------
    # Test suite list
    # ----------------------------

    tests = [
        ("Backend Engineer", jd_backend, cv_backend, 72.0),
        ("Frontend Developer", jd_frontend, cv_frontend, 78.5),
        ("ML Engineer", jd_ml, cv_ml, 69.0),
        ("Fresher SWE", jd_fresher, cv_fresher, 81.0),
    ]

    # ----------------------------
    # Run all tests
    # ----------------------------
    for name, jd, cv, score in tests:
        print(f"\n===== TESTING: {name} =====")
        result = generate_feedback(jd, cv, score)
        print(json.dumps(result, indent=2))
# ====================================
# Stability Stress Tests
# ====================================
    print("\n========== STABILITY TESTS ==========\n")

    stability_tests = [
        (
            "Noisy CV",
            "We need someone with Python, SQL, Docker, FastAPI.",
            "asd asd fasdf qwerty python developer?? ###     docker DOCKEERRR sql not sure FASTPI?",
            50.0
        ),
        (
            "Irrelevant CV",
            "React, JavaScript, APIs required.",
            "Professional chef with 5 years experience in Indian cuisine.",
            20.0
        ),
        (
            "Perfect Match CV",
            "Python, FastAPI, SQL, Docker required.",
            "Experienced Backend Dev skilled in Python, FastAPI, SQL, Docker.",
            95.0
        ),
        (
            "Opposite Skills",
            "ML engineer with TensorFlow and PyTorch.",
            "Frontend engineer skilled in React, HTML, CSS.",
            30.0
        )
    ]

    for name, jd, cv, score in stability_tests:
        print(f"\n===== STABILITY TEST: {name} =====")
        result = generate_feedback(jd, cv, score)
        print(json.dumps(result, indent=2))
