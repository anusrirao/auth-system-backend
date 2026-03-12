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
      COUNT(*)        AS total_transactions,
      SUM(amount)     AS total_amount,
      SUM(commission) AS total_commission
    FROM transactions
  `;

  const activeAdminsSql = `
    SELECT 
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_admins,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_admins
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
      u.is_active,
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

    res.json({
      success: true,
      count:   results.length,
      data:    results
    });
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
      u.is_active,
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
             (first_name, last_name, email, mobile, password, role, role_id, is_active)
             VALUES (?, ?, ?, ?, ?, 'admin', ?, 1)`,
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
                  is_active: 1
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
    "UPDATE users SET is_active = 1 WHERE id = ? AND role = 'admin'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({
        success:   true,
        message:   "Admin activated successfully ✅",
        is_active: 1
      });
    }
  );
};

// ================= DEACTIVATE ADMIN (SUPER ADMIN) =================
exports.deactivateAdmin = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE users SET is_active = 0 WHERE id = ? AND role = 'admin'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({
        success:   true,
        message:   "Admin deactivated successfully ✅",
        is_active: 0
      });
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

  if (status) {
    sql += ` AND t.status = ?`;
    params.push(status);
  }

  if (type) {
    sql += ` AND t.type = ?`;
    params.push(type);
  }

  if (from_date) {
    sql += ` AND DATE(t.created_at) >= ?`;
    params.push(from_date);
  }

  if (to_date) {
    sql += ` AND DATE(t.created_at) <= ?`;
    params.push(to_date);
  }

  sql += ` ORDER BY t.created_at DESC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    const totalAmount     = results.reduce((sum, t) => sum + parseFloat(t.amount     || 0), 0);
    const totalCommission = results.reduce((sum, t) => sum + parseFloat(t.commission || 0), 0);

    res.json({
      success: true,
      count:   results.length,
      summary: {
        total_amount:     totalAmount,
        total_commission: totalCommission,
      },
      data: results
    });
  });
};

// ================= GET WALLET LOAD REQUESTS (SUPER ADMIN) =================
exports.getWalletLoadRequests = (req, res) => {
  const { status } = req.query;

  let sql = `
    SELECT
      w.id,
      w.amount,
      w.status,
      w.remark,
      w.requested_at,
      w.actioned_at,
      u.id         AS admin_id,
      u.first_name,
      u.last_name,
      u.email,
      u.mobile
    FROM wallet_load_requests w
    JOIN users u ON w.admin_id = u.id
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    sql += ` AND w.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY w.requested_at DESC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({
      success: true,
      count:   results.length,
      data:    results
    });
  });
};

// ================= APPROVE WALLET LOAD (SUPER ADMIN) =================
exports.approveWalletLoad = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM wallet_load_requests WHERE id = ? AND status = 'pending'",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });

      if (results.length === 0) {
        return res.status(404).json({ message: "Request not found or already actioned" });
      }

      const request = results[0];

      db.query(
        "UPDATE wallet_load_requests SET status = 'approved', actioned_at = NOW() WHERE id = ?",
        [id],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });

          db.query(
            `INSERT INTO wallets (user_id, current_balance)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE current_balance = current_balance + ?`,
            [request.admin_id, request.amount, request.amount],
            (err) => {
              if (err) return res.status(500).json({ message: "Wallet update failed" });

              res.json({
                success: true,
                message: "Wallet load approved ✅",
                data: {
                  request_id: id,
                  admin_id:   request.admin_id,
                  amount:     request.amount,
                  status:     "approved"
                }
              });
            }
          );
        }
      );
    }
  );
};

// ================= REJECT WALLET LOAD (SUPER ADMIN) =================
exports.rejectWalletLoad = (req, res) => {
  const { id }     = req.params;
  const { remark } = req.body;

  db.query(
    "SELECT * FROM wallet_load_requests WHERE id = ? AND status = 'pending'",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });

      if (results.length === 0) {
        return res.status(404).json({ message: "Request not found or already actioned" });
      }

      db.query(
        `UPDATE wallet_load_requests 
         SET status = 'rejected', remark = ?, actioned_at = NOW() 
         WHERE id = ?`,
        [remark || "Rejected by super admin", id],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });

          res.json({
            success: true,
            message: "Wallet load rejected ❌",
            data: {
              request_id: id,
              status:     "rejected",
              remark:     remark || "Rejected by super admin"
            }
          });
        }
      );
    }
  );
};

// ================= REQUEST WALLET LOAD (ADMIN) =================
exports.requestWalletLoad = (req, res) => {
  const adminId    = req.user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid amount is required" });
  }

  db.query(
    `INSERT INTO wallet_load_requests (admin_id, amount, status)
     VALUES (?, ?, 'pending')`,
    [adminId, amount],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      res.status(201).json({
        success: true,
        message: "Wallet load request submitted ✅",
        data: {
          request_id: result.insertId,
          admin_id:   adminId,
          amount,
          status:     "pending"
        }
      });
    }
  );
};

