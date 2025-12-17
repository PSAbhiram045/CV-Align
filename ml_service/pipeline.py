from text_extract_and_code_clean.code import extract_and_clean_from_file
from embeddings.embeddings import process_cv_application, process_jd_creation
from Feedback.feedback_generator import generate_feedback
from .one_line import normalize_text_one_line
import uuid
import requests
from .cloudinary_utils import upload_cv
from datetime import date   # ✅ NEW

# RAG scoring service URL
RAG_SCORE_API = "http://localhost:8002/score"


def get_rag_score(company_id: str, job_id: str, candidate_id: str) -> float:
    payload = {
        "company_id": company_id,
        "job_id": job_id,
        "candidate_id": candidate_id
    }

    res1 = requests.post(RAG_SCORE_API, json=payload, timeout=15)

    if res1.status_code != 200:
        raise RuntimeError(f"RAG scoring failed: {res1.text}")

    return res1.json()["score"]


def evaluate(
    company_id: str,
    job_id: str,
    job_title: str,
    jd_text: str,
    cv_file_path: str
) -> dict:
    # upload cv
    cv_url = upload_cv(cv_file_path)

    # extract cv
    cv_data = extract_and_clean_from_file(cv_file_path)
    raw_cv_text = cv_data.get("raw_text", "")
    cv_text = normalize_text_one_line(raw_cv_text)

    # store jd embeddings
    process_jd_creation({
        "company_id": company_id,
        "job_id": job_id,
        "text": jd_text
    })

    # store cv embeddings
    process_cv_application({
        "company_id": company_id,
        "job_id": job_id,
        "text": cv_text
    })

    # candidate_id as STRING
    candidate_id = str(uuid.uuid4())

    score = get_rag_score(
        company_id=company_id,
        job_id=job_id,
        candidate_id=candidate_id
    )

    # feedback
    feedback_result = generate_feedback(
        jd_text=jd_text,
        cv_text=cv_text,
        score=score
    )

    status = "can be shortlisted" if score >= 70 else "can be rejected"

    return {
        "name": cv_data.get("name", ""),
        "email": cv_data.get("email", ""),
        "phone": (
            cv_data.get("phone")
            or cv_data.get("phone_number")
            or cv_data.get("mobile")
            or ""
        ),
        "uploadDate": date.today().isoformat(),  # ✅ ADDED
        "score": score,
        "status": status,
        "strengths": feedback_result.get("strengths", []),
        "weaknesses": feedback_result.get("weaknesses", []),
        "feedback": feedback_result.get("role_fit_explanation", ""),
        "jobTitle": job_title,
    }
