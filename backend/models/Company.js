// backend/models/Company.js
import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Company", CompanySchema);
