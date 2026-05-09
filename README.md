# 🧠 CVAlign – AI-Powered CV Screening & Job Matching Platform

CVAlign is a full-stack AI-powered recruitment platform that automates **CV screening, job matching, and candidate evaluation** using **Machine Learning + NLP**, with complete **Role-Based Access Control (RBAC)**.

---

## 👨‍💻 Team

* **1 Full-Stack Web Developer**
* **2 Machine Learning Engineers**

---

## 🚀 Tech Stack

### 🌐 Frontend

* React.js
* Tailwind CSS
* Role-based dashboards

### 🖥 Backend (Main API)

* Node.js
* Express.js
* MongoDB (Mongoose)

### 🧠 ML Backend (Microservice)

* FastAPI (Python)
* LangChain
* FAISS (Vector DB)
* OpenAI / HuggingFace Embeddings

### ☁ Cloud Storage

* Cloudinary (CV file storage)

---

## 🔐 User Roles & Permissions

| Role               | Permissions                                            |
| ------------------ | ------------------------------------------------------ |
| **Admin**          | Create users, create jobs, upload CVs, view candidates |
| **Recruiter**      | Upload CVs, evaluate CVs using AI                      |
| **Hiring Manager** | Create jobs, view candidates                           |

---

## 📂 Project Structure

```
/frontend   → React UI  
/backend    → Node + Express API  
/ml-api     → FastAPI ML Microservice  
```

---

## 🧠 Machine Learning Pipeline

### ✅ 1. CV & JD Processing + Scoring

**Functions:**

```python
def extract_and_clean(file_path) -> dict
def embed_cv(text) -> list
def embed_jd(text) -> list
def compute_cv_score(jd_vec, cv_vec) -> float
```

**Responsibilities:**

* PDF/DOCX text extraction
* Data cleaning
* CV & JD vector embedding
* Similarity scoring (0–100)

---

### ✅ 2. LLM Feedback & ML API Integration

**Functions:**

```python
def generate_feedback(jd_text, cv_text, score) -> dict
def evaluate_cv(job_id, jd_text, cv_file) -> dict
```

**Responsibilities:**

* Strengths & weaknesses generation
* Final feedback creation
* ML pipeline integration using FastAPI
* Return structured evaluation to backend

---

## 📤 Final Output Format

```json
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
```

---

## ☁ Cloudinary Storage Flow

* UI sends CV as `multipart/form-data`
* ML API uploads file to Cloudinary
* Cloudinary returns file URL
* URL stored in MongoDB
* ML pipeline processes CV using URL

---

## 📡 CV Evaluation API

**Endpoint:**

```
POST http://localhost:8000/api/evaluate-cv
```

**Request Fields:**

| Field     | Type          |
| --------- | ------------- |
| cv        | PDF/DOCX File |
| job_id    | MongoDB ID    |
| job_title | String        |
| jd_text   | String        |
| email     | String        |

---

## 🧾 Candidate Schema (MongoDB)

```js
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
```

---

## ▶️ How to Run

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### ML API

```bash
cd ml-api
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 👥 Team Responsibilities

### 💻 Full-Stack Developer

* Frontend
* Backend
* Database Design
* Authentication & RBAC
* API Integration

### 🤖 ML Engineers

* CV & JD Processing
* Embeddings & Scoring
* LLM Feedback
* ML API & Cloudinary Integration

---