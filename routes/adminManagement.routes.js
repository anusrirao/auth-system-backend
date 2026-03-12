const express         = require("express");
const router          = express.Router();
const verifyToken     = require("../middleware/verifyToken");
const checkRole       = require("../middleware/checkRole");
const adminController = require("../controllers/admin.controller");

// ================= SUPER ADMIN ONLY =================

// ✅ Overview Stats
router.get("/overview-stats",                    verifyToken, checkRole("super_admin"), adminController.getOverviewStats);

// ✅ All Transactions
router.get("/transactions",                      verifyToken, checkRole("super_admin"), adminController.getAllTransactions);

// ✅ Reports 👈 NEWLY ADDED
router.get("/reports/daily",                     verifyToken, checkRole("super_admin"), adminController.getDailyReport);
router.get("/reports/weekly",                    verifyToken, checkRole("super_admin"), adminController.getWeeklyReport);
router.get("/reports/monthly",                   verifyToken, checkRole("super_admin"), adminController.getMonthlyReport);
router.get("/reports/platform",                  verifyToken, checkRole("super_admin"), adminController.getPlatformReport);

// ✅ Wallet Load Requests
router.get("/wallet-load-requests",              verifyToken, checkRole("super_admin"), adminController.getWalletLoadRequests);
router.put("/wallet-load-requests/approve/:id",  verifyToken, checkRole("super_admin"), adminController.approveWalletLoad);
router.put("/wallet-load-requests/reject/:id",   verifyToken, checkRole("super_admin"), adminController.rejectWalletLoad);

// ✅ Get all admins
router.get("/admins",                            verifyToken, checkRole("super_admin"), adminController.getAllAdmins);

// ✅ Get single admin
router.get("/admins/:id",                        verifyToken, checkRole("super_admin"), adminController.getAdminById);

// ✅ Create admin
router.post("/admins/create",                    verifyToken, checkRole("super_admin"), adminController.createAdmin);

// ✅ Activate admin
router.put("/admins/activate/:id",               verifyToken, checkRole("super_admin"), adminController.activateAdmin);

// ✅ Deactivate admin
router.put("/admins/deactivate/:id",             verifyToken, checkRole("super_admin"), adminController.deactivateAdmin);

// ================= ADMIN ONLY =================

// ✅ Admin requests wallet load
router.post("/wallet-load-requests/request",     verifyToken, checkRole("admin"),       adminController.requestWalletLoad);

module.exports = router;