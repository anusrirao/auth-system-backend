// controllers/notification.controller.js

const db = require("../config/db");

// ================= GET MY NOTIFICATIONS (USER/ADMIN) =================
exports.getNotifications = (req, res) => {
  const userId = req.user.id;

  const { is_read, page: rawPage, limit: rawLimit } = req.query;

  const page   = Math.max(1, parseInt(rawPage)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(rawLimit) || 20));
  const offset = (page - 1) * limit;

  let sql    = `SELECT * FROM notifications WHERE user_id = ?`;
  const params = [userId];

  if (is_read !== undefined) {
    sql += ` AND is_read = ?`;
    params.push(is_read === "true" || is_read === "1" ? 1 : 0);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get Notifications Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    // Get unread count
    db.query(
      "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId],
      (err, countResult) => {
        if (err) {
          console.error("Unread Count Error:", err);
          return res.status(500).json({ success: false, message: "Server error" });
        }

        res.status(200).json({
          success:      true,
          unread_count: countResult[0].unread_count,
          count:        results.length,
          pagination:   { page, limit },
          data:         results
        });
      }
    );
  });
};

// ================= MARK SINGLE NOTIFICATION AS READ =================
exports.markAsRead = (req, res) => {
  const { id }   = req.params;
  const userId   = req.user.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid notification ID" });
  }

  // FIX: Ensure user can only mark their own notifications as read
  db.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    [id, userId],
    (err, result) => {
      if (err) {
        console.error("Mark As Read Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
      res.status(200).json({ success: true, message: "Notification marked as read" });
    }
  );
};

// ================= MARK ALL NOTIFICATIONS AS READ =================
exports.markAllAsRead = (req, res) => {
  const userId = req.user.id;

  db.query(
    "UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
    [userId],
    (err, result) => {
      if (err) {
        console.error("Mark All As Read Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      res.status(200).json({
        success:  true,
        message:  "All notifications marked as read",
        updated:  result.affectedRows
      });
    }
  );
};

// ================= DELETE MY NOTIFICATION =================
exports.deleteNotification = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid notification ID" });
  }

  // FIX: User can only delete their own notifications
  db.query(
    "DELETE FROM notifications WHERE id = ? AND user_id = ?",
    [id, userId],
    (err, result) => {
      if (err) {
        console.error("Delete Notification Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
      res.status(200).json({ success: true, message: "Notification deleted successfully" });
    }
  );
};

// ================= SEND NOTIFICATION (SUPERADMIN) =================
exports.sendNotification = (req, res) => {
  const { user_id, title, message, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and message are required" });
  }

  // FIX: Support broadcast (no user_id) or targeted (specific user_id)
  if (user_id) {
    // Targeted: send to specific user
    if (isNaN(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user_id" });
    }

    db.query("SELECT id FROM users WHERE id = ?", [user_id], (err, userResults) => {
      if (err) {
        console.error("User Check Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (userResults.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      db.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [user_id, title, message, type || "info"],
        (err, result) => {
          if (err) {
            console.error("Send Notification Error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
          }
          res.status(201).json({
            success:        true,
            message:        "Notification sent successfully",
            notificationId: result.insertId
          });
        }
      );
    });
  } else {
    // Broadcast: send to ALL users
    db.query("SELECT id FROM users WHERE status = 'active'", (err, users) => {
      if (err) {
        console.error("Broadcast Fetch Users Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: "No active users found" });
      }

      const values = users.map((u) => [u.id, title, message, type || "info", 0]);
      db.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ?`,
        [values],
        (err, result) => {
          if (err) {
            console.error("Broadcast Notification Error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
          }
          res.status(201).json({
            success:    true,
            message:    `Notification broadcast to ${users.length} users`,
            sent_count: users.length
          });
        }
      );
    });
  }
};

// ================= GET ALL NOTIFICATIONS (SUPERADMIN) =================
exports.getAllNotifications = (req, res) => {
  const { user_id, is_read, from_date, to_date } = req.query;

  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  let sql    = `
    SELECT n.*, u.first_name, u.last_name, u.email
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (user_id)  { sql += ` AND n.user_id = ?`;           params.push(user_id); }
  if (is_read !== undefined) { sql += ` AND n.is_read = ?`; params.push(is_read === "true" || is_read === "1" ? 1 : 0); }
  if (from_date){ sql += ` AND DATE(n.created_at) >= ?`; params.push(from_date); }
  if (to_date)  { sql += ` AND DATE(n.created_at) <= ?`; params.push(to_date); }

  sql += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get All Notifications Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(200).json({
      success:    true,
      count:      results.length,
      pagination: { page, limit },
      data:       results
    });
  });
};

// ================= DELETE ANY NOTIFICATION (SUPERADMIN) =================
exports.deleteAnyNotification = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid notification ID" });
  }

  db.query("DELETE FROM notifications WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Admin Delete Notification Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  });
};