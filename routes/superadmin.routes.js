// routes/superadmin.routes.js

const express         = require("express");
const router          = express.Router();
const { verifyToken, isSuperAdmin } = require("../middleware/auth.middleware");
const adminController = require("../controllers/admin.controller");

// ================= SUPER ADMIN ONLY =================

router.get("/overview-stats",
  verifyToken, isSuperAdmin, adminController.getOverviewStats);

router.get("/users",
  verifyToken, isSuperAdmin, adminController.getAllUsers);

router.get("/transactions",
  verifyToken, isSuperAdmin, adminController.getAllTransactions);

// ================= ADMIN MANAGEMENT =================

router.get("/admins",
  verifyToken, isSuperAdmin, adminController.getAllAdmins);
router.get("/admins/:id",
  verifyToken, isSuperAdmin, adminController.getAdminById);
router.post("/admins/create",
  verifyToken, isSuperAdmin, adminController.createAdmin);
router.put("/admins/activate/:id",
  verifyToken, isSuperAdmin, adminController.activateAdmin);
router.put("/admins/deactivate/:id",
  verifyToken, isSuperAdmin, adminController.deactivateAdmin);

// ================= COMMISSION SETTINGS =================

// Global routes BEFORE /:id routes (prevents "global" being treated as :id)
router.get("/commission-settings/global",
  verifyToken, isSuperAdmin, adminController.getGlobalCommission);

router.put("/commission-settings/global/update",
  verifyToken, isSuperAdmin, adminController.updateGlobalCommission);

router.get("/commission-history",
  verifyToken, isSuperAdmin, adminController.getCommissionHistory);

router.get("/commission-history/summary",
  verifyToken, isSuperAdmin, adminController.getCommissionSummaryByType);

router.get("/commission-settings",
  verifyToken, isSuperAdmin, adminController.getCommissionSettings);

router.post("/commission-settings/add",
  verifyToken, isSuperAdmin, adminController.addCommissionSetting);

router.put("/commission-settings/update/:id",
  verifyToken, isSuperAdmin, adminController.updateCommissionSetting);

router.put("/commission-settings/activate/:id",
  verifyToken, isSuperAdmin, adminController.activateCommission);

router.put("/commission-settings/deactivate/:id",
  verifyToken, isSuperAdmin, adminController.deactivateCommission);


module.exports = router;