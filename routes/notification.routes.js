// routes/notification.routes.js

const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth.middleware");
const notificationController = require("../controllers/notification.controller");

router.get("/", verifyToken, notificationController.getNotifications);
router.put("/read/:id", verifyToken, notificationController.markAsRead);
router.delete("/:id", verifyToken, notificationController.deleteNotification);

module.exports = router;