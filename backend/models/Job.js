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
<<<<<<< HEAD
        // Thresholds for ML-driven status decisions (percent)
        shortlistThreshold: {
            type: Number,
            default: 75,
        },
        rejectThreshold: {
            type: Number,
            default: 40,
        },
=======
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
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

<<<<<<< HEAD
export default mongoose.model("Job", jobSchema);
=======
export default mongoose.model("Job", jobSchema);
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
