import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();
const upload = multer({ dest: "temp/" });

router.post(
  "/evaluate-cv",
  requireAuth,
  requireRole(["admin", "recruiter", "hiring_manager"]),
  upload.single("cv"),
  async (req, res) => {
    console.log("🔥 EXPRESS /evaluate-cv ROUTE HIT");

    const cvFile = req.file;
    const { job_id, email: candidateEmailFromInput } = req.body;

    if (!cvFile || !job_id) {
      if (cvFile?.path && fs.existsSync(cvFile.path)) {
        fs.unlinkSync(cvFile.path);
      }
      return res.status(400).json({
        message: "CV file and job_id are required",
      });
    }

    try {
      // ✅ LOAD companyId EXPLICITLY
      // Ensure the field is selected (select("+companyId"))
      const job = await Job.findById(job_id).select("+companyId");

      if (!job) {
        fs.unlinkSync(cvFile.path);
        return res.status(404).json({ message: "Job not found" });
      }

      // Handle cases where the field might be named 'company' instead of 'companyId'
      const resolvedCompanyId = job.companyId || job.company;

      if (!resolvedCompanyId) {
        throw new Error("Job is missing companyId");
      }

      // 🔐 COMPANY ISOLATION
      if (req.user.role !== "admin") {
        if (!req.user.companyId) {
          return res.status(403).json({ message: "Missing company scope" });
        }

        if (resolvedCompanyId.toString() !== req.user.companyId.toString()) {
          return res.status(403).json({
            message: "You cannot evaluate CVs for jobs outside your company",
          });
        }
      }

      const jdText = `
Job Title: ${job.title}
Department: ${job.department}
Experience Required: ${job.experience || "Not specified"} years
Required Skills: ${job.skills?.join(", ") || "Not specified"}

Job Description:
${job.description}
      `.trim();

      // ✅ BUILD FORM DATA
      const formData = new FormData();

      // -------------------------------------------------------------
      // ⚠️ CRITICAL FIX: APPEND TEXT FIELDS BEFORE THE FILE
      // FastAPI/Starlette needs these fields first to validate them
      // before streaming the large file content.
      // -------------------------------------------------------------
      formData.append("job_id", job_id);
      formData.append("company_id", resolvedCompanyId.toString());
      formData.append("jd_text", jdText);
      formData.append("job_title", job.title);
      formData.append("email", candidateEmailFromInput || "");

      // -------------------------------------------------------------
      // FILE GOES LAST
      // -------------------------------------------------------------
      formData.append("cv", fs.createReadStream(cvFile.path));

      console.log("🚀 SENDING TO FASTAPI:", {
        job_id,
        company_id: resolvedCompanyId.toString(),
        job_title: job.title,
      });

      const mlResponse = await axios.post(
        "http://localhost:8000/api/evaluate-cv",
        formData,
        {
          headers: {
            ...formData.getHeaders(), // Spread headers ensures boundaries are set correctly
          },
          timeout: 60_000,
        }
      );

      const result = mlResponse.data || {};

      // ✅ SAVE CANDIDATE
      const candidate = await Candidate.create({
        name: result.name || "Unknown",
        email: result.email || candidateEmailFromInput || null,
        phone: result.phone || null,
        score: result.score ?? 0,
        status: result.status || "pending",
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        feedback: result.feedback || "",
        jobId: job_id,
        companyId: resolvedCompanyId,
      });

      await Job.findByIdAndUpdate(job_id, { $inc: { cvCount: 1 } });

      res.json({
        message: "CV evaluated successfully",
        candidate,
        mlResult: result,
      });
    } catch (err) {
      // 🔥 IMPORTANT: LOG EXACT FASTAPI ERROR
      if (err.response) {
        console.error("❌ FASTAPI ERROR (422/500):", JSON.stringify(err.response.data, null, 2));
      } else {
        console.error("❌ SERVER ERROR:", err);
      }

      res.status(500).json({
        message: "ML evaluation failed",
        error: err.response?.data || err.message,
      });
    } finally {
      if (cvFile?.path && fs.existsSync(cvFile.path)) {
        fs.unlinkSync(cvFile.path);
      }
    }
  }
);

export default router;