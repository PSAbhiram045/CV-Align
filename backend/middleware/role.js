const requireRole = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
            console.warn("⚠ requireRole called without roles — route is unprotected.");
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied: insufficient permissions",
            });
        }

        next();
    };
};

export default requireRole;
