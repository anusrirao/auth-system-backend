// middleware/verifyToken.js
// NOTE: This file is DUPLICATE of auth.middleware.js verifyToken
// Keep this file for backward compatibility with routes that import it directly
// Going forward, prefer importing from auth.middleware.js

const jwt = require("jsonwebtoken");

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
      // FIX: Never expose err.message — it reveals token internals
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
    req.user = decoded; // { id, role }
    next();
  });
};

module.exports = verifyToken;