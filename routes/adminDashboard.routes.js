// routes/adminDashboard.routes.js

const express    = require("express");
const router     = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const adminDash  = require("../controllers/admin.dashboard.controller");
const settlement = require("../controllers/settlement.controller");

// ================= USER MANAGEMENT =================
router.get("/users",                verifyToken, isAdmin, adminDash.getAllUsers);
router.get("/users/:id",            verifyToken, isAdmin, adminDash.getUserById);
router.post("/users/create",        verifyToken, isAdmin, adminDash.createUser);
router.put("/users/activate/:id",   verifyToken, isAdmin, adminDash.activateUser);
router.put("/users/deactivate/:id", verifyToken, isAdmin, adminDash.deactivateUser);

// ================= BENEFICIARY =================
router.post("/beneficiary/add",       verifyToken, isAdmin, settlement.addBeneficiary);
router.get("/beneficiary/list",       verifyToken, isAdmin, settlement.listBeneficiaries);
router.put("/beneficiary/verify/:id", verifyToken, isAdmin, settlement.verifyBeneficiary);

// ================= SETTLEMENT =================
router.post("/settlement/initiate", verifyToken, isAdmin, settlement.initiateSettlement);
router.get("/settlement/history",   verifyToken, isAdmin, settlement.getSettlementHistory);

module.exports = router;