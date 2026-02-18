// backend/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";

const router = express.Router();

function createToken(user) {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
            name: user.name,
            companyId: user.companyId ?? null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

// register
router.post("/register", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
        const { name, email, password, role = "recruiter", companyId } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: "Missing fields" });

        if (role !== "admin" && !companyId) {
            return res
                .status(400)
                .json({ message: "companyId is required when creating non-admin users" });
        }
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "User already exists" });

        const user = new User({ name, email, password, role, companyId });
        await user.save();

        const token = createToken(user);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId ?? null,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Missing fields" });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const match = await user.matchPassword(password);
        if (!match) return res.status(401).json({ message: "Invalid credentials" });

        const token = createToken(user);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId ?? null,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/me", requireAuth, async (req, res) => {
    try {
        // expect requireAuth to attach decoded token to req.user (adapt if your middleware uses a different prop)
        const payload = req.user;
        if (!payload || !payload.id) return res.status(401).json({ message: "Unauthorized" });

        const user = await User.findById(payload.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId ?? null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
