// middleware/auth.middleware.js
// ✅ SINGLE SOURCE OF TRUTH — import all middleware from here

const jwt = require("jsonwebtoken");

// ── Verify JWT token ─────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // FIX: Never expose err.message — reveals token internals
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
    req.user = decoded; // { id, role }
    next();
  });
};

// ── Superadmin only ───────────────────────────────────────────
const isSuperAdmin = (req, res, next) => {
  // FIX: Guard against missing req.user
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only superadmin can access this"
    });
  }
  next();
};

// ── Admin only (not superadmin) ───────────────────────────────
const isAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only admin can access this"
    });
  }
  next();
};

// ── Admin OR Superadmin ───────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or Superadmin required"
    });
  }
  next();
};

// ── Any authenticated user ────────────────────────────────────
const isUser = (req, res, next) => {
  const allowed = ["user", "admin", "superadmin"];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }
  next();
};

module.exports = { verifyToken, isSuperAdmin, isAdmin, isAdminOnly, isUser };