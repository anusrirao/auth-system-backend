const express = require("express");
const router  = express.Router();

const authController = require("../controllers/auth.controller");

// ================= REGISTER (open — no token needed) =================
// POST http://localhost:3000/api/auth/register
// Body: { first_name, last_name, email, mobile, password }
// Role is always "user" — cannot be overridden
router.post("/register", authController.register);

// ================= LOGIN =================
// POST http://localhost:3000/api/auth/login
// Body: { emailOrMobile, password }
router.post("/login", authController.login);

// ================= ADD USER (Admin / Super Admin seeding) =================
// POST http://localhost:3000/api/auth/add-user
// Body: { first_name, last_name, email, mobile, password, role }
// role: "admin" | "superadmin" only
router.post("/add-user", authController.addUser);

// ================= TEST =================
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Auth routes working ✅" });
});

module.exports = router;