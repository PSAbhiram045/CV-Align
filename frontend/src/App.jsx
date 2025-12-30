import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { useContext } from "react";
//import RecruiterCandidates from "./pages/RecruiterCandidates";
//import AdminDashboard from "./pages/AdminDashboard";
import { AuthContext } from "./context/AuthContext";
import {
    Upload,
    FileText,
    Users,
    BarChart3,
    Filter,
    Download,
    Eye,
    EyeOff,
    Trash2,
    Settings,
    X,
    Check,
    AlertCircle,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const RequireAuth = ({ children, allowedRoles = [] }) => {
    const { token, user } = useContext(AuthContext);
    // not logged in
    if (!token) return <Navigate to="/login" replace />;
    // role not allowed
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <div style={{ padding: 24 }}>Access denied — insufficient permissions</div>;
    }
    return children;
};

const App = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("dashboard");

    //const [token, setToken] = useState(() => localStorage.getItem("cvalign_token"));
    const { token, user, logout } = useContext(AuthContext);
    // Job form state
    //const [role, setRole] = useState("recruiter");
    const role = user?.role?.toLowerCase() || "guest";
    //const [loginEmail, setLoginEmail] = useState("");
    //const [loginPassword, setLoginPassword] = useState("");
    //const [loginError, setLoginError] = useState("");
    const [jobDescriptions, setJobDescriptions] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showNewUserPassword, setShowNewUserPassword] = useState(false);
    const [candidateEmail, setCandidateEmail] = useState("");
    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);
    const [newCompanyName, setNewCompanyName] = useState("");
    const [creatingCompany, setCreatingCompany] = useState(false);
    const [jobForm, setJobForm] = useState({
        title: "",
        department: "",
        skills: "",
        experience: "",
        description: "",
    });

    // ✅ ADMIN CREATE USER STATE (ADDED)
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "recruiter",
        companyId: "",
    });

    // Upload state
    const [uploadJob, setUploadJob] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchJobs();
            fetchCandidates();
        } else {
            setJobDescriptions([]);
            setCandidates([]);
        }
    }, [token]);

    useEffect(() => {
        if (token && role === "admin") {
            fetchCompanies();
        }
    }, [token, role]);

    useEffect(() => {
        if (token && role === "admin" && activeTab === "create-user") {
            fetchUsers();
            fetchCompanies();
        }
    }, [token, role, activeTab]);

    const fetchUsers = async () => {
        try {
            const res = await authFetch(`${API_URL}/admin/users`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users", err);
            showNotification("Failed to fetch users", "error");
        }
    };

    // ✅ AUTH HEADER WRAPPER (ADDED)
    const authFetch = (url, options = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
            },
        });
    };

    const fetchCompanies = async () => {
        try {
            const res = await authFetch(`${API_URL}/admin/companies`);
            const data = await res.json();
            setCompanies(data);
        } catch (err) {
            console.error("Failed to fetch companies", err);
        }
    };

    const showNotification = (message, type = "success") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/jobs`);
            const data = await response.json();
            setJobDescriptions(data);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            showNotification("Failed to fetch jobs", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchCandidates = async () => {
        try {
            const response = await authFetch(`${API_URL}/candidates`);
            const data = await response.json();
            setCandidates(data);
        } catch (error) {
            console.error("Error fetching candidates:", error);
            showNotification("Failed to fetch candidates", "error");
        }
    };

    const handleJobSubmit = async (e) => {
        e.preventDefault();

        if (!jobForm.title || !jobForm.department || !jobForm.description) {
            showNotification("Please fill all required fields", "error");
            return;
        }

        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...jobForm,
                    skills: jobForm.skills
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s),
                }),
            });

            if (response.ok) {
                showNotification("Job created successfully!", "success");
                setJobForm({
                    title: "",
                    department: "",
                    skills: "",
                    experience: "",
                    description: "",
                });
                fetchJobs();
            } else {
                throw new Error("Failed to create job");
            }
        } catch (error) {
            console.error("Error creating job:", error);
            showNotification("Failed to create job", "error");
        } finally {
            setLoading(false);
        }
    };

    // ✅ ADMIN CREATE USER HANDLER (ADDED)
    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (!newUser.name || !newUser.email || !newUser.password) {
            showNotification("All fields are required", "error");
            return;
        }

        if (newUser.role !== "admin" && !newUser.companyId) {
            showNotification("Company is required for recruiters", "error");
            return;
        }

        try {
            const res = await authFetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            showNotification("User created successfully ✅", "success");

            setNewUser({
                name: "",
                email: "",
                password: "",
                role: "recruiter",
            });
        } catch (err) {
            showNotification(err.message, "error");
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        if (!newCompanyName.trim()) {
            showNotification("Company name required", "error");
            return;
        }

        try {
            setCreatingCompany(true);
            const res = await authFetch(`${API_URL}/admin/companies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCompanyName.trim() }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            showNotification("Company created successfully ✅");
            setNewCompanyName("");
            fetchCompanies(); // refresh company dropdown
        } catch (err) {
            showNotification(err.message || "Failed to create company", "error");
        } finally {
            setCreatingCompany(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) {
            setSelectedFiles([]);
            return;
        }
        setSelectedFiles([file]);
    };

    const handleMLEvaluation = async () => {
        if (!uploadJob || selectedFiles.length !== 1 || !candidateEmail) {
            showNotification("Job + 1 CV + Email required", "error");
            return;
        }

        try {
            setUploading(true);

            const selectedJobObj = jobDescriptions.find((j) => j._id === uploadJob);

            const formData = new FormData();
            formData.append("cv", selectedFiles[0]); // ✅ FILE
            formData.append("job_id", uploadJob); // ✅ JOB ID
            formData.append("job_title", selectedJobObj?.title); // ✅ TITLE
            formData.append("jd_text", selectedJobObj?.description || ""); // ✅ FULL JD
            formData.append("email", candidateEmail); // ✅ EMAIL

            const response = await fetch("http://localhost:8000/api/evaluate-cv", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("ML Evaluation failed");

            const data = await response.json();

            showNotification("AI Evaluation Done ✅", "success");
            setSelectedCandidate(data);
            setShowModal(true);
            fetchCandidates();

            setSelectedFiles([]);
            setUploadJob("");
            setCandidateEmail("");
        } catch (err) {
            console.error(err);
            showNotification("ML Evaluation failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleNormalUpload = async () => {
        if (!uploadJob || selectedFiles.length === 0) {
            showNotification("Select job + at least one CV", "error");
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append("jobId", uploadJob);

            selectedFiles.forEach((file) => {
                formData.append("cvs", file);
            });

            const response = await authFetch(`${API_URL}/cvs/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Normal upload failed");

            showNotification("CVs uploaded successfully!", "success");

            setSelectedFiles([]);
            setUploadJob("");

            fetchCandidates();
            fetchJobs();
        } catch (err) {
            console.error(err);
            showNotification("Normal upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const viewCandidate = (candidate) => {
        setSelectedCandidate(candidate);
        setShowModal(true);
    };

    const deleteJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            const response = await authFetch(`${API_URL}/jobs/${jobId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                showNotification("Job deleted successfully", "success");
                fetchJobs();
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            showNotification("Failed to delete job", "error");
        }
    };

    const deleteCandidate = async (candidateId) => {
        if (!window.confirm("Are you sure you want to delete this candidate?")) return;

        try {
            const response = await authFetch(`${API_URL}/candidates/${candidateId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                showNotification("Candidate deleted successfully", "success");
                fetchCandidates();
                fetchJobs();
            }
        } catch (error) {
            console.error("Error deleting candidate:", error);
            showNotification("Failed to delete candidate", "error");
        }
    };

    // const handleLogout = () => {
    //     logout();
    //     navigate("/login");
    // };

    const renderNotification = () => {
        if (!notification) return null;

        return (
            <div className={`notification ${notification.type}`}>
                {notification.type === "success" ? <Check size={20} /> : <AlertCircle size={20} />}
                <span>{notification.message}</span>
            </div>
        );
    };

    const renderCreateCompany = () => {
        if (role !== "admin") return null;

        return (
            <div style={containerStyle}>
                <div style={cardStyle}>
                    <h2 style={titleStyle}>Create Company</h2>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Company Name *</label>
                        <input
                            type="text"
                            placeholder="Enter company name"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <button
                        onClick={handleCreateCompany}
                        style={buttonStyle}
                        disabled={creatingCompany}
                    >
                        {creatingCompany ? "Creating..." : "Create Company"}
                    </button>
                </div>
            </div>
        );
    };

    // ✅ ADMIN CREATE USER UI (ADDED)
    const renderCreateUser = () => (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={titleStyle}>Create User</h2>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Full Name *</label>
                    <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Enter full name"
                        style={inputStyle}
                    />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Email *</label>
                    <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="Enter email address"
                        style={inputStyle}
                    />
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Password *</label>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showNewUserPassword ? "text" : "password"}
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                            style={{ ...inputStyle, paddingRight: "45px" }}
                        />
                        <span
                            onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                            style={eyeIconStyle}
                        >
                            {showNewUserPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Role *</label>
                    <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        style={selectStyle}
                    >
                        <option value="recruiter">Recruiter</option>
                        <option value="hiring_manager">Hiring Manager</option>
                    </select>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Company *</label>
                    <select
                        value={newUser.companyId}
                        onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                        style={selectStyle}
                    >
                        <option value="">Select company</option>
                        {companies.map((c) => (
                            <option key={c._id} value={c._id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleCreateUser}
                    style={buttonStyle}
                    onMouseEnter={(e) => (e.target.style.background = "#0d9488")}
                    onMouseLeave={(e) => (e.target.style.background = "#14b8a6")}
                >
                    Create User
                </button>

                <hr style={{ margin: "40px 0", opacity: 0.2 }} />

                <h2 style={{ ...titleStyle, marginBottom: "16px" }}>Users</h2>

                {users.length === 0 ? (
                    <p style={{ color: "#94a3b8" }}>No users found</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", color: "#e5e7eb" }}>
                            <thead>
                                <tr
                                    style={{ textAlign: "left", borderBottom: "1px solid #334155" }}
                                >
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Company</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} style={{ borderBottom: "1px solid #1e293b" }}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>{u.role}</td>
                                        <td>{u.companyId?.name || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    // Styles
    const containerStyle = {
        display: "flex",
        justifyContent: "center",
        padding: "20px",
    };

    const cardStyle = {
        background: "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        padding: "40px",
        maxWidth: "550px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
    };

    const titleStyle = {
        color: "#fff",
        fontSize: "28px",
        fontWeight: "700",
        marginBottom: "32px",
        textAlign: "left",
    };

    const formGroupStyle = {
        marginBottom: "24px",
    };

    const labelStyle = {
        display: "block",
        color: "#cbd5e1",
        fontSize: "14px",
        fontWeight: "500",
        marginBottom: "8px",
    };

    const inputStyle = {
        width: "100%",
        padding: "14px 16px",
        background: "rgba(15, 23, 42, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "10px",
        color: "#fff",
        fontSize: "15px",
        outline: "none",
        transition: "all 0.3s",
        boxSizing: "border-box",
    };

    const selectStyle = {
        width: "100%",
        padding: "14px 16px",
        background: "rgba(15, 23, 42, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "10px",
        color: "#fff",
        fontSize: "15px",
        outline: "none",
        transition: "all 0.3s",
        boxSizing: "border-box",
        cursor: "pointer",
    };

    const eyeIconStyle = {
        position: "absolute",
        right: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        cursor: "pointer",
        color: "#94a3b8",
        display: "flex",
        alignItems: "center",
    };

    const buttonStyle = {
        width: "100%",
        padding: "16px",
        marginTop: "12px",
        background: "#14b8a6",
        color: "#fff",
        border: "none",
        fontSize: "16px",
        fontWeight: "700",
        borderRadius: "12px",
        cursor: "pointer",
        boxShadow: "0 8px 20px rgba(20, 184, 166, 0.4)",
        transition: "all 0.3s",
    };

    const renderModal = () => {
        if (!showModal || !selectedCandidate) return null;

        return (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{selectedCandidate.name}</h2>
                        <button onClick={() => setShowModal(false)} className="close-btn">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="info-section">
                            <div className="info-row">
                                <strong>Email:</strong>
                                <span>{selectedCandidate.email || "Not provided"}</span>
                            </div>
                            <div className="info-row">
                                <strong>Phone:</strong>
                                <span>{selectedCandidate.phone || "Not provided"}</span>
                            </div>
                            <div className="info-row">
                                <strong>Match Score:</strong>
                                <span className="score-badge">{selectedCandidate.score}%</span>
                            </div>
                            <div className="info-row">
                                <strong>Status:</strong>
                                <span className={`badge ${selectedCandidate.status}`}>
                                    {selectedCandidate.status}
                                </span>
                            </div>
                            <div className="info-row">
                                <strong>Upload Date:</strong>
                                <span>{selectedCandidate.uploadDate}</span>
                            </div>
                            <div className="info-row">
                                <strong>Job Role:</strong>
                                <span>{selectedCandidate.jobTitle || "N/A"}</span>
                            </div>
                        </div>

                        <div className="feedback-section">
                            <h3>AI Analysis</h3>
                            {selectedCandidate.strengths &&
                            selectedCandidate.strengths.length > 0 ? (
                                <>
                                    <div className="feedback-item">
                                        <h4>Strengths:</h4>
                                        <ul>
                                            {selectedCandidate.strengths.map((strength, idx) => (
                                                <li key={idx}>{strength}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="feedback-item">
                                        <h4>Weaknesses:</h4>
                                        <ul>
                                            {selectedCandidate.weaknesses?.map((weakness, idx) => (
                                                <li key={idx}>{weakness}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="feedback-item">
                                        <h4>Detailed Feedback:</h4>
                                        <p>{selectedCandidate.feedback}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="pending-analysis">
                                    <AlertCircle size={48} />
                                    <p>
                                        AI analysis pending. This will be generated once ML
                                        integration is complete.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderJobForm = () => (
        <div className="card fade-in">
            <h2>Create Job Role</h2>
            <div className="form-container">
                <div className="form-group">
                    <label>Job Title *</label>
                    <input
                        type="text"
                        placeholder="e.g., Senior Software Engineer"
                        value={jobForm.title}
                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Department *</label>
                    <input
                        type="text"
                        placeholder="e.g., Engineering"
                        value={jobForm.department}
                        onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Required Skills (comma-separated)</label>
                    <textarea
                        placeholder="e.g., React, Node.js, Python, AWS"
                        rows="3"
                        value={jobForm.skills}
                        onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Preferred Experience (years)</label>
                    <input
                        type="number"
                        placeholder="e.g., 5"
                        value={jobForm.experience}
                        onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <label>Job Description *</label>
                    <textarea
                        placeholder="Detailed job description..."
                        rows="6"
                        value={jobForm.description}
                        onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    />
                </div>
                <button className="btn-primary" onClick={handleJobSubmit} disabled={loading}>
                    {loading ? "Creating..." : "Create Job Role"}
                </button>
            </div>
        </div>
    );

    const renderUploadCV = () => (
        <div className="card fade-in">
            <h2>Upload CVs</h2>
            <div className="form-container">
                {/* Job Selection */}
                <div className="form-group">
                    <label>Select Job Role *</label>
                    <select value={uploadJob} onChange={(e) => setUploadJob(e.target.value)}>
                        <option value="">Select a job role...</option>
                        {jobDescriptions.map((job) => (
                            <option key={job._id} value={job._id}>
                                {job.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Candidate Email (ONLY REQUIRED FOR ML) */}
                <div className="form-group">
                    <label>Candidate Email (for AI evaluation)</label>
                    <input
                        type="email"
                        placeholder="candidate@example.com"
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        style={{ width: "94%" }}
                    />
                </div>

                {/* File Upload */}
                <div className="upload-zone">
                    <Upload className="upload-icon" />
                    <p className="upload-text">Drop CV files here or click to browse</p>
                    <p className="upload-hint">Supports PDF and DOCX</p>
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileSelect}
                        className="file-input"
                    />
                </div>

                {/* Preview */}
                {selectedFiles.length > 0 && (
                    <div className="selected-files">
                        <h3>Selected Files ({selectedFiles.length})</h3>
                        <div className="file-list">
                            {selectedFiles.map((file, idx) => (
                                <div key={idx} className="file-item">
                                    <FileText size={20} />
                                    <span>{file.name}</span>
                                    <span className="file-size">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ✅ NORMAL BULK UPLOAD BUTTON */}
                <button
                    className="btn-secondary"
                    onClick={handleNormalUpload}
                    disabled={uploading || !uploadJob || selectedFiles.length === 0}
                >
                    Upload CVs
                </button>

                {/* ✅ ML EVALUATION BUTTON (SINGLE FILE ONLY) */}
                <button
                    className="btn-primary"
                    onClick={handleMLEvaluation}
                    disabled={
                        uploading || !uploadJob || selectedFiles.length !== 1 || !candidateEmail
                    }
                >
                    Evaluate using AI (Single CV)
                </button>
            </div>
        </div>
    );

    const renderCandidateList = () => (
        <div className="card-full fade-in">
            <div className="card-header">
                <h2>Candidates</h2>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Filter size={18} /> Filter
                    </button>
                    <button className="btn-primary">
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="spinner"></div>
            ) : candidates.length === 0 ? (
                <div className="empty-state">
                    <Users size={64} />
                    <h3>No candidates yet</h3>
                    <p>Upload CVs to start evaluating candidates</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Upload Date</th>
                                <th>Job Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.map((candidate) => (
                                <tr key={candidate._id}>
                                    <td>
                                        <div className="candidate-info">
                                            <div className="avatar">
                                                {candidate.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="candidate-name">
                                                    {candidate.name}
                                                </div>
                                                <div className="candidate-email">
                                                    {candidate.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="score-cell">
                                            <div className="progress-bar">
                                                <div
                                                    className={`progress-fill ${
                                                        candidate.score >= 90
                                                            ? "high"
                                                            : candidate.score >= 70
                                                            ? "medium"
                                                            : "low"
                                                    }`}
                                                    style={{ width: `${candidate.score}%` }}
                                                />
                                            </div>
                                            <span className="score-text">
                                                {candidate.score || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${candidate.status}`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td>{candidate.uploadDate}</td>
                                    <td>{candidate.jobTitle || "N/A"}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => viewCandidate(candidate)}
                                                title="View Details"
                                                className="action-btn view"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                title="Download CV"
                                                className="action-btn download"
                                            >
                                                <Download size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteCandidate(candidate._id)}
                                                title="Delete"
                                                className="action-btn delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderDashboard = () => {
        const totalCandidates = candidates.length;
        const avgScore =
            totalCandidates > 0
                ? Math.round(
                      candidates.reduce((acc, c) => acc + (c.score || 0), 0) / totalCandidates
                  )
                : 0;

        return (
            <div className="fade-in">
                <div className="stats-grid">
                    <div className="stat-card teal">
                        <div className="stat-content">
                            <div>
                                <p className="stat-label">Total Job Roles</p>
                                <p className="stat-value">{jobDescriptions.length}</p>
                            </div>
                            <FileText className="stat-icon" />
                        </div>
                        <p className="stat-footer">Active positions</p>
                    </div>

                    <div className="stat-card blue">
                        <div className="stat-content">
                            <div>
                                <p className="stat-label">Total Candidates</p>
                                <p className="stat-value">{totalCandidates}</p>
                            </div>
                            <Users className="stat-icon" />
                        </div>
                        <p className="stat-footer">Applications received</p>
                    </div>

                    <div className="stat-card purple">
                        <div className="stat-content">
                            <div>
                                <p className="stat-label">Avg. Match Score</p>
                                <p className="stat-value">{avgScore}%</p>
                            </div>
                            <BarChart3 className="stat-icon" />
                        </div>
                        <p className="stat-footer">Overall quality</p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-header-inline">
                            <h3>Recent Job Roles</h3>
                            <button className="btn-link" onClick={() => setActiveTab("create-job")}>
                                + Create New
                            </button>
                        </div>
                        {jobDescriptions.length === 0 ? (
                            <div className="empty-state-small">
                                <FileText size={48} />
                                <p>No job roles yet</p>
                            </div>
                        ) : (
                            <div className="job-list">
                                {jobDescriptions.slice(0, 5).map((job) => (
                                    <div key={job._id} className="job-item">
                                        <div>
                                            <p className="job-title">{job.title}</p>
                                            <p className="job-dept">{job.department}</p>
                                        </div>
                                        <div className="job-stats">
                                            <p className="cv-count">{job.cvCount || 0} CVs</p>
                                            <button
                                                onClick={() => deleteJob(job._id)}
                                                className="action-btn delete-small"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-header-inline">
                            <h3>Top Candidates</h3>
                            <button className="btn-link" onClick={() => setActiveTab("candidates")}>
                                View All
                            </button>
                        </div>
                        {candidates.length === 0 ? (
                            <div className="empty-state-small">
                                <Users size={48} />
                                <p>No candidates yet</p>
                            </div>
                        ) : (
                            <div className="candidate-list">
                                {candidates.slice(0, 5).map((candidate) => (
                                    <div
                                        key={candidate._id}
                                        className="candidate-item"
                                        onClick={() => viewCandidate(candidate)}
                                    >
                                        <div className="candidate-info">
                                            <div className="avatar">
                                                {candidate.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="candidate-name">{candidate.name}</p>
                                                <p className="candidate-date">
                                                    {candidate.uploadDate}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="candidate-score">
                                            <p className="score-value">{candidate.score || 0}</p>
                                            <p className="score-label">score</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Routes>
            {/* LOGIN PAGE */}
            <Route path="/login" element={<Login />} />

            {/* DASHBOARD (YOUR EXISTING UI) */}
            <Route
                path="/"
                element={
                    token ? (
                        <div className="app">
                            {renderNotification()}

                            <div className="header">
                                <div className="header-content">
                                    <h1 className="logo">CVALIGN</h1>
                                    <div className="header-right">
                                        <span className="role-text">
                                            Role: <span className="role-badge">{role}</span>
                                        </span>
                                        <button className="btn-primary" onClick={logout}>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="nav">
                                <div className="nav-content">
                                    <button
                                        className={`nav-btn ${
                                            activeTab === "dashboard" ? "active" : ""
                                        }`}
                                        onClick={() => setActiveTab("dashboard")}
                                    >
                                        Dashboard
                                    </button>

                                    {(role === "admin" || role === "hiring_manager") && (
                                        <button
                                            className={`nav-btn ${
                                                activeTab === "create-job" ? "active" : ""
                                            }`}
                                            onClick={() => setActiveTab("create-job")}
                                        >
                                            Create Job Role
                                        </button>
                                    )}

                                    {(role === "admin" || role === "recruiter") && (
                                        <button
                                            className={`nav-btn ${
                                                activeTab === "upload" ? "active" : ""
                                            }`}
                                            onClick={() => setActiveTab("upload")}
                                        >
                                            Upload CVs
                                        </button>
                                    )}

                                    <button
                                        className={`nav-btn ${
                                            activeTab === "candidates" ? "active" : ""
                                        }`}
                                        onClick={() => setActiveTab("candidates")}
                                    >
                                        Candidates
                                    </button>

                                    {role === "admin" && (
                                        <button
                                            className={`nav-btn ${
                                                activeTab === "create-company" ? "active" : ""
                                            }`}
                                            onClick={() => setActiveTab("create-company")}
                                        >
                                            Create Company
                                        </button>
                                    )}

                                    {role === "admin" && (
                                        <button
                                            className={`nav-btn ${
                                                activeTab === "create-user" ? "active" : ""
                                            }`}
                                            onClick={() => setActiveTab("create-user")}
                                        >
                                            Create User
                                        </button>
                                    )}

                                    {/* ADMIN DASHBOARD NAV */}
                                    {/* {role === "admin" && (
                                        <button
                                            className={`nav-btn ${
                                                activeTab === "admin" ? "active" : ""
                                            }`}
                                            onClick={() => navigate("/admin")}
                                        >
                                            Admin
                                        </button>
                                    )} */}
                                </div>
                            </div>

                            <div className="main">
                                {activeTab === "dashboard" && renderDashboard()}
                                {activeTab === "create-job" &&
                                    (role === "admin" || role === "hiring_manager") &&
                                    renderJobForm()}
                                {activeTab === "upload" &&
                                    (role === "admin" || role === "recruiter") &&
                                    renderUploadCV()}
                                {activeTab === "candidates" && renderCandidateList()}
                                {activeTab === "create-company" &&
                                    role === "admin" &&
                                    renderCreateCompany()}
                                {activeTab === "create-user" &&
                                    role === "admin" &&
                                    renderCreateUser()}
                            </div>

                            {renderModal()}
                        </div>
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />
        </Routes>
    );
};

export default App;
