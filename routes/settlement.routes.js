// routes/settlement.routes.js

const express    = require("express");
const router     = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const settlement = require("../controllers/settlement.controller");

// ================= BENEFICIARY =================
router.post("/beneficiary/add",       verifyToken, isAdmin, settlement.addBeneficiary);
router.get("/beneficiary/list",       verifyToken, isAdmin, settlement.listBeneficiaries);
router.put("/beneficiary/verify/:id", verifyToken, isAdmin, settlement.verifyBeneficiary);

// ================= SETTLEMENT =================
router.post("/initiate", verifyToken, isAdmin, settlement.initiateSettlement);
router.get("/history",   verifyToken, isAdmin, settlement.getSettlementHistory);

module.exports = router;