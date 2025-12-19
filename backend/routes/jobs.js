import express from "express";
import Job from "../models/Job.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

// Create job
router.post("/", requireAuth, requireRole(["admin", "hiring_manager"]), async (req, res) => {
    try {
        const {
            title,
            department,
            skills,
            experience,
            description,
            shortlistThreshold,
            rejectThreshold,
        } = req.body;

        const companyId =
            req.user.role === "admin"
                ? req.body.companyId || null // admin MAY assign companyId
                : req.user.companyId; // recruiter/hiring_manager MUST use their company

        if (!companyId) {
            return res.status(400).json({ message: "companyId is required for job creation" });
        }

        const job = new Job({
            title,
            department,
            skills,
            experience,
            description,
            createdBy: req.user.id || req.user._id,
            companyId,
            shortlistThreshold:
                typeof shortlistThreshold === "number" ? shortlistThreshold : undefined,
            rejectThreshold: typeof rejectThreshold === "number" ? rejectThreshold : undefined,
        });

        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all jobs
router.get("/", requireAuth, async (req, res) => {
    try {
        const filter = {};

        if (req.user.role !== "admin") {
            filter.companyId = req.user.companyId;
        } else if (req.query.companyId) {
            // admin can filter jobs by companyId
            filter.companyId = req.query.companyId;
        }

        const jobs = await Job.find(filter).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single job
router.get("/:id", requireAuth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (req.user.role !== "admin") {
            if (job.companyId?.toString() !== req.user.companyId?.toString()) {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        res.json(job);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update job
router.put("/:id", requireAuth, requireRole(["admin", "hiring_manager"]), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (req.user.role !== "admin") {
            if (job.companyId?.toString() !== req.user.companyId?.toString()) {
                return res.status(403).json({ message: "Access denied" });
            }
        }
        if (req.user.role !== "admin") {
            delete req.body.companyId;
        }

        const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        res.json(updatedJob);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete job
router.delete("/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) return res.status(404).json({ message: "Job not found" });
        res.json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;