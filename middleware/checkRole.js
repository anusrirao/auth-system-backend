// middleware/checkRole.js
// This file is a simplified role checker
// For full role middleware, use auth.middleware.js
// This is kept for backward compatibility

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // FIX: Guard against missing req.user (verifyToken must run first)
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`
      });
    }

    next();
  };
};

module.exports = checkRole;