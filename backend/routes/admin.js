// backend/routes/admin.js
import express from "express";
import Company from "../models/Company.js";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

// protect all admin routes
router.use(requireAuth);
router.use(requireRole(["admin"]));

/**
 * Create a company
 * body: { name, metadata? }
 */
router.post("/companies", async (req, res) => {
    try {
        const { name, metadata = {} } = req.body;
        if (!name) return res.status(400).json({ message: "name is required" });

        const exists = await Company.findOne({ name });
        if (exists) return res.status(400).json({ message: "Company already exists" });

        const company = new Company({ name, metadata });
        await company.save();
        res.status(201).json(company);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * List companies
 */
router.get("/companies", async (req, res) => {
    try {
        const companies = await Company.find({}).sort({ name: 1 });
        res.json(companies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * Create a user (recruiter / hiring_manager)
 * body: { name, email, password, role = "recruiter", companyId }
 * - companyId is required for non-admin users
 */
router.post("/users", async (req, res) => {
    try {
        const { name, email, password, role = "recruiter", companyId } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: "Missing fields" });

        // non-admin users must belong to a company
        if (role !== "admin" && !companyId) {
            return res.status(400).json({ message: "companyId is required for non-admin users" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "User already exists" });

        const user = new User({
            name,
            email,
            password,
            role,
            companyId: role === "admin" ? companyId ?? null : companyId,
        });

        await user.save();

        // respond without password
        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId ?? null,
            createdAt: user.createdAt,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * List users (admins only)
 * optional query: ?companyId=...
 */
router.get("/users", async (req, res) => {
    try {
        const filter = {};
        if (req.query.companyId) filter.companyId = req.query.companyId;
        const users = await User.find(filter).populate("companyId", "name").select("-password");
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * Update user (change role/company)
 */
router.patch("/users/:id", async (req, res) => {
    try {
        const updates = { ...req.body };
        // prevent direct password overwrite here; use a separate endpoint if needed
        if ("password" in updates) delete updates.password;
        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select(
            "-password"
        );
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        // Optional safety: prevent deleting the last admin
        if (user.role === "admin") {
            const adminCount = await User.countDocuments({ role: "admin" });
            if (adminCount <= 1) {
                return res.status(400).json({ message: "Cannot delete the last admin user" });
            }
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
