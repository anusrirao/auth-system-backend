const express = require("express");
const router  = express.Router();

// ✅ FIX: Proper import (must match file name exactly)
const authController = require("../controllers/auth.controller");

// ================= REGISTER =================
// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    await authController.register(req, res);
  } catch (err) {
    console.error("Register Route Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= LOGIN =================
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    await authController.login(req, res);
  } catch (err) {
    console.error("Login Route Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= ADD USER =================
// POST /api/auth/add-user
router.post("/add-user", async (req, res) => {
  try {
    await authController.addUser(req, res);
  } catch (err) {
    console.error("AddUser Route Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= TEST =================
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes working ✅"
  });
});

module.exports = router;