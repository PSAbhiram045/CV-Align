from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from rag import load_jd_embedding, load_cv_index
from score import retrieve_chunks, compute_score

DATABASE_URL = "sqlite:///./applications.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


# =========================
# Database Model
# =========================
class Application(Base):
    __tablename__ = "applications"

    candidate_id = Column(String, primary_key=True)
    job_id = Column(String, primary_key=True)
    company_id = Column(String, primary_key=True)
    score = Column(Float)


Base.metadata.create_all(bind=engine)


# =========================
# Request / Response Models
# =========================
class ScoreRequest(BaseModel):
    candidate_id: str
    company_id: str
    job_id: str


class ScoreResponse(BaseModel):
    candidate_id: str
    job_id: str
    company_id: str
    score: float


# =========================
# FastAPI App
# =========================
app = FastAPI(title="RAG Score Generation Service")


@app.post("/score", response_model=ScoreResponse)
def score_candidate(req: ScoreRequest):
    db = SessionLocal()

    try:
        # Load embeddings / index
        jd_embedding = load_jd_embedding(
            req.company_id, req.job_id
        )

        index, _ = load_cv_index(
            req.company_id, req.job_id
        )

        cv_vectors = retrieve_chunks(jd_embedding, index)
        score = compute_score(jd_embedding, cv_vectors,k=10)

        # Upsert score
        record = Application(
            candidate_id=req.candidate_id,
            job_id=req.job_id,
            company_id=req.company_id,
            score=score
        )

        db.merge(record)
        db.commit()

        return {
            "candidate_id": req.candidate_id,
            "job_id": req.job_id,
            "company_id": req.company_id,
            "score": score
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="JD or CV not found for given Company/Job"
        )

    finally:
        db.close()
