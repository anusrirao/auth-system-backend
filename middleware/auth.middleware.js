const jwt = require("jsonwebtoken");

// ── Verify JWT token ─────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    console.log("SECRET USED:", process.env.JWT_SECRET);
    console.log("JWT ERR:", err);
    console.log("DECODED:", decoded);

    if (err) {
      return res.status(403).json({ message: "Invalid token: " + err.message });
    }

    req.user = decoded;
    next();
  });
};

// ── Super admin role guard ────────────────────────────────────
const isSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied — superadmin only"
    });
  }
  next();
};

// ── Admin role guard ─────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin" && req.user?.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied — admin only"
    });
  }
  next();
};

module.exports = { verifyToken, isSuperAdmin, isAdmin };