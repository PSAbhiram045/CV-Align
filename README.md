## 👤 Demo Credentials (for reviewers)

> ⚠️ For demo/testing purposes
> **Admin**

-   **Email:** admin@cvalign.com
-   **Password:** admin123

### Demo Flow

-   Use **Create Users UI** to create recruiters/managers for different companies.
-   login as **Hiring Manager** to create new job roles for a specific company.
-   login as a **Recruiter** and upload CVs for score evaluation.

---

## ▶️ How to Run the Project

-   create a `.env` file in the **project root folder** for **Cloudinary**.
-   create a `.env` file in the **backend folder** for **mongoDB**.

---

### 🔵 Frontend Setup :

```bash
cd frontend
npm install
npm run dev
```

🟢 Backend Setup :

```bash
cd backend
npm install
npm run dev
```

🧠 ML Server Setup :

install dependencies first.

Terminal 1 - RAG & Scoring Service

```bash
cd "RAG and Scoring"
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

Terminal 2 - ML Evaluation Service

in project root folder,Run

```bash
    uvicorn ml_service.main:app --host 0.0.0.0 --port 8000 --reload
```

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
