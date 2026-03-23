const express         = require("express");
const router          = express.Router();
const verifyToken     = require("../middleware/verifyToken");
const checkRole       = require("../middleware/checkRole");
const adminController = require("../controllers/admin.controller");

// ================= SUPER ADMIN ONLY =================
// Send notification (to all or specific user)
router.post("/send",
  verifyToken, checkRole("super_admin"), adminController.sendNotification);

// Get all notifications
router.get("/all",
  verifyToken, checkRole("super_admin"), adminController.getAllNotifications);

// Delete notification
router.delete("/delete/:id",
  verifyToken, checkRole("super_admin"), adminController.deleteNotification);

// ================= USER + ADMIN =================
// Get my notifications
router.get("/my",
  verifyToken, adminController.getMyNotifications);

// Mark single as read
router.put("/read/:id",
  verifyToken, adminController.markAsRead);

// Mark all as read
router.put("/read-all",
  verifyToken, adminController.markAllAsRead);

module.exports = router;