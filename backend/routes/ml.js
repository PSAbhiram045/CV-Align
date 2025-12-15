// backend/routes/ml.js
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
    requireRole(["admin", "recruiter", "hiring_manager"]), // allow relevant roles
    upload.single("cv"),
    async (req, res) => {
        const cvFile = req.file;
        const { job_id, jd_text, email: candidateEmailFromInput } = req.body;

        if (!cvFile || !job_id || !jd_text) {
            // delete temp file if present
            if (cvFile && fs.existsSync(cvFile.path)) fs.unlinkSync(cvFile.path);
            return res.status(400).json({ message: "Missing required data" });
        }

        try {
            const job = await Job.findById(job_id);
            if (!job) {
                if (fs.existsSync(cvFile.path)) fs.unlinkSync(cvFile.path);
                return res.status(404).json({ message: "Job not found" });
            }

            if (req.user.role !== "admin") {
                if (!req.user?.companyId) {
                    if (fs.existsSync(cvFile.path)) fs.unlinkSync(cvFile.path);
                    return res.status(403).json({ message: "Missing company scope" });
                }
                if (job.companyId?.toString() !== req.user.companyId?.toString()) {
                    if (fs.existsSync(cvFile.path)) fs.unlinkSync(cvFile.path);
                    return res
                        .status(403)
                        .json({ message: "You cannot evaluate CVs for jobs outside your company" });
                }
            }

            // Prepare data to send to ML server
            const formData = new FormData();
            formData.append("cv", fs.createReadStream(cvFile.path));
            formData.append("job_id", job_id);
            formData.append("jd_text", jd_text);
            formData.append("job_title", job.title || "");
            formData.append("email", candidateEmailFromInput || "");

            const mlResponse = await axios.post("http://localhost:8000/api/evaluate-cv", {
                headers: formData.getHeaders(),
                timeout: 60_000,
            });

            const result = mlResponse.data || {};

            const candidate = await Candidate.create({
                name: result.name || result.candidate_name || "Unknown",
                email: result.email || candidateEmailFromInput || null,
                relevanceScore: result.score ?? result.relevanceScore ?? 0,
                status: result.status || "pending",
                strengths: result.strengths || [],
                weaknesses: result.weaknesses || [],
                feedback: result.feedback || "",
                jobId: job_id,

                companyId: req.user.companyId ?? job.companyId ?? null,
                cvId: null, // if you later save a CV doc, update this
            });

            await Job.findByIdAndUpdate(job_id, { $inc: { cvCount: 1 } });

            // respond
            res.json({
                message: "CV evaluated successfully",
                candidate,
                mlResult: result,
            });
        } catch (err) {
            console.error("ML evaluate error:", err?.message || err);
            return res
                .status(500)
                .json({ message: "ML evaluation failed", error: err?.message || String(err) });
        } finally {
            try {
                if (cvFile?.path && fs.existsSync(cvFile.path)) {
                    fs.unlinkSync(cvFile.path);
                }
            } catch (cleanupErr) {
                console.warn("Failed to remove temp file:", cleanupErr?.message || cleanupErr);
            }
        }
    }
);

export default router;
