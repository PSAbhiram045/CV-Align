## 👤 Demo Credentials (for reviewers)

Admin
Email: admin@cvalign.com
Password: admin123

> > using the create users UI - recruiters/managers of different companies can be created .
> > login as a hiring manager to create new job roles for a specific company.
> > login as a recruiter and upload cv for score evaluation.

---

## ▶️ How to Run the Project

> > create .env file in project root folder for cloudinary.
> > create .env file in backend folder for mongodb.

🔵 Frontend Setup :
cd frontend
npm install
npm run dev

🟢 Backend Setup :
cd backend
npm install
npm run dev

🧠 ML Server Setup :

> > install dependencies first.

Terminal 1 - RAG & Scoring Service
cd "RAG and Scoring"
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

Terminal 2 - ML Evaluation Service

> > in project root folder,Run

    uvicorn ml_service.main:app --host 0.0.0.0 --port 8000 --reload

---

# CVAlign – Multi-Company Resume Screening & Evaluation Platform

CVAlign is a **full-stack, multi-tenant Applicant Tracking System (ATS)** designed to securely manage hiring workflows across multiple companies.
It enforces **strict company-level data isolation** using **JWT authentication** and **Role-Based Access Control (RBAC)**.

---

## 🚀 Key Features

-   **Multi-company architecture** with strict data isolation
-   **Role-Based Access Control (RBAC)**: Admin, Recruiter, Hiring Manager
-   Secure **JWT-based authentication**
-   Admin-controlled **company & user management**
-   Job creation and management (company-scoped)
-   CV upload & candidate evaluation workflow
-   **ML-powered resume scoring** via FastAPI service
-   Candidate ranking & status tracking (Pending / Reviewed / Shortlisted / Rejected)

---

## 🏗 Tech Stack

### Frontend

-   React
-   Vite
-   Tailwind CSS
-   Axios

### Backend

-   Node.js
-   Express.js
-   MongoDB (Mongoose)
-   JWT Authentication

### ML Service

-   FastAPI
-   LangChain
-   Sentence Transformers
-   FAISS (vector search)
-   Python

---

## 🔐 Authentication & Access Model

-   **No public registration**
-   Users are created **only by Admin**
-   Each user belongs to a **single company**
-   Recruiters & Hiring Managers can access **only their company’s data**

---
