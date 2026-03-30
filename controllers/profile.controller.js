// controllers/profile.controller.js

const db     = require("../config/db");
const bcrypt = require("bcrypt");

// ================= GET PROFILE =================
exports.getProfile = (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT id, first_name, last_name, email, mobile, role, status FROM users WHERE id = ?`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Get Profile Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        user: results[0]
      });
    }
  );
};

// ================= UPDATE PROFILE =================
exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  const { first_name, last_name, email, mobile } = req.body;

  if (!first_name && !last_name && !email && !mobile) {
    return res.status(400).json({
      success: false,
      message: "At least one field is required to update"
    });
  }

  // FIX: Only check conflicts if email or mobile are actually being updated
  const checkConditions = [];
  const checkParams     = [];

  if (email)  { checkConditions.push("email = ?");  checkParams.push(email); }
  if (mobile) { checkConditions.push("mobile = ?"); checkParams.push(mobile); }

  if (checkConditions.length > 0) {
    const checkSql = `
      SELECT id FROM users 
      WHERE (${checkConditions.join(" OR ")}) AND id != ?
    `;
    checkParams.push(userId);

    db.query(checkSql, checkParams, (err, results) => {
      if (err) {
        console.error("Profile Check Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (results.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email or mobile already in use by another account"
        });
      }
      doUpdate();
    });
  } else {
    doUpdate();
  }

  function doUpdate() {
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
      [first_name || null, last_name || null, email || null, mobile || null, userId],
      (err) => {
        if (err) {
          console.error("Profile Update Error:", err);
          return res.status(500).json({ success: false, message: "Server error" });
        }
        res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          data: { first_name, last_name, email, mobile }
        });
      }
    );
  }
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Old password and new password are required"
    });
  }

  // FIX: Enforce stronger minimum length
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters"
    });
  }

  // FIX: Prevent reusing the same password
  if (oldPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from old password"
    });
  }

  db.query(`SELECT password FROM users WHERE id = ?`, [userId], async (err, results) => {
    if (err) {
      console.error("Change Password Fetch Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = results[0];

    let isMatch;
    try {
      isMatch = await bcrypt.compare(oldPassword, user.password);
    } catch (e) {
      console.error("Bcrypt Compare Error:", e);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
    } catch (e) {
      console.error("Bcrypt Hash Error:", e);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    db.query(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId], (err) => {
      if (err) {
        console.error("Password Update Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      res.status(200).json({ success: true, message: "Password changed successfully" });
    });
  });
};