// backend/routes/users.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();
const JWT_EXPIRES_IN = "1h";

router.post("/register", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
        const { email, password, fullName, role = "recruiter", companyId } = req.body;

        if (role !== "admin" && !companyId) {
            return res
                .status(400)
                .json({ message: "companyId is required when creating non-admin users" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = new User({
            name: fullName || req.body.name || "Unnamed",
            email,
            password,
            role,
            companyId: role === "admin" ? companyId || null : companyId,
        });
        await user.save();

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name,
                companyId: user.companyId ?? null,
            },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: user.companyId ?? null,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name,
                companyId: user.companyId ?? null,
            },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: user.companyId ?? null,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
