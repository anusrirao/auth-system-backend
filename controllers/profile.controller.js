// controllers/profile.controller.js

const db = require("../config/db");
const bcrypt = require("bcrypt");

// ================= GET PROFILE =================
exports.getProfile = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT id, first_name, last_name, email, mobile, role 
    FROM users 
    WHERE id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("DB Get Profile Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile fetched successfully ✅",
      user: results[0]
    });
  });
};

// ================= UPDATE PROFILE =================
exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { first_name, last_name, email, mobile } = req.body;

  if (!first_name && !last_name && !email && !mobile) {
    return res.status(400).json({
      message: "At least one field is required to update"
    });
  }

  // Check if email or mobile already taken by another user
  const checkSql = `
    SELECT * FROM users 
    WHERE (email = ? OR mobile = ?) AND id != ?
  `;

  db.query(checkSql, [email || null, mobile || null, userId], (err, results) => {
    if (err) {
      console.error("DB Check Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length > 0) {
      return res.status(400).json({
        message: "Email or Mobile already in use by another account"
      });
    }

    const updateSql = `
      UPDATE users 
      SET 
        first_name = COALESCE(?, first_name),
        last_name  = COALESCE(?, last_name),
        email      = COALESCE(?, email),
        mobile     = COALESCE(?, mobile)
      WHERE id = ?
    `;

    db.query(
      updateSql,
      [
        first_name || null,
        last_name  || null,
        email      || null,
        mobile     || null,
        userId
      ],
      (err, result) => {
        if (err) {
          console.error("DB Update Error:", err);
          return res.status(500).json({ message: "Database update error" });
        }

        res.json({
          success: true,
          message: "Profile updated successfully ✅",
          data: { first_name, last_name, email, mobile }
        });
      }
    );
  });
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      message: "Old password and new password are required"
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "New password must be at least 6 characters"
    });
  }

  const sql = `SELECT * FROM users WHERE id = ?`;

  db.query(sql, [userId], async (err, results) => {
    if (err) {
      console.error("DB Fetch Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateSql = `UPDATE users SET password = ? WHERE id = ?`;

    db.query(updateSql, [hashedPassword, userId], (err, result) => {
      if (err) {
        console.error("DB Password Update Error:", err);
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({
        success: true,
        message: "Password changed successfully ✅"
      });
    });
  });
};