const db = require('../config/db');

// ================= ADD BENEFICIARY (ADMIN) =================
exports.addBeneficiary = (req, res) => {
  const adminId = req.user.id;
  const { account_holder_name, account_number, ifsc_code, bank_name } = req.body;

  if (!account_holder_name || !account_number || !ifsc_code) {
    return res.status(400).json({ message: 'Name, account number and IFSC are required' });
  }

  db.query(
    'SELECT id FROM beneficiaries WHERE admin_id = ? AND account_number = ?',
    [adminId, account_number],
    (err, existing) => {
      if (err) return res.status(500).json({ message: err.message });

      if (existing.length > 0) {
        return res.status(409).json({ message: 'This account is already added' });
      }

      db.query(
        `INSERT INTO beneficiaries 
          (admin_id, account_holder_name, account_number, ifsc_code, bank_name)
         VALUES (?, ?, ?, ?, ?)`,
        [adminId, account_holder_name, account_number, ifsc_code, bank_name || null],
        (err, result) => {
          if (err) return res.status(500).json({ message: err.message });

          res.status(201).json({
            success:        true,
            message:        'Beneficiary added successfully ✅',
            beneficiary_id: result.insertId
          });
        }
      );
    }
  );
};

// ================= LIST BENEFICIARIES (ADMIN) =================
exports.listBeneficiaries = (req, res) => {
  const adminId = req.user.id;

  db.query(
    `SELECT id, account_holder_name, account_number,
            ifsc_code, bank_name, is_verified, created_at
     FROM beneficiaries
     WHERE admin_id = ?
     ORDER BY created_at DESC`,
    [adminId],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ success: true, count: results.length, data: results });
    }
  );
};

// ================= VERIFY BENEFICIARY (ADMIN) =================
exports.verifyBeneficiary = (req, res) => {
  const adminId = req.user.id;
  const { id }  = req.params;

  db.query(
    'SELECT id, is_verified FROM beneficiaries WHERE id = ? AND admin_id = ?',
    [id, adminId],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.message });

      if (results.length === 0) {
        return res.status(404).json({ message: 'Beneficiary not found' });
      }
      if (results[0].is_verified === 1) {
        return res.status(400).json({ message: 'Beneficiary is already verified' });
      }

      db.query(
        'UPDATE beneficiaries SET is_verified = 1 WHERE id = ?',
        [id],
        (err) => {
          if (err) return res.status(500).json({ message: err.message });

          res.json({ success: true, message: 'Beneficiary verified successfully ✅' });
        }
      );
    }
  );
};

