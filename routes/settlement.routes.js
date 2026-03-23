const express    = require("express");
const router     = express.Router();
const verifyToken = require("../middleware/verifyToken");
const checkRole   = require("../middleware/checkRole");
const settlement  = require("../controllers/settlement.controller");

router.post("/beneficiary/add",       verifyToken, checkRole("admin"), settlement.addBeneficiary);
router.get("/beneficiary/list",       verifyToken, checkRole("admin"), settlement.listBeneficiaries);
router.put("/beneficiary/verify/:id", verifyToken, checkRole("admin"), settlement.verifyBeneficiary);
router.post("/initiate",              verifyToken, checkRole("admin"), settlement.initiateSettlement);
router.get("/history",                verifyToken, checkRole("admin"), settlement.getSettlementHistory);

module.exports = router;