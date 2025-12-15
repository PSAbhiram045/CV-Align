import express from "express";
import fs from "fs";
import { upload } from "../middleware/upload.js";
import CV from "../models/CV.js";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import { extractTextFromPDF } from "../utils/pdfExtractor.js";
import { extractTextFromDOCX } from "../utils/docxExtractor.js";
import path from "path";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

// Upload CVs
router.post(
    "/upload",
    requireAuth,
    requireRole(["admin", "recruiter"]),
    upload.array("cvs", 10),
    async (req, res) => {
        try {
            const { jobId } = req.body;

            if (!jobId) {
                return res.status(400).json({ message: "Job ID is required" });
            }

            const job = await Job.findById(jobId);
            if (!job) {
                return res.status(404).json({ message: "Job not found" });
            }

            // enforce tenant isolation for non-admin users
            if (req.user.role !== "admin") {
                if (!req.user?.companyId) {
                    return res.status(403).json({ message: "Missing company scope" });
                }
                if (job.companyId?.toString() !== req.user.companyId?.toString()) {
                    return res
                        .status(403)
                        .json({ message: "You cannot upload CVs for jobs outside your company" });
                }
            }

            const uploadedCVs = [];

            for (const file of req.files) {
                let extractedText = "";

                const ext = path.extname(file.originalname).toLowerCase();

                if (ext === ".pdf") {
                    extractedText = await extractTextFromPDF(file.path);
                } else if (ext === ".docx") {
                    extractedText = await extractTextFromDOCX(file.path);
                } else {
                    return res.status(400).json({ message: "Unsupported file format" });
                }

                if (!extractedText || extractedText.trim().length < 20) {
                    return res
                        .status(400)
                        .json({ message: "Failed to extract readable text from CV" });
                }

                const txtRelativePath = `uploads/cvs/${file.filename}.txt`;
                const txtFullPath = path.join(process.cwd(), txtRelativePath);
                fs.writeFileSync(txtFullPath, extractedText);

                // remove the original uploaded file (temp location)
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }

                console.log("✅ Extracted text preview:");
                console.log(extractedText.substring(0, 200));

                // Save CV to database
                const baseStoredPath = `uploads/cvs/${file.filename}`;
                const cv = new CV({
                    jobId,
                    fileName: file.originalname,
                    filePath: baseStoredPath,
                    fileUrl: `/uploads/cvs/${file.filename}`,
                    extractedText,
                    fileSize: file.size,
                    companyId: req.user.companyId ?? job.companyId ?? null,
                    uploadedBy: req.user.id ?? req.user._id,
                });

                await cv.save();

                // Extract basic info from CV (simple regex - can be improved)
                const emailMatch = extractedText.match(/[\w.-]+@[\w.-]+\.\w+/);
                const phoneMatch = extractedText.match(/[\d\s\-\+\(\)]{10,}/);

                // Try to extract name (first line often contains name)
                const lines = extractedText.split("\n").filter((line) => line.trim());
                const possibleName = lines[0] || "Unknown Candidate";

                // Create candidate entry
                const candidate = new Candidate({
                    name: possibleName.substring(0, 100), // Limit name length
                    email: emailMatch ? emailMatch[0] : null,
                    phone: phoneMatch ? phoneMatch[0].trim() : null,
                    jobId,
                    cvId: cv._id,
                    extractedText,
                    status: "pending",
                    companyId: req.user.companyId ?? job.companyId ?? null,
                });

                await candidate.save();

                uploadedCVs.push({
                    cv: cv._id,
                    candidate: candidate._id,
                    fileName: file.originalname,
                });
            }

            // Update job CV count
            job.cvCount = (job.cvCount || 0) + req.files.length;
            await job.save();

            res.status(201).json({
                message: `${req.files.length} CV(s) uploaded successfully`,
                data: uploadedCVs,
            });
        } catch (error) {
            console.error("Upload error:", error);
            res.status(500).json({ message: error.message });
        }
    }
);

// Get all CVs for a job
router.get("/job/:jobId", requireAuth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });

        // enforce tenant isolation for non-admins
        if (req.user.role !== "admin") {
            if (!req.user?.companyId)
                return res.status(403).json({ message: "Missing company scope" });
            if (job.companyId?.toString() !== req.user.companyId?.toString()) {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        const cvs = await CV.find({ jobId: req.params.jobId }).sort({ createdAt: -1 });
        res.json(cvs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single CV
router.get("/:id", requireAuth, async (req, res) => {
    try {
        const cv = await CV.findById(req.params.id);
        if (!cv) return res.status(404).json({ message: "CV not found" });
        if (req.user.role !== "admin") {
            if (!req.user?.companyId)
                return res.status(403).json({ message: "Missing company scope" });
            if (cv.companyId?.toString() !== req.user.companyId?.toString()) {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        res.json(cv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete CV
router.delete("/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
        const cv = await CV.findById(req.params.id);
        if (!cv) return res.status(404).json({ message: "CV not found" });

        const txtPath = path.join(process.cwd(), `${cv.filePath}.txt`);

        if (fs.existsSync(txtPath)) {
            fs.unlinkSync(txtPath);
        }

        // Also delete associated candidate
        await Candidate.findOneAndDelete({ cvId: cv._id });
        await CV.findByIdAndDelete(req.params.id);
        res.json({ message: "CV deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
