<<<<<<< HEAD
=======
// backend/routes/ml.js
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
<<<<<<< HEAD

=======
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();
const upload = multer({ dest: "temp/" });

router.post(
    "/evaluate-cv",
    requireAuth,
<<<<<<< HEAD
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
=======
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
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
                timeout: 60_000,
            });

            const result = mlResponse.data || {};

<<<<<<< HEAD
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
=======
            const candidate = await Candidate.create({
                name: result.name || result.candidate_name || "Unknown",
                email: result.email || candidateEmailFromInput || null,
                relevanceScore: result.score ?? result.relevanceScore ?? 0,
                status: result.status || "pending",
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
                strengths: result.strengths || [],
                weaknesses: result.weaknesses || [],
                feedback: result.feedback || "",
                jobId: job_id,
<<<<<<< HEAD
                companyId: resolvedCompanyId,
=======

                companyId: req.user.companyId ?? job.companyId ?? null,
                cvId: null, // if you later save a CV doc, update this
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
            });

            await Job.findByIdAndUpdate(job_id, { $inc: { cvCount: 1 } });

<<<<<<< HEAD
            // Populate job info so frontend can show job title/role when inserting
            // the newly evaluated candidate into a list without an extra fetch.
            const candidate = await Candidate.findById(created._id).populate(
                "jobId",
                "title department"
            );

=======
            // respond
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
            res.json({
                message: "CV evaluated successfully",
                candidate,
                mlResult: result,
            });
        } catch (err) {
<<<<<<< HEAD
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
=======
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
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
            }
        }
    }
);

<<<<<<< HEAD
export default router;
=======
export default router;
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
