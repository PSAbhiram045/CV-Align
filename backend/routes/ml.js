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

            const mlResponse = await axios.post("http://localhost:8000/api/evaluate-cv", formData, {
                headers: {
                    ...formData.getHeaders(), // Spread headers ensures boundaries are set correctly
                },
                timeout: 60_000,
            });

            const result = mlResponse.data || {};

            const mlScore = typeof result.score === "number" ? result.score : null;
            let derivedStatus = result.status || "pending";
            if (mlScore !== null && (!result.status || result.status === "pending")) {
                // Use job-specific thresholds when available
                const shortlistThreshold =
                    typeof job.shortlistThreshold === "number" ? job.shortlistThreshold : 75;
                const rejectThreshold =
                    typeof job.rejectThreshold === "number" ? job.rejectThreshold : 40;

                if (mlScore >= shortlistThreshold) derivedStatus = "shortlisted";
                else if (mlScore < rejectThreshold) derivedStatus = "rejected";
                else derivedStatus = "reviewed";
            }

            const extractedEmail = (result.email || "").toLowerCase().trim();
            const providedEmail = (candidateEmailFromInput || "").toLowerCase().trim();
            if (providedEmail && extractedEmail && providedEmail !== extractedEmail) {
                console.warn(
                    "Email mismatch: provided=",
                    candidateEmailFromInput,
                    "extracted=",
                    result.email
                );
                return res.status(400).json({
                    message: "Provided email does not match the email found in the uploaded CV.",
                    providedEmail: candidateEmailFromInput,
                    extractedEmail: result.email || null,
                    mlResult: result,
                });
            }

            // Persist candidate: set both `relevanceScore` (used by list endpoints)
            // and `score` (legacy field used in some places) so views remain consistent.
            const created = await Candidate.create({
                name: result.name || "Unknown",
                email: result.email || candidateEmailFromInput || null,
                phone: result.phone || null,
                // store both fields
                relevanceScore: mlScore !== null ? mlScore : undefined,
                score: mlScore ?? null,
                status: derivedStatus,
                strengths: result.strengths || [],
                weaknesses: result.weaknesses || [],
                feedback: result.feedback || "",
                jobId: job_id,
                companyId: resolvedCompanyId,
            });

            await Job.findByIdAndUpdate(job_id, { $inc: { cvCount: 1 } });

            // Populate job info so frontend can show job title/role when inserting
            // the newly evaluated candidate into a list without an extra fetch.
            const candidate = await Candidate.findById(created._id).populate(
                "jobId",
                "title department"
            );

            res.json({
                message: "CV evaluated successfully",
                candidate,
                mlResult: result,
            });
        } catch (err) {
            // 🔥 IMPORTANT: LOG EXACT FASTAPI ERROR
            if (err.response) {
                console.error(
                    "❌ FASTAPI ERROR (422/500):",
                    JSON.stringify(err.response.data, null, 2)
                );
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