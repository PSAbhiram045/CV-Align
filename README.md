🧠 CVAlign – AI-Powered CV Screening & Job Matching Platform

CVAlign is a full-stack AI-powered recruitment platform that automates CV screening, job matching, and candidate evaluation using Machine Learning + NLP, with complete role-based access control (RBAC).

This project is developed by:
1 Full-Stack Web Developer
2 Machine Learning Engineers

🚀 Tech Stack:

🌐 Frontend
React.js
Tailwind / CSS
Role-based dashboards
🖥 Backend (Main API)
Node.js
Express.js
MongoDB (Mongoose)

🧠 ML Backend (Microservice)
FastAPI (Python)
LangChain
FAISS (Vector DB)
OpenAI / HuggingFace Embeddings
☁ Cloud Storage
Cloudinary (CV file storage)

🔐 User Roles & Permissions
Role Permissions
Admin Create users, create jobs, upload CVs, view candidates
Recruiter Upload CVs, evaluate CVs using AI
Hiring Manager Create jobs, view candidates

📂 Project Structure
/frontend → React UI
/backend → Node + Express API
/ml-api → FastAPI ML Microservice

🧠 Machine Learning Pipeline (Handled by 2 ML Engineers)
✅ 1. CV & JD Processing + Scoring

Functions:
def extract_and_clean(file_path) -> dict
def embed_cv(text) -> list
def embed_jd(text) -> list
def compute_cv_score(jd_vec, cv_vec) -> float

Responsibilities:
PDF/DOCX text extraction
Data cleaning
CV & JD vector embedding
Similarity scoring (0–100)

✅ 2. LLM Feedback & ML API Integration

Functions:
def generate_feedback(jd_text, cv_text, score) -> dict
def evaluate_cv(job_id, jd_text, cv_file) -> dict

Responsibilities:
Strengths & weaknesses generation
Final feedback creation
Full ML pipeline integration using FastAPI
Return final structured evaluation to web backend

Final Output:

{
"name": "",
"email": "",
"score": 84,
"status": "shortlisted",
"strengths": [],
"weaknesses": [],
"feedback": "",
"jobTitle": ""
}

☁ Cloudinary Storage Flow

✅ UI sends CV as multipart/form-data
✅ ML API stores file in Cloudinary
✅ Cloudinary returns file URL
✅ URL stored in MongoDB (CV Collection)
✅ ML pipeline processes CV via Cloudinary file
📤 CV Upload & AI Evaluation API
Endpoint
POST http://localhost:8000/api/evaluate-cv

Data Sent from Frontend
Field Type
cv PDF/DOCX File
job_id Job MongoDB ID
job_title Job Title
jd_text Full Job Description
email Candidate Email
🧾 Candidate Database Schema (MongoDB)
{
name: String,
email: String,
phone: String,
jobId: ObjectId,
cvId: ObjectId,
extractedText: String,

relevanceScore: Number,
strengths: [String],
weaknesses: [String],
feedback: String,

status: "pending" | "reviewed" | "shortlisted" | "rejected"
}
✅ These fields will be updated automatically after ML evaluation.

▶ How to Run the Project
Backend
cd backend
npm install
npm run dev

Frontend
cd frontend
npm install
npm run dev

ML API
cd ml-api
pip install -r requirements.txt
uvicorn main:app --reload

👥 Team Structure
✅ 1 Full-Stack Web Developer
Frontend
Backend
Database Design
Authentication & RBAC
API Integration

✅ 2 Machine Learning Engineers
CV & JD Processing
Embeddings & Scoring
LLM Feedback
ML API & Cloudinary Handling
