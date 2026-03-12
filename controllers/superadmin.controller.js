const db   = require("../config/db");
const bcrypt = require("bcrypt");

// ================= OVERVIEW STATS =================
exports.getStats = (req, res) => {
  const statsSql = `
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'admin') AS total_admins,
      (SELECT COUNT(*) FROM users WHERE role = 'user')  AS total_users,
      (SELECT COUNT(*) FROM transactions)               AS total_transactions,
      (SELECT COALESCE(SUM(commission),0) FROM transactions
       WHERE status = 'success')                        AS total_commissions
  `;

  db.query(statsSql, [], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: "Stats fetched ✅",
      stats: results[0],
    });
  });
};

// ================= GET ALL ADMINS =================
exports.getAllAdmins = (req, res) => {
  const sql = `
    SELECT id, first_name, last_name, email, mobile, role, created_at
    FROM users WHERE role = 'admin'
    ORDER BY created_at DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: "Admins fetched ✅",
      admins: results,
    });
  });
};

// ================= CREATE ADMIN =================
exports.createAdmin = async (req, res) => {
  const { first_name, last_name, email, mobile, password } = req.body;

  if (!first_name || !last_name || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO users (first_name, last_name, email, mobile, password, role)
    VALUES (?, ?, ?, ?, ?, 'admin')
  `;

  db.query(
    sql,
    [first_name, last_name, email || null, mobile || null, hashedPassword],
    (err, result) => {
      if (err) return res.status(400).json({ message: "Admin already exists" });

      // Auto create wallet for admin
      const walletSql = `
        INSERT INTO wallets (user_id) VALUES (?)
      `;
      db.query(walletSql, [result.insertId], () => {});

      res.status(201).json({
        message: "Admin created successfully ✅",
        adminId: result.insertId,
      });
    }
  );
};

// ================= ACTIVATE / DEACTIVATE ADMIN =================
exports.updateAdminStatus = (req, res) => {
  const { admin_id, status } = req.body;

  if (!admin_id || !status) {
    return res.status(400).json({ message: "admin_id and status required" });
  }

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Status must be active or inactive" });
  }

  // Update wallet status
  const sql = `UPDATE wallets SET status = ? WHERE user_id = ?`;

  db.query(sql, [status, admin_id], (err) => {
    if (err) return res.status(500).json({ message: "Update failed" });

    res.json({
      message: `Admin ${status === "active" ? "activated" : "deactivated"} ✅`,
    });
  });
};

// ================= GET ALL USERS =================
exports.getAllUsers = (req, res) => {
  const sql = `
    SELECT id, first_name, last_name, email, mobile, role, created_at
    FROM users WHERE role = 'user'
    ORDER BY created_at DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: "Users fetched ✅",
      users: results,
    });
  });
};

// ================= ALL TRANSACTIONS =================
exports.getAllTransactions = (req, res) => {
  const sql = `
    SELECT
      t.id, t.amount, t.commission, t.net_amount,
      t.type, t.status, t.description, t.created_at,
      CONCAT(s.first_name,' ',s.last_name) AS sender_name,
      CONCAT(r.first_name,' ',r.last_name) AS receiver_name
    FROM transactions t
    JOIN users s ON t.sender_id   = s.id
    JOIN users r ON t.receiver_id = r.id
    ORDER BY t.created_at DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: "All transactions fetched ✅",
      transactions: results,
    });
  });
};

// ================= WALLET LOAD REQUESTS =================
exports.getWalletLoadRequests = (req, res) => {
  const sql = `
    SELECT
      w.id, w.amount, w.status, w.remarks, w.created_at,
      CONCAT(u.first_name,' ',u.last_name) AS user_name,
      u.mobile, u.email
    FROM wallet_load_requests w
    JOIN users u ON w.user_id = u.id
    ORDER BY w.created_at DESC
  `;

  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: "Wallet load requests fetched ✅",
      requests: results,
    });
  });
};

