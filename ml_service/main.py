from ml_service.pipeline import evaluate
# from score import retrieve_chunks, compute_score
# from rag import load_jd_embedding, load_cv_index
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine, Column, String, Float
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
import os
import sys
import shutil
import uuid

# ── Add RAG and Scoring to path BEFORE importing from it ────
RAG_DIR = os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), "RAG and Scoring")
sys.path.insert(0, RAG_DIR)


# ── SQLite for score storage ─────────────────────────────────
DATABASE_URL = "sqlite:///./applications.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


class Application(Base):
    __tablename__ = "applications"
    candidate_id = Column(String, primary_key=True)
    job_id = Column(String, primary_key=True)
    company_id = Column(String, primary_key=True)
    score = Column(Float)


Base.metadata.create_all(bind=engine)

# ── FastAPI app ──────────────────────────────────────────────
app = FastAPI(title="CV-ALIGN-ML SERVICE MODULE")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://cv-align-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "running", "service": "CVAlign ML + RAG Service"}


@app.post("/api/evaluate-cv")
async def evaluate_cv_api(
    request: Request,
    job_id: str = Form(...),
    company_id: str = Form(""),
    jd_text: str = Form(...),
    job_title: str = Form(""),
    email: str = Form(""),
    cv: UploadFile = File(...),
):
    form = await request.form()
    print("FASTAPI RECEIVED FORM KEYS:", list(form.keys()))

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    temp_dir = os.path.join(BASE_DIR, "temp_cvs")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{cv.filename}")

    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(cv.file, f)

        print("📄 CV saved at:", temp_path)

        result = evaluate(
            company_id=company_id,
            job_id=job_id,
            job_title=job_title,
            jd_text=jd_text,
            cv_file_path=temp_path,
        )
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# ── RAG Score endpoint ───────────────────────────────────────


class ScoreRequest(BaseModel):
    candidate_id: str
    company_id: str
    job_id: str


class ScoreResponse(BaseModel):
    candidate_id: str
    job_id: str
    company_id: str
    score: float


@app.post("/score", response_model=ScoreResponse)
def score_candidate(req: ScoreRequest):
    import sys
    import os
    RAG_DIR = os.path.join(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))), "RAG and Scoring")
    if RAG_DIR not in sys.path:
        sys.path.insert(0, RAG_DIR)
    from rag import load_jd_embedding, load_cv_index
    from score import retrieve_chunks, compute_score
    db = SessionLocal()
    try:
        jd_embedding = load_jd_embedding(req.company_id, req.job_id)
        index, _ = load_cv_index(req.company_id, req.job_id)
        cv_vectors = retrieve_chunks(jd_embedding, index)
        score = compute_score(jd_embedding, cv_vectors, k=10)

        record = Application(
            candidate_id=req.candidate_id,
            job_id=req.job_id,
            company_id=req.company_id,
            score=score,
        )
        db.merge(record)
        db.commit()

        return {
            "candidate_id": req.candidate_id,
            "job_id":       req.job_id,
            "company_id":   req.company_id,
            "score":        score,
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=404, detail="JD or CV not found for given Company/Job")
    finally:
        db.close()