// ================= INITIATE SETTLEMENT (ADMIN) =================
exports.initiateSettlement = (req, res) => {
  const adminId = req.user.id;
  const { beneficiary_id, amount, remarks } = req.body;

  if (!beneficiary_id || !amount || amount <= 0) {
    return res.status(400).json({ message: 'beneficiary_id and valid amount are required' });
  }

  // Step 1 — Check beneficiary exists, belongs to admin, and is verified
  db.query(
    'SELECT * FROM beneficiaries WHERE id = ? AND admin_id = ?',
    [beneficiary_id, adminId],
    (err, beneResults) => {
      if (err) return res.status(500).json({ message: err.message });

      if (beneResults.length === 0) {
        return res.status(404).json({ message: 'Beneficiary not found' });
      }
      if (beneResults[0].is_verified === 0) {
        return res.status(400).json({ message: 'Please verify this beneficiary before settling' });
      }

      const bene = beneResults[0];

      // Step 2 — Get admin wallet balance
      db.query(
        'SELECT current_balance FROM wallets WHERE user_id = ?',
        [adminId],
        (err, walletResults) => {
          if (err) return res.status(500).json({ message: err.message });

          if (walletResults.length === 0) {
            return res.status(400).json({ message: 'Wallet not found for this admin' });
          }

          const currentBalance = parseFloat(walletResults[0].current_balance);

          // Step 3 — Get commission setting
          db.query(
            `SELECT commission_type, commission_value 
             FROM commission_settings 
             WHERE transaction_type = 'settlement' AND is_active = 1 
             LIMIT 1`,
            [],
            (err, commResults) => {
              if (err) return res.status(500).json({ message: err.message });

              // Calculate commission
              let commission = 0;
              if (commResults.length > 0) {
                const { commission_type, commission_value } = commResults[0];
                commission = commission_type === 'percentage'
                  ? parseFloat(((amount * commission_value) / 100).toFixed(2))
                  : parseFloat(commission_value);
              }

              const totalDeduct = parseFloat(amount) + commission;

              // Step 4 — Check balance is enough
              if (currentBalance < totalDeduct) {
                return res.status(400).json({
                  success: false,
                  message: `Insufficient balance. Required: ₹${totalDeduct} (Amount: ₹${amount} + Commission: ₹${commission}), Available: ₹${currentBalance}`
                });
              }

              // Step 5 — Deduct from wallet
              db.query(
                'UPDATE wallets SET current_balance = current_balance - ? WHERE user_id = ?',
                [totalDeduct, adminId],
                (err) => {
                  if (err) return res.status(500).json({ message: err.message });

                  // Step 6 — Insert settlement record as pending
                  db.query(
                    `INSERT INTO settlements
                      (admin_id, beneficiary_id, amount, commission, total_deducted, status, remarks)
                     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
                    [adminId, beneficiary_id, amount, commission, totalDeduct, remarks || null],
                    (err, insertResult) => {
                      if (err) return res.status(500).json({ message: err.message });

                      const settlementId  = insertResult.insertId;
                      const simulatedUTR  = 'UTR' + Date.now();

                      // Step 7 — Mark as success (replace with real gateway later)
                      db.query(
                        `UPDATE settlements 
                         SET status = 'success', utr_number = ? 
                         WHERE id = ?`,
                        [simulatedUTR, settlementId],
                        (err) => {
                          if (err) return res.status(500).json({ message: err.message });

                          res.status(200).json({
                            success:        true,
                            message:        'Settlement successful ✅',
                            settlement_id:  settlementId,
                            amount:         parseFloat(amount),
                            commission,
                            total_deducted: totalDeduct,
                            utr_number:     simulatedUTR,
                            beneficiary: {
                              name:           bene.account_holder_name,
                              account_number: bene.account_number,
                              ifsc:           bene.ifsc_code,
                              bank:           bene.bank_name
                            }
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};

// ================= SETTLEMENT HISTORY (ADMIN) =================
exports.getSettlementHistory = (req, res) => {
  const adminId            = req.user.id;
  const { status, from_date, to_date } = req.query;

  let sql = `
    SELECT
      s.id, s.amount, s.commission, s.total_deducted,
      s.status, s.utr_number, s.remarks, s.created_at,
      b.account_holder_name, b.account_number,
      b.ifsc_code, b.bank_name
    FROM settlements s
    JOIN beneficiaries b ON b.id = s.beneficiary_id
    WHERE s.admin_id = ?
  `;

  const params = [adminId];
  if (status)    { sql += ` AND s.status = ?`;            params.push(status); }
  if (from_date) { sql += ` AND DATE(s.created_at) >= ?`; params.push(from_date); }
  if (to_date)   { sql += ` AND DATE(s.created_at) <= ?`; params.push(to_date); }

  sql += ` ORDER BY s.created_at DESC`;

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    const totalAmount     = results.reduce((sum, s) => sum + parseFloat(s.amount     || 0), 0);
    const totalCommission = results.reduce((sum, s) => sum + parseFloat(s.commission || 0), 0);

    res.json({
      success: true,
      count:   results.length,
      summary: { total_amount: totalAmount, total_commission: totalCommission },
      data:    results
    });
  });
};