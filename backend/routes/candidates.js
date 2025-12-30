import express from "express";
import fs from "fs";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import CV from "../models/CV.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

function canViewScore(user) {
    if (!user) return false;
    return ["admin", "recruiter", "hiring_manager"].includes(user.role);
}

// Get all candidates
router.get("/", requireAuth, async (req, res) => {
    try {
        const { jobId, status } = req.query;
        const filter = {};

        if (jobId) filter.jobId = jobId;
        if (status) filter.status = status;

        if (!req.user || req.user.role !== "admin") {
            if (!req.user?.companyId) {
                return res.status(403).json({ message: "Missing company scope" });
            }
            filter.companyId = req.user.companyId;
        } else if (req.query.companyId) {
            // admin can optionally filter by companyId
            filter.companyId = req.query.companyId;
        }

        const candidates = await Candidate.find(filter)
            .populate("jobId", "title department")
            .sort({ relevanceScore: -1, createdAt: -1 });

        const includeScore = canViewScore(req.user);

        // Format for frontend
        const formattedCandidates = candidates.map((c) => ({
            _id: c._id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            score: includeScore ? c.relevanceScore || 0 : null,
            status: c.status,
            uploadDate: c.createdAt.toISOString().split("T")[0],
            jobTitle: c.jobId?.title,
            strengths: c.strengths,
            weaknesses: c.weaknesses,
            feedback: c.feedback,
        }));

        res.json(formattedCandidates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single candidate
router.get("/:id", requireAuth, async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate("jobId")
            .populate("cvId");

        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }
        if (req.user.role !== "admin") {
            if (
                !req.user?.companyId ||
                candidate.companyId?.toString() !== req.user.companyId?.toString()
            ) {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        const includeScore = canViewScore(req.user);

        const response = {
            _id: candidate._id,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            jobId: candidate.jobId,
            cvId: candidate.cvId,
            relevanceScore: includeScore ? candidate.relevanceScore : null,
            strengths: candidate.strengths,
            weaknesses: candidate.weaknesses,
            feedback: candidate.feedback,
            status: candidate.status,
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt,
            companyId: candidate.companyId,
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update candidate status
router.patch("/:id/status", requireAuth, async (req, res) => {
    try {
        const { status } = req.body;

        const candidate = await Candidate.findById(req.params.id);

        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        if (req.user.role !== "admin") {
            if (
                !req.user?.companyId ||
                candidate.companyId?.toString() !== req.user.companyId?.toString()
            ) {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        candidate.status = status;
        await candidate.save();

        res.json(candidate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update candidate with ML evaluation (for ML team to use)
router.patch("/:id/evaluate", requireAuth, async (req, res) => {
    try {
        const { relevanceScore, strengths, weaknesses, feedback } = req.body;

        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) return res.status(404).json({ message: "Candidate not found" });

        // allow only admin or company-scoped roles
        if (req.user.role !== "admin") {
            if (
                !req.user?.companyId ||
                candidate.companyId?.toString() !== req.user.companyId?.toString()
            ) {
                return res.status(403).json({ message: "Access denied" });
            }
            if (!["recruiter", "hiring_manager"].includes(req.user.role)) {
                return res.status(403).json({ message: "Insufficient role" });
            }
        }

        candidate.relevanceScore = relevanceScore ?? candidate.relevanceScore;
        candidate.strengths = strengths ?? candidate.strengths;
        candidate.weaknesses = weaknesses ?? candidate.weaknesses;
        candidate.feedback = feedback ?? candidate.feedback;

        await candidate.save();
        const includeScore = canViewScore(req.user);
        const response = {
            _id: candidate._id,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            relevanceScore: includeScore ? candidate.relevanceScore : null,
            strengths: candidate.strengths,
            weaknesses: candidate.weaknesses,
            feedback: candidate.feedback,
            status: candidate.status,
            companyId: candidate.companyId,
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        const cv = await CV.findByIdAndDelete(candidate.cvId);
        if (cv?.filePath) {
            const txtPath = `${cv.filePath}.txt`;
            if (fs.existsSync(txtPath)) {
                fs.unlinkSync(txtPath);
            }
        }
        if (candidate.jobId) {
            await Job.findByIdAndUpdate(candidate.jobId, {
                $inc: { cvCount: -1 },
            });
        }

        await Candidate.findByIdAndDelete(req.params.id);

        res.json({ message: "Candidate deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
