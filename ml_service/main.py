import os
import shutil
import uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from ml_service.pipeline import evaluate

app = FastAPI(title="CV-ALIGN-ML SERVICE MODULE")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/evaluate-cv")
async def evaluate_cv_api(
    request: Request,
    job_id: str = Form(...),
    company_id: str = Form(...),
    jd_text: str = Form(...),
    job_title: str = Form(""),
    email: str = Form(""),
    cv: UploadFile = File(...),
):
    # 🔥 DEBUG: SHOW WHAT FASTAPI RECEIVES
    form = await request.form()
    print("🔥 FASTAPI RECEIVED FORM KEYS:", list(form.keys()))

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    temp_dir = os.path.join(BASE_DIR, "temp_cvs")
    os.makedirs(temp_dir, exist_ok=True)

    temp_path = os.path.join(
        temp_dir, f"{uuid.uuid4()}_{cv.filename}"
    )

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
