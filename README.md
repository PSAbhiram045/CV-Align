# 🧠 CVAlign – AI-Powered CV Screening & Job Matching Platform

<div align="center">

### Intelligent Recruitment Automation using AI, RAG, NLP & Machine Learning

CVAlign is a full-stack AI-powered recruitment platform that automates **CV screening, candidate evaluation, job matching, and recruitment intelligence** using **Machine Learning, Natural Language Processing (NLP), Retrieval-Augmented Generation (RAG), and Vector Search**.

The platform streamlines the hiring workflow by extracting information from resumes, matching candidates against job requirements, generating AI-driven feedback, and ranking applicants based on semantic similarity and suitability scores.

![React](https://img.shields.io/badge/Frontend-React-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![Express](https://img.shields.io/badge/Framework-Express-black)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-success)
![FastAPI](https://img.shields.io/badge/ML_API-FastAPI-009688)
![FAISS](https://img.shields.io/badge/Vector_Search-FAISS-red)
![Python](https://img.shields.io/badge/ML-Python-yellow)
![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-orange)

</div>

---

# 👨‍💻 Team

* **1 Full-Stack Web Developer**
* **2 Machine Learning Engineers**

---

# 🚀 Key Features

## 📄 Intelligent Resume Processing

* Supports PDF and DOCX resume formats
* Automated text extraction and cleaning
* Resume preprocessing and normalization
* Candidate profile generation

## 🎯 AI-Powered Candidate Matching

* Job Description (JD) vs CV semantic comparison
* Vector embedding generation
* FAISS-powered similarity search
* Candidate ranking and shortlisting

## 📊 Automated Candidate Scoring

* Relevance scoring (0–100)
* Skill and experience matching
* AI-assisted candidate evaluation
* Recruiter-friendly assessment reports

## 🤖 LLM-Based Feedback Generation

Automatically generates:

* Role Fit Analysis
* Strength Assessment
* Weakness Identification
* Improvement Suggestions
* Hiring Recommendations

## 🔐 Role-Based Access Control (RBAC)

Dedicated dashboards and permissions for:

### Admin

* Create and manage users
* Create job postings
* Upload CVs
* View candidates
* Manage platform operations

### Recruiter

* Upload candidate CVs
* Evaluate candidates using AI
* Review generated reports

### Hiring Manager

* Create job openings
* Review candidates
* Track hiring progress

## ☁️ Cloud Storage Integration

* Secure CV storage using Cloudinary
* Automated document upload pipeline
* Resume URL management
* Scalable asset handling

---

# 🏗️ System Architecture

```text
                    ┌────────────────────┐
                    │      Frontend      │
                    │ React + Tailwind   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Node.js Backend    │
                    │ Express REST APIs  │
                    └─────────┬──────────┘
                              │
      ┌───────────────────────┼───────────────────────┐
      ▼                       ▼                       ▼

┌──────────────┐     ┌────────────────┐     ┌────────────────┐
│ MongoDB      │     │ FastAPI ML API │     │ Cloudinary     │
│ Database     │     │ RAG + Scoring  │     │ File Storage   │
└──────────────┘     └────────────────┘     └────────────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ FAISS Vector Store │
                    └────────────────────┘
```

---
# 🌐 Live Demo

Experience CVAlign live:

🚀 **Deployed Application:**
https://cv-align-frontend.onrender.com

### Demo Credentials

| Role  | Email               | Password   |
| ----- | ------------------- | ---------- |
| Admin | `admin@cvalign.com` | `admin123` |

### Quick Access

1. Open the deployed application.
2. Login using the admin credentials above.
3. Explore:

   * 📊 Dashboard Analytics
   * 💼 Job Role Management
   * 📄 CV Upload & Evaluation
   * 👥 Candidate Management
   * 🏢 Company Management
   * 👤 User Management
   * 🤖 AI-Powered Candidate Scoring

> **Note:** ⚠️ The frontend is deployed for UI demonstration purposes. AI-powered CV evaluation, vector search, and scoring services require additional compute resources and may not function on the free-tier deployment. For the full experience, please follow the local setup instructions below and run the backend and ML services locally.
---
# 🛠️ Tech Stack

## 🌐 Frontend

* React.js
* Tailwind CSS
* React Router
* Context API
* Role-Based Dashboards

## 🖥️ Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Multer File Uploads

## 🧠 ML Backend

* Python
* FastAPI
* LangChain
* FAISS
* NumPy
* Pydantic
* Uvicorn

## 🤖 AI & NLP

* Retrieval-Augmented Generation (RAG)
* OpenAI Embeddings
* HuggingFace Embeddings
* Semantic Similarity Search
* LLM Feedback Generation

## ☁️ Cloud Services

* Cloudinary

---

# 📂 Project Structure

```text
CVAlign/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── components/
│   │   └── App.jsx
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── ml-api/
│   ├── main.py
│   ├── rag.py
│   ├── score.py
│   ├── pipeline.py
│   └── requirements.txt
│
├── Feedback/
│   ├── feedback_generator.py
│   └── prompts/
│
├── embeddings/
│   └── embeddings.py
│
└── README.md
```

---

# 🔐 User Roles & Permissions

| Role           | Permissions                                            |
| -------------- | ------------------------------------------------------ |
| Admin          | Create users, create jobs, upload CVs, view candidates |
| Recruiter      | Upload CVs, evaluate CVs using AI                      |
| Hiring Manager | Create jobs, view candidates                           |

---

# 🧠 Machine Learning Pipeline

## ✅ CV & Job Description Processing

### Core Functions

```python
def extract_and_clean(file_path) -> dict
def embed_cv(text) -> list
def embed_jd(text) -> list
def compute_cv_score(jd_vec, cv_vec) -> float
```

### Responsibilities

* PDF/DOCX text extraction
* Data cleaning and preprocessing
* Embedding generation
* Similarity scoring
* Candidate ranking

---

## ✅ LLM Feedback Generation

### Core Functions

```python
def generate_feedback(jd_text, cv_text, score) -> dict
def evaluate_cv(job_id, jd_text, cv_file) -> dict
```

### Responsibilities

* Strength detection
* Weakness analysis
* Role-fit assessment
* AI-generated recommendations
* Structured evaluation generation

---

# 📊 Candidate Evaluation Workflow

```text
Resume Upload
      │
      ▼
Text Extraction
      │
      ▼
Data Cleaning
      │
      ▼
Embedding Generation
      │
      ▼
FAISS Similarity Search
      │
      ▼
Candidate Scoring
      │
      ▼
LLM Feedback Generation
      │
      ▼
Recruitment Report
```

---

# ☁️ Cloudinary Storage Flow

```text
User Uploads CV
        │
        ▼
Frontend
        │
        ▼
FastAPI ML Service
        │
        ▼
Cloudinary Upload
        │
        ▼
File URL Returned
        │
        ▼
MongoDB Storage
        │
        ▼
ML Processing Pipeline
```

---

# 📡 CV Evaluation API

### Endpoint

```http
POST /api/evaluate-cv
```

### Request Fields

| Field     | Type             |
| --------- | ---------------- |
| cv        | PDF/DOCX File    |
| job_id    | MongoDB ObjectId |
| job_title | String           |
| jd_text   | String           |
| email     | String           |

---

# 📤 Evaluation Output

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "score": 84,
  "status": "shortlisted",
  "strengths": [
    "Strong React skills",
    "Good backend experience"
  ],
  "weaknesses": [
    "Limited cloud exposure"
  ],
  "feedback": "Good fit for the role.",
  "jobTitle": "Full Stack Developer"
}
```

---

# 🗄️ Candidate Schema

```javascript
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

  status:
    "pending" |
    "reviewed" |
    "shortlisted" |
    "rejected"
}
```

---

# ▶️ Local Setup

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## ML API

```bash
cd ml-api

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
```

---

# 🔑 Demo Login Credentials

Use the following admin account to access the platform after starting the services:

### Admin Login

| Field    | Value               |
| -------- | ------------------- |
| Email    | `admin@cvalign.com` |
| Password | `admin123`          |

### Login Steps

1. Start the Backend Server

```bash
cd backend
npm run dev
```

2. Start the Frontend

```bash
cd frontend
npm run dev
```

3. Open the application in your browser:

```text
http://localhost:5173
```

4. Login using:

```text
Email: admin@cvalign.com
Password: admin123
```

5. After successful authentication, you'll be redirected to the Admin Dashboard where you can:

* Create Companies
* Create Users
* Create Job Roles
* Upload CVs
* Evaluate Candidates
* View AI Match Scores
* Manage Recruitment Workflow

### Available Dashboard Modules

* 📊 Dashboard Analytics
* 💼 Create Job Role
* 📄 Upload CVs
* 👥 Candidates Management
* 🏢 Create Company
* 👤 Create User

> Note: Ensure both Backend and ML API services are running before performing CV evaluation and candidate scoring.


# 👥 Team Responsibilities

## 💻 Full-Stack Developer

* Frontend Development
* Backend Development
* Database Design
* Authentication & Authorization
* API Integration
* Dashboard Development

## 🤖 Machine Learning Engineers

* Resume Parsing
* Embedding Generation
* Similarity Scoring
* RAG Pipeline Development
* LLM Feedback Generation
* FastAPI Development
* Cloudinary Integration

---

# 🔒 Security Features

* JWT Authentication
* Role-Based Access Control
* Secure File Upload Handling
* Middleware Authorization
* Request Validation
* Cloud Asset Protection

---

---

# 🤝 Contributing

```bash
Fork the repository

Create your feature branch
git checkout -b feature/new-feature

Commit your changes
git commit -m "Add new feature"

Push to branch
git push origin feature/new-feature

Open a Pull Request
```


<div align="center">

### ⭐ If you found this project useful, please consider giving it a star!

Built using React, Node.js, FastAPI, LangChain, FAISS, MongoDB & AI

</div>
