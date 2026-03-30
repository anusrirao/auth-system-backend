// routes/notification.routes.js

const express    = require("express");
const router     = express.Router();
const { verifyToken, isSuperAdmin } = require("../middleware/auth.middleware");
const notificationController        = require("../controllers/notification.controller");

// ================= USER / ADMIN ROUTES =================
// Any logged in user can access these
router.get("/",              verifyToken, notificationController.getNotifications);
router.put("/read/:id",      verifyToken, notificationController.markAsRead);
router.put("/read-all",      verifyToken, notificationController.markAllAsRead);
router.delete("/:id",        verifyToken, notificationController.deleteNotification);

// ================= SUPERADMIN ONLY ROUTES =================
router.post("/send",              verifyToken, isSuperAdmin, notificationController.sendNotification);
router.get("/all",                verifyToken, isSuperAdmin, notificationController.getAllNotifications);
router.delete("/admin/:id",       verifyToken, isSuperAdmin, notificationController.deleteAnyNotification);

module.exports = router;