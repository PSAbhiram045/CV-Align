import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        cvId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CV",
<<<<<<< HEAD
            default: null,
=======
            required: true,
>>>>>>> 849ca21 (restore full project with proper package.json file structure)
        },
        extractedText: String,

        // ML-generated fields (will be populated later)
        relevanceScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        strengths: [String],
        weaknesses: [String],
        feedback: String,

        score: {
            type: Number,
            default: null,
        },
        rank: {
            type: Number,
            default: null,
        },

        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true, // migration required for existing rows (see note)
            index: true,
        },

        status: {
            type: String,
            enum: ["pending", "reviewed", "shortlisted", "rejected"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

candidateSchema.methods.toSanitizedObject = function (opts = { includeScore: false }) {
    const obj = {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        jobId: this.jobId,
        cvId: this.cvId,
        extractedText: this.extractedText,
        relevanceScore: this.relevanceScore,
        strengths: this.strengths,
        weaknesses: this.weaknesses,
        feedback: this.feedback,
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        companyId: this.companyId,
    };
    if (opts.includeScore) {
        obj.score = this.score;
        obj.rank = this.rank;
    } else {
        obj.score = null;
        obj.rank = null;
    }
    return obj;
};

export default mongoose.model("Candidate", candidateSchema);
