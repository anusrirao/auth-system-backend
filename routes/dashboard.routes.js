const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const db = require("../config/db");

router.get("/", verifyToken, (req, res) => {
  // ✅ Fetch fresh user from DB using token's id
  const sql = `SELECT id, first_name, last_name, email, mobile, role FROM users WHERE id = ?`;

  db.query(sql, [req.user.id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "Welcome to Dashboard 👋",
      user: results[0]   // ✅ sends full user data
    });
  });
});

module.exports = router;