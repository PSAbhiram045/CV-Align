import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["recruiter", "hiring_manager", "admin"],
            default: "recruiter",
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: function () {
                // admin may be global, others must have company
                return this.role !== "admin";
            },
        },
    },
    { timestamps: true }
);

// hash password before save
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// compare helper
userSchema.methods.matchPassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
