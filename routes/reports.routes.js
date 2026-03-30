const express     = require("express");
const router      = express.Router();

const reportsCtrl                   = require("../controllers/reports.controller");
const { verifyToken, isSuperAdmin } = require("../middleware/auth.middleware");

// GET /api/reports/super-admin?period=daily|weekly|monthly
router.get("/super-admin", verifyToken, isSuperAdmin, reportsCtrl.getSuperAdminReport);

module.exports = router;