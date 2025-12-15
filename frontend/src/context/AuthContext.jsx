// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem("cvalign_user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem("cvalign_token") || null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        else delete axios.defaults.headers.common["Authorization"];
    }, [token]);

    useEffect(() => {
        let mounted = true;
        async function restore() {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await fetch("/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    // token invalid or expired
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem("cvalign_token");
                    localStorage.removeItem("cvalign_user");
                    return;
                }

                const data = await res.json();
                if (!mounted) return;
                setUser(data);
                // store updated user
                localStorage.setItem("cvalign_user", JSON.stringify(data));
            } catch (err) {
                console.error("Failed to restore user:", err);
                setToken(null);
                setUser(null);
                localStorage.removeItem("cvalign_token");
                localStorage.removeItem("cvalign_user");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        restore();
        return () => {
            mounted = false;
        };
    }, [token]);

    const login = useCallback(async (email, password) => {
        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || "Login failed");
        }

        localStorage.setItem("cvalign_token", data.token);
        localStorage.setItem("cvalign_user", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

        return data;
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("cvalign_token");
        localStorage.removeItem("cvalign_user");
        delete axios.defaults.headers.common["Authorization"];
    }, []);

    const apiFetch = useCallback(
        async (path, opts = {}) => {
            const headers = { ...(opts.headers || {}) };

            if (token) headers["Authorization"] = `Bearer ${token}`;

            // if body is FormData, don't set Content-Type
            if (!(opts.body instanceof FormData) && !headers["Content-Type"]) {
                headers["Content-Type"] = "application/json";
            }
            const res = await fetch(path, { ...opts, headers });

            if (res.status === 401) {
                // token invalid or expired -> logout (defensive)
                logout();
            }

            return res;
        },
        [token, logout]
    );
    useEffect(() => {
        if (token) localStorage.setItem("cvalign_token", token);
        else localStorage.removeItem("cvalign_token");

        if (user) localStorage.setItem("cvalign_user", JSON.stringify(user));
        else localStorage.removeItem("cvalign_user");
    }, [token, user]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
