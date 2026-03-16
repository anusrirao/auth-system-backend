const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

// ================= DEBUG =================
if (!authController) {
  console.error("❌ Auth controller not loaded");
} else {
  console.log("✅ authController loaded:", Object.keys(authController));
}


// ================= REGISTER =================
router.post("/register", authController.register);


// ================= VERIFY OTP =================
router.post("/verify-otp", authController.verifyOTP);


// ================= LOGIN =================
router.post("/login", authController.login);


// ================= ADD USER (ADMIN / SUPERADMIN) =================
if (authController.addUser) {
  router.post("/add-user", authController.addUser);
} else {
  console.error("❌ addUser function missing in auth.controller.js");
}


// ================= TEST ROUTE =================
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes working ✅"
  });
});


module.exports = router;