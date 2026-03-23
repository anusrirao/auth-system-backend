const db = require("../config/db");

// ================= GET WALLET BALANCE =================
exports.getBalance = (req, res) => {
  const userId = req.user.id;

  const sql = `SELECT * FROM wallets WHERE user_id = ?`;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({
      message: "Wallet balance fetched ✅",
      wallet: {
        opening_balance: results[0].opening_balance,
        current_balance: results[0].current_balance,
        hold_balance:    results[0].hold_balance,
        status:          results[0].status,
      },
    });
  });
};

// ================= CREATE WALLET =================
exports.createWallet = (req, res) => {
  const userId = req.user.id;

  const checkSql = `SELECT * FROM wallets WHERE user_id = ?`;

  db.query(checkSql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length > 0) {
      return res.status(400).json({ message: "Wallet already exists" });
    }

    const createSql = `
      INSERT INTO wallets (user_id, opening_balance, current_balance, hold_balance)
      VALUES (?, 0.00, 0.00, 0.00)
    `;

    db.query(createSql, [userId], (err, result) => {
      if (err) return res.status(500).json({ message: "Wallet creation failed" });

      res.status(201).json({
        message: "Wallet created successfully ✅",
        walletId: result.insertId,
      });
    });
  });
};

// ================= REQUEST WALLET LOAD =================
exports.requestWalletLoad = (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Enter a valid amount" });
  }

  const sql = `
    INSERT INTO wallet_load_requests (user_id, amount, status)
    VALUES (?, ?, 'pending')
  `;

  db.query(sql, [userId, amount], (err, result) => {
    if (err) return res.status(500).json({ message: "Request failed" });

    res.status(201).json({
      message: "Wallet load request submitted ✅ Waiting for approval",
      requestId: result.insertId,
    });
  });
};

// ================= GET MY LOAD REQUESTS =================
exports.getMyLoadRequests = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT * FROM wallet_load_requests
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: "Load requests fetched ✅",
      requests: results,
    });
  });
};

// ================= GET ALL LOAD REQUESTS (SUPER ADMIN) =================
exports.getAllLoadRequests = (req, res) => {
  const { status } = req.query;

  // Build query based on status filter
  let sql = `
    SELECT
      w.id, w.amount, w.status, w.remarks, w.created_at,
      CONCAT(u.first_name, ' ', u.last_name) AS user_name,
      u.mobile, u.email
    FROM wallet_load_requests w
    JOIN users u ON w.user_id = u.id
  `;

  const params = [];

  // If status query param exists → filter by it
  if (status) {
    sql += ` WHERE w.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY w.created_at DESC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: "Wallet load requests fetched ✅",
      total: results.length,
      requests: results,
    });
  });
};

// ================= APPROVE LOAD REQUEST (SUPER ADMIN) =================
exports.approveLoadRequest = (req, res) => {
  const superAdminId = req.user.id;
  const { id }       = req.params;

  // Step 1: Get the pending request
  const getSql = `SELECT * FROM wallet_load_requests WHERE id = ? AND status = 'pending'`;

  db.query(getSql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(404).json({ message: "Request not found or already processed" });
    }

    const request = results[0];

    // Step 2: Add money to user's wallet
    const updateWalletSql = `
      UPDATE wallets
      SET current_balance = current_balance + ?,
          opening_balance = opening_balance + ?
      WHERE user_id = ?
    `;

    db.query(updateWalletSql, [request.amount, request.amount, request.user_id], (err) => {
      if (err) return res.status(500).json({ message: "Wallet update failed" });

      // Step 3: Mark request as approved
      const updateRequestSql = `
        UPDATE wallet_load_requests
        SET status = 'approved', approved_by = ?, updated_at = NOW()
        WHERE id = ?
      `;

      db.query(updateRequestSql, [superAdminId, id], (err) => {
        if (err) return res.status(500).json({ message: "Status update failed" });

        res.json({
          message: `Wallet load of ₹${request.amount} approved ✅`,
        });
      });
    });
  });
};

// ================= REJECT LOAD REQUEST (SUPER ADMIN) =================
exports.rejectLoadRequest = (req, res) => {
  const superAdminId = req.user.id;
  const { id }       = req.params;
  const { reason }   = req.body;

  if (!reason) {
    return res.status(400).json({ message: "Reason is required for rejection" });
  }

  // Step 1: Check request exists and is pending
  const getSql = `SELECT * FROM wallet_load_requests WHERE id = ? AND status = 'pending'`;

  db.query(getSql, [id], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length === 0) {
      return res.status(404).json({ message: "Request not found or already processed" });
    }

    // Step 2: Mark as rejected with reason
    const rejectSql = `
      UPDATE wallet_load_requests
      SET status = 'rejected', approved_by = ?, remarks = ?, updated_at = NOW()
      WHERE id = ?
    `;

    db.query(rejectSql, [superAdminId, reason, id], (err) => {
      if (err) return res.status(500).json({ message: "Rejection failed" });

      res.json({
        message: "Wallet load request rejected ✅",
        reason: reason,
      });
    });
  });
};
