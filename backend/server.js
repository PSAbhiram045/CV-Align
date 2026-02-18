import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import jobRoutes from "./routes/jobs.js";
import cvRoutes from "./routes/cvs.js";
import candidateRoutes from "./routes/candidates.js";
import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import mlRoutes from "./routes/ml.js";
import adminRoutes from "./routes/admin.js";
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

// Static folder for uploads
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/jobs", jobRoutes);
app.use("/api/cvs", cvRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/admin", adminRoutes);
// Health check
app.get("/", (req, res) => {
    res.json({ message: "CVAlign API is running" });
});

// ML Integration endpoint (for your friends to implement later)
app.post("/api/ml/evaluate", (req, res) => {
    // This will be implemented by your ML team
    // For now, return mock data
    res.json({
        score: Math.floor(Math.random() * 30) + 70, // Random score 70-100
        strengths: ["Strong technical background", "Good communication skills"],
        weaknesses: ["Limited leadership experience"],
        feedback: "This is where ML-generated feedback will appear",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
