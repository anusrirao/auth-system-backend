const db     = require("../config/db");
const bcrypt = require("bcrypt");

// ================= OVERVIEW STATS (SUPER ADMIN) =================
exports.getOverviewStats = (req, res) => {

  const totalUsersSql = `
    SELECT COUNT(*) AS total_users 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'user'
  `;

  const totalAdminsSql = `
    SELECT COUNT(*) AS total_admins 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'admin'
  `;

  const totalTransactionsSql = `
    SELECT 
      COUNT(*)                    AS total_transactions,
      COALESCE(SUM(amount),     0) AS total_amount,
      COALESCE(SUM(commission), 0) AS total_commission
    FROM transactions
  `;
  const activeAdminsSql = `
    SELECT 
      SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END) AS active_admins,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_admins
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'admin'
  `;

  db.query(totalUsersSql, (err, userResults) => {
    if (err) return res.status(500).json({ message: err.message });

    db.query(totalAdminsSql, (err, adminResults) => {
      if (err) return res.status(500).json({ message: err.message });

      db.query(totalTransactionsSql, (err, txnResults) => {
        if (err) return res.status(500).json({ message: err.message });

        db.query(activeAdminsSql, (err, activeResults) => {
          if (err) return res.status(500).json({ message: err.message });

          res.json({
            success: true,
            message: "Overview Stats ✅",
            data: {
              total_users:        userResults[0].total_users        || 0,
              total_admins:       adminResults[0].total_admins       || 0,
              active_admins:      activeResults[0].active_admins     || 0,
              inactive_admins:    activeResults[0].inactive_admins   || 0,
              total_transactions: txnResults[0].total_transactions   || 0,
              total_amount:       txnResults[0].total_amount         || 0,
              total_commission:   txnResults[0].total_commission     || 0,
            }
          });
        });
      });
    });
  });
};

// ================= GET ALL ADMINS (SUPER ADMIN) =================
exports.getAllAdmins = (req, res) => {
  const sql = `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.mobile,
      u.status,
      u.created_at,
      r.name        AS role,
      r.description AS role_description
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'admin'
    ORDER BY u.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({ success: true, count: results.length, data: results });
  });
};

// ================= GET SINGLE ADMIN (SUPER ADMIN) =================
exports.getAdminById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.mobile,
      u.status,
      u.created_at,
      r.name        AS role,
      r.description AS role_description
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND r.name = 'admin'
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ success: true, data: results[0] });
  });
};

// ================= GET ALL USERS (SUPER ADMIN) =================
exports.getAllUsers = (req, res) => {
  const sql = `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.mobile,
      u.status,
      u.created_at,
      r.name        AS role,
      r.description AS role_description
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'user'
    ORDER BY u.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({ success: true, count: results.length, data: results });
  });
};

// ================= CREATE ADMIN (SUPER ADMIN) =================
exports.createAdmin = async (req, res) => {
  const { first_name, last_name, email, mobile, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.query(
    "SELECT * FROM users WHERE email = ? OR mobile = ?",
    [email, mobile || null],
    async (err, existing) => {
      if (err) return res.status(500).json({ message: err.message });

      if (existing.length > 0) {
        return res.status(400).json({ message: "Email or mobile already exists" });
      }

      db.query(
        "SELECT id FROM roles WHERE name = 'admin'",
        [],
        async (err, roleResult) => {
          if (err || roleResult.length === 0) {
            return res.status(500).json({ message: "Admin role not found" });
          }

          const roleId         = roleResult[0].id;
          const hashedPassword = await bcrypt.hash(password, 10);

          db.query(
            `INSERT INTO users 
             (first_name, last_name, email, mobile, password, role, role_id, status)
             VALUES (?, ?, ?, ?, ?, 'admin', ?, 'active')`,
            [first_name, last_name, email, mobile || null, hashedPassword, roleId],
            (err, result) => {
              if (err) return res.status(500).json({ message: err.message });

              res.status(201).json({
                success: true,
                message: "Admin created successfully ✅",
                data: {
                  id:        result.insertId,
                  first_name,
                  last_name,
                  email,
                  mobile,
                  role:      "admin",
                  status:    "active"
                }
              });
            }
          );
        }
      );
    }
  );
};

// ================= ACTIVATE ADMIN (SUPER ADMIN) =================
exports.activateAdmin = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE users SET status = 'active' WHERE id = ? AND role = 'admin'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({ success: true, message: "Admin activated successfully ✅", status: "active" });
    }
  );
};

