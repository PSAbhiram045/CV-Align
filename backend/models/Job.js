import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        department: {
            type: String,
            required: true,
            trim: true,
        },
        skills: [
            {
                type: String,
                trim: true,
            },
        ],
        experience: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        cvCount: {
            type: Number,
            default: 0,
        },
        // Thresholds for ML-driven status decisions (percent)
        shortlistThreshold: {
            type: Number,
            default: 75,
        },
        rejectThreshold: {
            type: Number,
            default: 40,
        },
        status: {
            type: String,
            enum: ["active", "closed", "draft"],
            default: "active",
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Job", jobSchema);