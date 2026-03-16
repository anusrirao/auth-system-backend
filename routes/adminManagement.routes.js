const express         = require("express");
const router          = express.Router();
const verifyToken     = require("../middleware/verifyToken");
const checkRole       = require("../middleware/checkRole");
const adminController = require("../controllers/admin.controller");

// ================= SUPER ADMIN ONLY =================

// ✅ Overview Stats
router.get("/overview-stats",                         verifyToken, checkRole("super_admin"), adminController.getOverviewStats);

// ✅ All Transactions
router.get("/transactions",                           verifyToken, checkRole("super_admin"), adminController.getAllTransactions);

// ✅ Reports
router.get("/reports/daily",                          verifyToken, checkRole("super_admin"), adminController.getDailyReport);
router.get("/reports/weekly",                         verifyToken, checkRole("super_admin"), adminController.getWeeklyReport);
router.get("/reports/monthly",                        verifyToken, checkRole("super_admin"), adminController.getMonthlyReport);
router.get("/reports/platform",                       verifyToken, checkRole("super_admin"), adminController.getPlatformReport);

// ✅ Wallet Load Requests
router.get("/wallet-load-requests",                   verifyToken, checkRole("super_admin"), adminController.getWalletLoadRequests);
router.put("/wallet-load-requests/approve/:id",       verifyToken, checkRole("super_admin"), adminController.approveWalletLoad);
router.put("/wallet-load-requests/reject/:id",        verifyToken, checkRole("super_admin"), adminController.rejectWalletLoad);

// ✅ Admin Management
router.get("/admins",                                 verifyToken, checkRole("super_admin"), adminController.getAllAdmins);
router.get("/admins/:id",                             verifyToken, checkRole("super_admin"), adminController.getAdminById);
router.post("/admins/create",                         verifyToken, checkRole("super_admin"), adminController.createAdmin);
router.put("/admins/activate/:id",                    verifyToken, checkRole("super_admin"), adminController.activateAdmin);
router.put("/admins/deactivate/:id",                  verifyToken, checkRole("super_admin"), adminController.deactivateAdmin);

// ✅ Commission Settings
router.get("/commission-settings",                    verifyToken, checkRole("super_admin"), adminController.getCommissionSettings);
router.post("/commission-settings/add",               verifyToken, checkRole("super_admin"), adminController.addCommissionSetting);
router.put("/commission-settings/update/:id",         verifyToken, checkRole("super_admin"), adminController.updateCommissionSetting);
router.put("/commission-settings/activate/:id",       verifyToken, checkRole("super_admin"), adminController.activateCommission);
router.put("/commission-settings/deactivate/:id",     verifyToken, checkRole("super_admin"), adminController.deactivateCommission);

// ✅ Global Commission (single value for all types)
router.get("/commission-settings/global",             verifyToken, checkRole("super_admin"), adminController.getGlobalCommission);
router.put("/commission-settings/global/update",      verifyToken, checkRole("super_admin"), adminController.updateGlobalCommission);

// ✅ Commission History
router.get("/commission-history",                     verifyToken, checkRole("super_admin"), adminController.getCommissionHistory);
router.get("/commission-history/summary",             verifyToken, checkRole("super_admin"), adminController.getCommissionSummaryByType);

// ================= ADMIN ONLY =================

// ✅ Admin requests wallet load
router.post("/wallet-load-requests/request",          verifyToken, checkRole("admin"),       adminController.requestWalletLoad);

module.exports = router;