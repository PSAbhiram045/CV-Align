import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            console.error("Login error:", error);
            setErr(error?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={glowBorder}>
                <div style={boxStyle}>
                    <h2 style={titleStyle}>Welcome Back 👋</h2>
                    <p style={subText}>Login to continue to CVALIGN</p>

                    <form onSubmit={submit}>
                        {/* EMAIL */}
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={inputStyle}
                        />

                        {/* PASSWORD */}
                        <div style={{ position: "relative", marginTop: "22px" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ ...inputStyle, paddingRight: "55px" }}
                            />
                            <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
                                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                            </span>
                        </div>

                        <button type="submit" style={btnStyle}>
                            Login
                        </button>
                    </form>

                    {err && <p style={errorStyle}>{err}</p>}
                </div>
            </div>
        </div>
    );
}

const pageStyle = {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #0f172a 0%, #020617 70%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
};

const glowBorder = {
    padding: "3px",
    borderRadius: "28px",
    background: "linear-gradient(135deg, #14b8a6, #6366f1, #ec4899)",
    boxShadow: "0 0 35px rgba(20,184,166,0.5)",
    width: "100%",
    maxWidth: "480px",
    boxSizing: "border-box",
};

const boxStyle = {
    background: "linear-gradient(145deg, rgba(30,41,59,0.97), rgba(15,23,42,0.98))",
    padding: "48px 32px",
    width: "100%",
    borderRadius: "26px",
    boxShadow: "0 40px 100px rgba(0,0,0,0.75)",
    textAlign: "center",
    boxSizing: "border-box",
};

const titleStyle = {
    color: "#fff",
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "10px",
    letterSpacing: "0.5px",
};

const subText = {
    color: "#94a3b8",
    marginBottom: "40px",
    fontSize: "15px",
};

const inputStyle = {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    marginTop: "12px",
    transition: "0.25s",
    boxSizing: "border-box",
};

const btnStyle = {
    width: "100%",
    padding: "18px",
    marginTop: "36px",
    background: "linear-gradient(135deg, #14b8a6, #0d9488)",
    color: "#fff",
    border: "none",
    fontSize: "18px",
    fontWeight: "700",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 12px 35px rgba(20,184,166,0.6)",
    transition: "0.25s",
};

const eyeStyle = {
    position: "absolute",
    right: "18px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#cbd5f5",
};

const errorStyle = {
    marginTop: "22px",
    background: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "500",
};
