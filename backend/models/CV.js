import mongoose from "mongoose";

const cvSchema = new mongoose.Schema(
    {
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        fileUrl: String,
        extractedText: {
            type: String,
            required: true,
        },
        fileSize: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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

export default mongoose.model("CV", cvSchema);