// ================= DEACTIVATE ADMIN (SUPER ADMIN) =================
exports.deactivateAdmin = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE users SET status = 'inactive' WHERE id = ? AND role = 'admin'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({ success: true, message: "Admin deactivated successfully ✅", status: "inactive" });
    }
  );
};

// ================= ALL TRANSACTIONS (SUPER ADMIN) =================
exports.getAllTransactions = (req, res) => {
  const { status, type, from_date, to_date } = req.query;

  let sql = `
    SELECT
      t.id,
      t.amount,
      t.commission,
      t.net_amount,
      t.type,
      t.status,
      t.description,
      t.created_at,
      CONCAT(s.first_name, ' ', s.last_name) AS sender_name,
      s.email                                AS sender_email,
      s.role                                 AS sender_role,
      CONCAT(r.first_name, ' ', r.last_name) AS receiver_name,
      r.email                                AS receiver_email,
      r.role                                 AS receiver_role
    FROM transactions t
    JOIN users s ON t.sender_id   = s.id
    JOIN users r ON t.receiver_id = r.id
    WHERE 1=1
  `;

  const params = [];
  if (status)    { sql += ` AND t.status = ?`;            params.push(status); }
  if (type)      { sql += ` AND t.type = ?`;              params.push(type); }
  if (from_date) { sql += ` AND DATE(t.created_at) >= ?`; params.push(from_date); }
  if (to_date)   { sql += ` AND DATE(t.created_at) <= ?`; params.push(to_date); }

  sql += ` ORDER BY t.created_at DESC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    const totalAmount     = results.reduce((sum, t) => sum + parseFloat(t.amount     || 0), 0);
    const totalCommission = results.reduce((sum, t) => sum + parseFloat(t.commission || 0), 0);

    res.json({
      success: true,
      count:   results.length,
      summary: { total_amount: totalAmount, total_commission: totalCommission },
      data:    results
    });
  });
};

// ================= GET COMMISSION SETTINGS (SUPER ADMIN) =================
exports.getCommissionSettings = (req, res) => {
  const sql = `SELECT * FROM commission_settings ORDER BY transaction_type`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({ success: true, count: results.length, data: results });
  });
};

// ================= ADD NEW COMMISSION SETTING (SUPER ADMIN) =================
exports.addCommissionSetting = (req, res) => {
  const { transaction_type, commission_type, commission_value } = req.body;

  if (!transaction_type || !commission_type || commission_value === undefined) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!["percentage", "flat"].includes(commission_type)) {
    return res.status(400).json({ message: "commission_type must be 'percentage' or 'flat'" });
  }

  if (commission_value < 0) {
    return res.status(400).json({ message: "commission_value cannot be negative" });
  }

  if (commission_type === "percentage" && commission_value > 100) {
    return res.status(400).json({ message: "Percentage cannot exceed 100" });
  }

  db.query(
    "SELECT * FROM commission_settings WHERE transaction_type = ?",
    [transaction_type],
    (err, existing) => {
      if (err) return res.status(500).json({ message: err.message });

      if (existing.length > 0) {
        return res.status(400).json({ message: `Commission for '${transaction_type}' already exists` });
      }

      db.query(
        `INSERT INTO commission_settings 
         (transaction_type, commission_type, commission_value, status)
         VALUES (?, ?, ?, 'active')`,
        [transaction_type, commission_type, commission_value],
        (err, result) => {
          if (err) return res.status(500).json({ message: err.message });

          res.status(201).json({
            success: true,
            message: "Commission setting added ✅",
            data: {
              id:               result.insertId,
              transaction_type,
              commission_type,
              commission_value,
              status:           "active"
            }
          });
        }
      );
    }
  );
};

// ================= UPDATE COMMISSION SETTING (SUPER ADMIN) =================
exports.updateCommissionSetting = (req, res) => {
  const { id }                                = req.params;
  const { commission_type, commission_value } = req.body;

  if (!commission_type || commission_value === undefined) {
    return res.status(400).json({ message: "commission_type and commission_value are required" });
  }

  if (!["percentage", "flat"].includes(commission_type)) {
    return res.status(400).json({ message: "commission_type must be 'percentage' or 'flat'" });
  }

  if (commission_value < 0) {
    return res.status(400).json({ message: "commission_value cannot be negative" });
  }

  if (commission_type === "percentage" && commission_value > 100) {
    return res.status(400).json({ message: "Percentage cannot exceed 100" });
  }

  db.query(
    `UPDATE commission_settings 
     SET commission_type = ?, commission_value = ?, updated_at = NOW()
     WHERE id = ?`,
    [commission_type, commission_value, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Commission setting not found" });
      }

      res.json({
        success: true,
        message: "Commission updated ✅",
        data:    { id, commission_type, commission_value }
      });
    }
  );
};

// ================= ACTIVATE COMMISSION (SUPER ADMIN) =================
exports.activateCommission = (req, res) => {
  const { id } = req.params;
  db.query(
    "UPDATE commission_settings SET status = 'active', updated_at = NOW() WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Commission setting not found" });
      }

      res.json({ success: true, message: "Commission activated ✅", status: "active" });
    }
  );
};

// ================= DEACTIVATE COMMISSION (SUPER ADMIN) =================
exports.deactivateCommission = (req, res) => {
  const { id } = req.params;
  db.query(
    "UPDATE commission_settings SET status = 'inactive', updated_at = NOW() WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Commission setting not found" });
      }

      res.json({ success: true, message: "Commission deactivated ✅", status: "inactive" });
    }
  );
};

// ================= GET GLOBAL COMMISSION (SUPER ADMIN) =================
exports.getGlobalCommission = (req, res) => {
  const sql = `SELECT * FROM commission_settings WHERE status = 'active' LIMIT 1`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "No commission setting found" });
    }

    res.json({
      success: true,
      data: {
        commission_type:  results[0].commission_type,
        commission_value: results[0].commission_value
      }
    });
  });
};

// ================= UPDATE GLOBAL COMMISSION (SUPER ADMIN) =================
exports.updateGlobalCommission = (req, res) => {
  const { commission_type, commission_value } = req.body;

  if (commission_value === undefined || commission_value === null || commission_value === "") {
    return res.status(400).json({ message: "commission_value is required" });
  }

  const parsed = parseFloat(commission_value);

  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ message: "commission_value must be a valid positive number" });
  }

  if (commission_type && !["percentage", "flat"].includes(commission_type)) {
    return res.status(400).json({ message: "commission_type must be 'percentage' or 'flat'" });
  }

  if (commission_type === "percentage" && parsed > 100) {
    return res.status(400).json({ message: "Percentage cannot exceed 100" });
  }

  db.query(
    `UPDATE commission_settings 
     SET commission_type  = COALESCE(?, commission_type),
         commission_value = ?,
         updated_at       = NOW()`,
    [commission_type || null, parsed],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        success: true,
        message: `Global commission updated ✅ (${result.affectedRows} types updated)`,
        data: {
          commission_type:  commission_type || "unchanged",
          commission_value: parsed,
          rows_updated:     result.affectedRows
        }
      });
    }
  );
};

// ================= GET COMMISSION HISTORY (SUPER ADMIN) =================
exports.getCommissionHistory = (req, res) => {
  const { type, from_date, to_date, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const params     = [];

  if (type) {
    conditions.push("ch.transaction_type = ?");
    params.push(type);
  }
  if (from_date) {
    conditions.push("DATE(ch.created_at) >= ?");
    params.push(from_date);
  }
  if (to_date) {
    conditions.push("DATE(ch.created_at) <= ?");
    params.push(to_date);
  }

  const where = conditions.length > 0
    ? "WHERE " + conditions.join(" AND ")
    : "";

  const summarySQL = `
    SELECT
      COUNT(*)                             AS total_records,
      COALESCE(SUM(commission_earned),  0) AS total_commission_earned,
      COALESCE(SUM(transaction_amount), 0) AS total_transaction_amount
    FROM commission_history ch
    ${where}
  `;

  const listSQL = `
    SELECT
      ch.id,
      ch.transaction_id,
      ch.transaction_type,
      ch.commission_type,
      ch.commission_value,
      ch.transaction_amount,
      ch.commission_earned,
      ch.created_at,
      CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) AS sender_name,
      CONCAT(r.first_name, ' ', COALESCE(r.last_name, '')) AS receiver_name
    FROM commission_history ch
    LEFT JOIN users s ON ch.sender_id   = s.id
    LEFT JOIN users r ON ch.receiver_id = r.id
    ${where}
    ORDER BY ch.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(summarySQL, params, (err, summaryResult) => {
    if (err) return res.status(500).json({ message: err.message });

    db.query(listSQL, [...params, parseInt(limit), parseInt(offset)], (err, listResult) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        success: true,
        summary: {
          total_records:            summaryResult[0].total_records,
          total_commission_earned:  summaryResult[0].total_commission_earned,
          total_transaction_amount: summaryResult[0].total_transaction_amount,
        },
        pagination: {
          page:        parseInt(page),
          limit:       parseInt(limit),
          total_pages: Math.ceil(summaryResult[0].total_records / limit),
        },
        data: listResult
      });
    });
  });
};

