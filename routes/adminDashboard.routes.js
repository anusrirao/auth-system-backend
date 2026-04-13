// routes/adminDashboard.routes.js

const express   = require("express");
const router    = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const adminDash = require("../controllers/admin.dashboard.controller");

// ================= USER MANAGEMENT =================
router.get("/users",                verifyToken, isAdmin, adminDash.getAllUsers);
router.get("/users/:id",            verifyToken, isAdmin, adminDash.getUserById);
router.post("/users/create",        verifyToken, isAdmin, adminDash.createUser);
router.put("/users/activate/:id",   verifyToken, isAdmin, adminDash.activateUser);
router.put("/users/deactivate/:id", verifyToken, isAdmin, adminDash.deactivateUser);

module.exports = router;