// ================= DAILY REPORT (SUPER ADMIN) =================
exports.getDailyReport = (req, res) => {
  const { date } = req.query;

  const targetDate = date || new Date().toISOString().split("T")[0];

  const sql = `
    SELECT
      COUNT(*)                                             AS total_transactions,
      SUM(amount)                                          AS total_amount,
      SUM(commission)                                      AS total_commission,
      SUM(net_amount)                                      AS total_net_amount,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) AS failed_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
    FROM transactions
    WHERE DATE(created_at) = ?
  `;

  db.query(sql, [targetDate], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({
      success:     true,
      report_type: "daily",
      report_date: targetDate,
      data:        results[0]
    });
  });
};

// ================= WEEKLY REPORT (SUPER ADMIN) =================
exports.getWeeklyReport = (req, res) => {
  const sql = `
    SELECT
      YEARWEEK(created_at, 1)                              AS week,
      COUNT(*)                                             AS total_transactions,
      SUM(amount)                                          AS total_amount,
      SUM(commission)                                      AS total_commission,
      SUM(net_amount)                                      AS total_net_amount,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) AS failed_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
      MIN(DATE(created_at))                                AS week_start,
      MAX(DATE(created_at))                                AS week_end
    FROM transactions
    GROUP BY YEARWEEK(created_at, 1)
    ORDER BY week DESC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({
      success:     true,
      report_type: "weekly",
      count:       results.length,
      data:        results
    });
  });
};

// ================= MONTHLY REPORT (SUPER ADMIN) =================
// ✅ FIXED — added month_name to GROUP BY
exports.getMonthlyReport = (req, res) => {
  const { year } = req.query;

  const targetYear = year || new Date().getFullYear();

  const sql = `
    SELECT
      DATE_FORMAT(created_at, '%Y-%m')                     AS month,
      DATE_FORMAT(created_at, '%M %Y')                     AS month_name,
      COUNT(*)                                             AS total_transactions,
      SUM(amount)                                          AS total_amount,
      SUM(commission)                                      AS total_commission,
      SUM(net_amount)                                      AS total_net_amount,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN status = 'failed'  THEN 1 ELSE 0 END) AS failed_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
    FROM transactions
    WHERE YEAR(created_at) = ?
    GROUP BY
      DATE_FORMAT(created_at, '%Y-%m'),
      DATE_FORMAT(created_at, '%M %Y')
    ORDER BY month DESC
  `;

  db.query(sql, [targetYear], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({
      success:     true,
      report_type: "monthly",
      year:        targetYear,
      count:       results.length,
      data:        results
    });
  });
};

// ================= PLATFORM REPORT (SUPER ADMIN) =================
exports.getPlatformReport = (req, res) => {
  const { from_date, to_date } = req.query;

  let sql = `
    SELECT
      COUNT(*)                                               AS total_transactions,
      SUM(amount)                                            AS total_amount,
      SUM(commission)                                        AS total_commission,
      SUM(net_amount)                                        AS total_net_amount,
      SUM(CASE WHEN status = 'success'    THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN status = 'failed'     THEN 1 ELSE 0 END) AS failed_count,
      SUM(CASE WHEN status = 'pending'    THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN type   = 'settlement' THEN 1 ELSE 0 END) AS settlement_count,
      SUM(CASE WHEN type   = 'transfer'   THEN 1 ELSE 0 END) AS transfer_count
    FROM transactions
    WHERE 1=1
  `;

  const params = [];

  if (from_date) {
    sql += ` AND DATE(created_at) >= ?`;
    params.push(from_date);
  }

  if (to_date) {
    sql += ` AND DATE(created_at) <= ?`;
    params.push(to_date);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({
      success:     true,
      report_type: "platform",
      from_date:   from_date || "all time",
      to_date:     to_date   || "all time",
      data:        results[0]
    });
  });
};

// ================= GET COMMISSION SETTINGS (SUPER ADMIN) =================
exports.getCommissionSettings = (req, res) => {
  const sql = `SELECT * FROM commission_settings ORDER BY transaction_type`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({
      success: true,
      count:   results.length,
      data:    results
    });
  });
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
        message: "Commission setting updated ✅",
        data: {
          id,
          commission_type,
          commission_value
        }
      });
    }
  );
};

// ================= ACTIVATE COMMISSION (SUPER ADMIN) =================
exports.activateCommission = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE commission_settings SET is_active = 1 WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Commission setting not found" });
      }

      res.json({
        success:   true,
        message:   "Commission activated ✅",
        is_active: 1
      });
    }
  );
};

// ================= DEACTIVATE COMMISSION (SUPER ADMIN) =================
exports.deactivateCommission = (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE commission_settings SET is_active = 0 WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Commission setting not found" });
      }

      res.json({
        success:   true,
        message:   "Commission deactivated ✅",
        is_active: 0
      });
    }
  );
};