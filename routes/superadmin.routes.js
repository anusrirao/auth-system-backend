const express         = require("express");
const router          = require("express").Router();
const verifyToken     = require("../middleware/verifyToken");
const checkRole       = require("../middleware/checkRole");
const adminController = require("../controllers/admin.controller");

// ================= SUPER ADMIN ONLY =================

// Overview Stats
router.get("/overview-stats",
  verifyToken, checkRole("superadmin"), adminController.getOverviewStats);

// All Users
router.get("/users",
  verifyToken, checkRole("superadmin"), adminController.getAllUsers);

// All Transactions
router.get("/transactions",
  verifyToken, checkRole("superadmin"), adminController.getAllTransactions);

// Reports
router.get("/reports/daily",
  verifyToken, checkRole("superadmin"), adminController.getDailyReport);
router.get("/reports/weekly",
  verifyToken, checkRole("superadmin"), adminController.getWeeklyReport);
router.get("/reports/monthly",
  verifyToken, checkRole("superadmin"), adminController.getMonthlyReport);
router.get("/reports/platform",
  verifyToken, checkRole("superadmin"), adminController.getPlatformReport);

// Admin Management
router.get("/admins",
  verifyToken, checkRole("superadmin"), adminController.getAllAdmins);
router.get("/admins/:id",
  verifyToken, checkRole("superadmin"), adminController.getAdminById);
router.post("/admins/create",
  verifyToken, checkRole("superadmin"), adminController.createAdmin);
router.put("/admins/activate/:id",
  verifyToken, checkRole("superadmin"), adminController.activateAdmin);
router.put("/admins/deactivate/:id",
  verifyToken, checkRole("superadmin"), adminController.deactivateAdmin);

// Commission Settings
router.get("/commission-settings",
  verifyToken, checkRole("superadmin"), adminController.getCommissionSettings);
router.post("/commission-settings/add",
  verifyToken, checkRole("superadmin"), adminController.addCommissionSetting);
router.put("/commission-settings/update/:id",
  verifyToken, checkRole("superadmin"), adminController.updateCommissionSetting);
router.put("/commission-settings/activate/:id",
  verifyToken, checkRole("superadmin"), adminController.activateCommission);
router.put("/commission-settings/deactivate/:id",
  verifyToken, checkRole("superadmin"), adminController.deactivateCommission);

// Global Commission
router.get("/commission-settings/global",
  verifyToken, checkRole("superadmin"), adminController.getGlobalCommission);
router.put("/commission-settings/global/update",
  verifyToken, checkRole("superadmin"), adminController.updateGlobalCommission);

// Commission History
router.get("/commission-history",
  verifyToken, checkRole("superadmin"), adminController.getCommissionHistory);
router.get("/commission-history/summary",
  verifyToken, checkRole("superadmin"), adminController.getCommissionSummaryByType);

// Notifications
router.post("/notifications/send",
  verifyToken, checkRole("superadmin"), adminController.sendNotification);
router.get("/notifications/all",
  verifyToken, checkRole("superadmin"), adminController.getAllNotifications);
router.delete("/notifications/delete/:id",
  verifyToken, checkRole("superadmin"), adminController.deleteNotification);
router.get("/notifications/my",
  verifyToken, adminController.getMyNotifications);
router.put("/notifications/read/:id",
  verifyToken, adminController.markAsRead);
router.put("/notifications/read-all",
  verifyToken, adminController.markAllAsRead);

module.exports = router;