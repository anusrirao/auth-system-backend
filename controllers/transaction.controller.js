const db = require("../config/db");

// ================= MAKE PAYMENT =================
exports.makePayment = (req, res) => {
  const senderId   = req.user.id;
  const { receiver_mobile, amount, description } = req.body;

  // Validation
  if (!receiver_mobile || !amount || amount <= 0) {
    return res.status(400).json({
      message: "Receiver mobile and valid amount required",
    });
  }

  // Step 1: Find receiver
  const findReceiver = `SELECT id FROM users WHERE mobile = ?`;

  db.query(findReceiver, [receiver_mobile], (err, receiverResults) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (receiverResults.length === 0) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const receiverId = receiverResults[0].id;

    if (senderId === receiverId) {
      return res.status(400).json({
        message: "Cannot send money to yourself",
      });
    }

    // Step 2: Get commission settings
    const commissionSql = `
      SELECT commission_percent FROM commission_settings
      ORDER BY created_at DESC LIMIT 1
    `;

    db.query(commissionSql, [], (err, commResults) => {
      if (err) return res.status(500).json({ message: "Server error" });

      const commissionPercent = commResults.length > 0
        ? commResults[0].commission_percent
        : 0;

      const commission = (amount * commissionPercent) / 100;
      const netAmount  = amount - commission;

      // Step 3: Check sender balance
      const balanceSql = `SELECT current_balance FROM wallets WHERE user_id = ?`;

      db.query(balanceSql, [senderId], (err, balResults) => {
        if (err) return res.status(500).json({ message: "Server error" });

        if (balResults.length === 0) {
          return res.status(404).json({ message: "Sender wallet not found" });
        }

        if (balResults[0].current_balance < amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }

        // Step 4: Deduct from sender
        const deductSql = `
          UPDATE wallets
          SET current_balance = current_balance - ?
          WHERE user_id = ?
        `;

        db.query(deductSql, [amount, senderId], (err) => {
          if (err) return res.status(500).json({ message: "Deduction failed" });

          // Step 5: Add to receiver
          const addSql = `
            UPDATE wallets
            SET current_balance = current_balance + ?
            WHERE user_id = ?
          `;

          db.query(addSql, [netAmount, receiverId], (err) => {
            if (err) return res.status(500).json({ message: "Credit failed" });

            // Step 6: Save transaction record
            const txnSql = `
              INSERT INTO transactions
              (sender_id, receiver_id, amount, commission, net_amount, type, status, description)
              VALUES (?, ?, ?, ?, ?, 'payment', 'success', ?)
            `;

            db.query(
              txnSql,
              [senderId, receiverId, amount, commission, netAmount, description || "Payment"],
              (err, result) => {
                if (err) return res.status(500).json({ message: "Transaction save failed" });

                res.status(201).json({
                  message: "Payment successful ✅",
                  transaction: {
                    id:         result.insertId,
                    amount,
                    commission,
                    net_amount: netAmount,
                    status:     "success",
                  },
                });
              }
            );
          });
        });
      });
    });
  });
};

// ================= MY TRANSACTION HISTORY =================
exports.getMyTransactions = (req, res) => {
  const userId = req.user.id;

  const sql = `
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
      CONCAT(r.first_name, ' ', r.last_name) AS receiver_name
    FROM transactions t
    JOIN users s ON t.sender_id   = s.id
    JOIN users r ON t.receiver_id = r.id
    WHERE t.sender_id = ? OR t.receiver_id = ?
    ORDER BY t.created_at DESC
  `;

  db.query(sql, [userId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });

    res.json({
      message: "Transaction history fetched ✅",
      transactions: results,
    });
  });
};