// ================= GET COMMISSION HISTORY SUMMARY BY TYPE (SUPER ADMIN) =================
exports.getCommissionSummaryByType = (req, res) => {
  const sql = `
    SELECT
      transaction_type,
      COUNT(*)                             AS total_transactions,
      COALESCE(SUM(transaction_amount), 0) AS total_amount,
      COALESCE(SUM(commission_earned),  0) AS total_commission,
      COALESCE(AVG(commission_earned),  0) AS avg_commission
    FROM commission_history
    GROUP BY transaction_type
    ORDER BY total_commission DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({ success: true, data: results });
  });
};

// ================= SEND NOTIFICATION (SUPER ADMIN) =================
exports.sendNotification = (req, res) => {
  const { user_id, title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  db.query(
    `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
    [user_id || null, title, message],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.status(201).json({
        success: true,
        message: user_id
          ? `Notification sent to user ${user_id} ✅`
          : "Notification sent to all users ✅",
        data: {
          id:      result.insertId,
          user_id: user_id || null,
          title,
          message
        }
      });
    }
  );
};

// ================= GET ALL NOTIFICATIONS (SUPER ADMIN) =================
exports.getAllNotifications = (req, res) => {
  const sql = `
    SELECT
      n.id,
      n.title,
      n.message,
      n.is_read,
      n.created_at,
      n.user_id,
      CASE 
        WHEN n.user_id IS NULL THEN 'All Users'
        ELSE CONCAT(u.first_name, ' ', u.last_name)
      END AS sent_to,
      u.email,
      u.role
    FROM notifications n
    LEFT JOIN users u ON n.user_id = u.id
    ORDER BY n.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({ success: true, count: results.length, data: results });
  });
};

// ================= GET MY NOTIFICATIONS (USER/ADMIN) =================
exports.getMyNotifications = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT id, title, message, is_read, created_at
    FROM notifications
    WHERE user_id = ? OR user_id IS NULL
    ORDER BY created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    const unreadCount = results.filter(n => n.is_read === 0).length;

    res.json({
      success:      true,
      count:        results.length,
      unread_count: unreadCount,
      data:         results
    });
  });
};

// ================= MARK AS READ (USER/ADMIN) =================
exports.markAsRead = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.query(
    `UPDATE notifications 
     SET is_read = 1 
     WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
    [id, userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ success: true, message: "Notification marked as read ✅" });
    }
  );
};

// ================= MARK ALL AS READ (USER/ADMIN) =================
exports.markAllAsRead = (req, res) => {
  const userId = req.user.id;

  db.query(
    `UPDATE notifications 
     SET is_read = 1 
     WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        success: true,
        message: `${result.affectedRows} notifications marked as read ✅`
      });
    }
  );
};

// ================= DELETE NOTIFICATION (SUPER ADMIN) =================
exports.deleteNotification = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM notifications WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ success: true, message: "Notification deleted ✅" });
    }
  );
};