// ================= APPROVE WALLET LOAD =================
exports.approveWalletLoad = (req, res) => {
  const superAdminId = req.user.id;
  const { request_id, remarks } = req.body;

  if (!request_id) {
    return res.status(400).json({ message: "request_id is required" });
  }

  // Get request details
  const getSql = `SELECT * FROM wallet_load_requests WHERE id = ? AND status = 'pending'`;

  db.query(getSql, [request_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(404).json({ message: "Request not found or already processed" });
    }

    const request = results[0];

    // Add money to wallet
    const updateWalletSql = `
      UPDATE wallets
      SET current_balance = current_balance + ?,
          opening_balance = opening_balance + ?
      WHERE user_id = ?
    `;

    db.query(
      updateWalletSql,
      [request.amount, request.amount, request.user_id],
      (err) => {
        if (err) return res.status(500).json({ message: "Wallet update failed" });

        // Update request status
        const updateReqSql = `
          UPDATE wallet_load_requests
          SET status = 'approved', approved_by = ?, remarks = ?
          WHERE id = ?
        `;

        db.query(
          updateReqSql,
          [superAdminId, remarks || "Approved", request_id],
          (err) => {
            if (err) return res.status(500).json({ message: "Status update failed" });

            res.json({
              message: `Wallet load of ₹${request.amount} approved ✅`,
            });
          }
        );
      }
    );
  });
};

// ================= REJECT WALLET LOAD =================
exports.rejectWalletLoad = (req, res) => {
  const superAdminId = req.user.id;
  const { request_id, remarks } = req.body;

  const sql = `
    UPDATE wallet_load_requests
    SET status = 'rejected', approved_by = ?, remarks = ?
    WHERE id = ? AND status = 'pending'
  `;

  db.query(sql, [superAdminId, remarks || "Rejected", request_id], (err, result) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Request not found or already processed" });
    }

    res.json({ message: "Wallet load request rejected ✅" });
  });
};

// ================= SET COMMISSION =================
exports.setCommission = (req, res) => {
  const superAdminId = req.user.id;
  const { commission_percent } = req.body;

  if (commission_percent === undefined || commission_percent < 0) {
    return res.status(400).json({ message: "Valid commission percent required" });
  }

  const sql = `
    INSERT INTO commission_settings (commission_percent, set_by)
    VALUES (?, ?)
  `;

  db.query(sql, [commission_percent, superAdminId], (err) => {
    if (err) return res.status(500).json({ message: "Commission update failed" });

    res.json({
      message: `Commission set to ${commission_percent}% ✅`,
    });
  });
};

// ================= SEND NOTIFICATION =================
exports.sendNotification = (req, res) => {
  const { user_id, title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message required" });
  }

  const sql = `
    INSERT INTO notifications (user_id, title, message)
    VALUES (?, ?, ?)
  `;

  // user_id = null means send to ALL users
  db.query(sql, [user_id || null, title, message], (err) => {
    if (err) return res.status(500).json({ message: "Notification failed" });

    res.json({
      message: user_id
        ? "Notification sent to user ✅"
        : "Notification sent to all users ✅",
    });
  });
};

// ================= REPORTS =================
exports.getReports = (req, res) => {
  const { type } = req.query; // daily, weekly, monthly

  let groupBy = "DATE(created_at)";
  if (type === "weekly")  groupBy = "WEEK(created_at)";
  if (type === "monthly") groupBy = "MONTH(created_at)";

  const sql = `
    SELECT
      ${groupBy}          AS period,
      COUNT(*)            AS total_transactions,
      SUM(amount)         AS total_amount,
      SUM(commission)     AS total_commission,
      SUM(net_amount)     AS total_net_amount
    FROM transactions
    WHERE status = 'success'
    GROUP BY ${groupBy}
    ORDER BY period DESC
    LIMIT 30
  `;

  db.query(sql, [], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: `${type || "daily"} report fetched ✅`,
      reports: results,
    });
  });
};