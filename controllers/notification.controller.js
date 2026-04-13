// controllers/notification.controller.js

const db = require("../config/db");

// ================= GET NOTIFICATIONS =================
exports.getNotifications = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("DB Get Notifications Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.json({
      success: true,
      message: "Notifications fetched successfully ✅",
      count: results.length,
      data: results
    });
  });
};

// ================= MARK AS READ =================
exports.markAsRead = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const sql = `
    UPDATE notifications 
    SET is_read = 1 
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [id, userId], (err, result) => {
    if (err) {
      console.error("DB Mark Read Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification marked as read ✅"
    });
  });
};

// ================= DELETE NOTIFICATION =================
exports.deleteNotification = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const sql = `
    DELETE FROM notifications 
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [id, userId], (err, result) => {
    if (err) {
      console.error("DB Delete Notification Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully ✅"
    });
  });
};