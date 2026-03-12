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

  // Check if wallet already exists
  const checkSql = `SELECT * FROM wallets WHERE user_id = ?`;

  db.query(checkSql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (results.length > 0) {
      return res.status(400).json({ message: "Wallet already exists" });
    }

    // Create new wallet
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