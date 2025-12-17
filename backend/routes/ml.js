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
      // ✅ FORCE companyId TO BE LOADED
      const job = await Job.findById(job_id).select("+companyId");

      if (!job) {
        fs.unlinkSync(cvFile.path);
        return res.status(404).json({ message: "Job not found" });
      }

      // 🔴 HARD FAIL IF companyId IS MISSING
      if (!job.companyId) {
        fs.unlinkSync(cvFile.path);
        return res.status(500).json({
          message: "Job is missing companyId. Cannot evaluate CV.",
        });
      }

      // 🔐 Company isolation
      if (req.user.role !== "admin") {
        if (!req.user.companyId) {
          return res.status(403).json({ message: "Missing company scope" });
        }

        if (
          job.companyId.toString() !== req.user.companyId.toString()
        ) {
          return res.status(403).json({
            message:
              "You cannot evaluate CVs for jobs outside your company",
          });
        }
      }

      // ✅ Build JD text
      const jdText = `
Job Title: ${job.title}
Department: ${job.department}
Experience Required: ${job.experience || "Not specified"} years
Required Skills: ${job.skills?.join(", ") || "Not specified"}

Job Description:
${job.description}
      `.trim();

      // ✅ Build multipart form
      const formData = new FormData();
      formData.append("cv", fs.createReadStream(cvFile.path));
      formData.append("job_id", job_id);
      formData.append("company_id", job.companyId.toString()); // 🔥 ALWAYS SENT
      formData.append("jd_text", jdText);
      formData.append("job_title", job.title);
      formData.append("email", candidateEmailFromInput || "");

      // 🔥 HARD DEBUG (KEEP UNTIL CONFIRMED)
      console.log("🔥 EXPRESS SENDING FORM DATA:");
      for (const [key, value] of formData.entries()) {
        console.log(
          key,
          value instanceof fs.ReadStream ? "FILE" : value
        );
      }

      const mlResponse = await axios.post(
        "http://localhost:8000/api/evaluate-cv",
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60_000,
        }
      );

      const result = mlResponse.data || {};

      const candidate = await Candidate.create({
        name: result.name || "Unknown",
        email: result.email || candidateEmailFromInput || null,
        relevanceScore: result.score ?? 0,
        status: result.status || "pending",
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        feedback: result.feedback || "",
        jobId: job_id,
        companyId: job.companyId,
      });

      await Job.findByIdAndUpdate(job_id, { $inc: { cvCount: 1 } });

      res.json({
        message: "CV evaluated successfully",
        candidate,
        mlResult: result,
      });
    } catch (err) {
      console.error("ML evaluation error:", err);
      res.status(500).json({ message: "ML evaluation failed" });
    } finally {
      if (cvFile?.path && fs.existsSync(cvFile.path)) {
        fs.unlinkSync(cvFile.path);
      }
    }
  }
);

export default router;
