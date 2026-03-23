const express     = require("express");
const router      = express.Router();
const verifyToken = require("../middleware/verifyToken");
const checkRole   = require("../middleware/checkRole");
const adminDash   = require("../controllers/admin.dashboard.controller");
const settlement  = require("../controllers/settlement.controller");

// ================= USER MANAGEMENT =================
router.get("/users",                verifyToken, checkRole("admin"), adminDash.getAllUsers);
router.get("/users/:id",            verifyToken, checkRole("admin"), adminDash.getUserById);
router.post("/users/create",        verifyToken, checkRole("admin"), adminDash.createUser);
router.put("/users/activate/:id",   verifyToken, checkRole("admin"), adminDash.activateUser);
router.put("/users/deactivate/:id", verifyToken, checkRole("admin"), adminDash.deactivateUser);

// ================= BENEFICIARY =================
router.post("/beneficiary/add",        verifyToken, checkRole("admin"), settlement.addBeneficiary);
router.get("/beneficiary/list",        verifyToken, checkRole("admin"), settlement.listBeneficiaries);
router.put("/beneficiary/verify/:id",  verifyToken, checkRole("admin"), settlement.verifyBeneficiary);

// ================= SETTLEMENT =================
router.post("/settlement/initiate",    verifyToken, checkRole("admin"), settlement.initiateSettlement);
router.get("/settlement/history",      verifyToken, checkRole("admin"), settlement.getSettlementHistory);

module.exports = router;