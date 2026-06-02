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
// app.use(cors());
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://cv-align-frontend.onrender.com", // "https://your-app.vercel.app"
        ],
        credentials: true,
    }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
