const db = require("../config/db");

/* =====================================================
   API 2 — SEND NOTIFICATION
   POST /api/notifications/send
===================================================== */
exports.sendNotification = async (req, res) => {
  try {
    const { user_id, title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: "title and message are required"
      });
    }

    const [result] = await db.query(
      "INSERT INTO notifications (user_id,title,message) VALUES (?,?,?)",
      [user_id || null, title, message]
    );

    res.json({
      success: true,
      message: `Notification sent to user ${user_id || "ALL"} ✅`,
      data: {
        id: result.insertId,
        user_id: user_id || null,
        title,
        message
      }
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};


/* =====================================================
   API 3 — GET ALL NOTIFICATIONS (SUPER ADMIN)
   GET /api/notifications/all
===================================================== */
exports.getAllNotifications = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT 
        n.id,
        n.title,
        n.message,
        n.is_read,
        n.created_at,
        n.user_id,
        u.name AS sent_to,
        u.email,
        r.role_name AS role
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY n.created_at DESC
    `);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};


/* =====================================================
   API 4 — GET MY NOTIFICATIONS
   GET /api/notifications/my
===================================================== */
exports.getMyNotifications = async (req, res) => {
  try {

    const userId = req.user.id;

    const [rows] = await db.query(`
      SELECT 
        id,
        title,
        message,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC
    `, [userId]);


    const [unread] = await db.query(`
      SELECT COUNT(*) AS unread
      FROM notifications
      WHERE (user_id = ? OR user_id IS NULL)
      AND is_read = 0
    `, [userId]);

    res.json({
      success: true,
      count: rows.length,
      unread_count: unread[0].unread,
      data: rows
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};


/* =====================================================
   API 5 — MARK SINGLE NOTIFICATION READ
   PUT /api/notifications/read/:id
===================================================== */
exports.markRead = async (req, res) => {
  try {

    const id = req.params.id;

    const [result] = await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read ✅"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};


/* =====================================================
   API 6 — MARK ALL NOTIFICATIONS READ
   PUT /api/notifications/read-all
===================================================== */
exports.markAllRead = async (req, res) => {
  try {

    const userId = req.user.id;

    const [result] = await db.query(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? OR user_id IS NULL
    `, [userId]);

    res.json({
      success: true,
      message: `${result.affectedRows} notifications marked as read ✅`
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};


/* =====================================================
   API 7 — DELETE NOTIFICATION
   DELETE /api/notifications/delete/:id
===================================================== */
exports.deleteNotification = async (req, res) => {
  try {

    const id = req.params.id;

    const [result] = await db.query(
      "DELETE FROM notifications WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification deleted ✅"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};