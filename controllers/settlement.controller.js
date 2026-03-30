// controllers/settlement.controller.js

const db = require("../config/db");

// ================= ADD BENEFICIARY =================
exports.addBeneficiary = (req, res) => {
  const { user_id, account_name, account_number, bank_name, ifsc_code } = req.body;

  if (!user_id || !account_name || !account_number || !bank_name || !ifsc_code) {
    return res.status(400).json({ success: false, message: "All beneficiary fields are required" });
  }

  // FIX: Validate IFSC code format (Indian standard: 4 letters + 0 + 6 alphanumeric)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifsc_code.toUpperCase())) {
    return res.status(400).json({ success: false, message: "Invalid IFSC code format" });
  }

  // FIX: Check if user exists before adding beneficiary
  db.query("SELECT id FROM users WHERE id = ?", [user_id], (err, userResults) => {
    if (err) {
      console.error("User Check Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (userResults.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // FIX: Prevent duplicate account number for same user
    db.query(
      "SELECT id FROM beneficiaries WHERE user_id = ? AND account_number = ?",
      [user_id, account_number],
      (err, dupResults) => {
        if (err) {
          console.error("Duplicate Check Error:", err);
          return res.status(500).json({ success: false, message: "Server error" });
        }
        if (dupResults.length > 0) {
          return res.status(409).json({ success: false, message: "This account number already exists for this user" });
        }

        db.query(
          `INSERT INTO beneficiaries (user_id, account_name, account_number, bank_name, ifsc_code, is_verified)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [user_id, account_name, account_number, bank_name, ifsc_code.toUpperCase()],
          (err, result) => {
            if (err) {
              console.error("Add Beneficiary Error:", err);
              return res.status(500).json({ success: false, message: "Server error" });
            }
            res.status(201).json({
              success:       true,
              message:       "Beneficiary added successfully",
              beneficiaryId: result.insertId
            });
          }
        );
      }
    );
  });
};

// ================= LIST BENEFICIARIES =================
exports.listBeneficiaries = (req, res) => {
  const sql = `
    SELECT 
      b.id, b.account_name, b.account_number, b.bank_name, b.ifsc_code, b.is_verified,
      u.first_name, u.last_name, u.email
    FROM beneficiaries b
    INNER JOIN users u ON b.user_id = u.id
    ORDER BY b.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("List Beneficiaries Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(200).json({
      success: true,
      message: "Beneficiaries fetched successfully",
      count:   results.length,
      data:    results
    });
  });
};

// ================= VERIFY BENEFICIARY =================
exports.verifyBeneficiary = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid beneficiary ID" });
  }

  db.query("SELECT * FROM beneficiaries WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Beneficiary Check Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Beneficiary not found" });
    }

    // FIX: Don't re-verify already verified beneficiary
    if (results[0].is_verified === 1) {
      return res.status(400).json({ success: false, message: "Beneficiary is already verified" });
    }

    db.query("UPDATE beneficiaries SET is_verified = 1 WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Verify Beneficiary Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      res.status(200).json({ success: true, message: "Beneficiary verified successfully" });
    });
  });
};

// ================= INITIATE SETTLEMENT =================
exports.initiateSettlement = (req, res) => {
  const { beneficiary_id, amount, remarks } = req.body;
  const initiated_by = req.user.id;

  if (!beneficiary_id || !amount) {
    return res.status(400).json({ success: false, message: "Beneficiary ID and amount are required" });
  }

  // FIX: Validate amount is a positive number
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: "Amount must be a valid positive number" });
  }

  db.query(
    "SELECT * FROM beneficiaries WHERE id = ? AND is_verified = 1",
    [beneficiary_id],
    (err, results) => {
      if (err) {
        console.error("Beneficiary Verify Check Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (results.length === 0) {
        return res.status(400).json({ success: false, message: "Beneficiary not found or not verified" });
      }

      db.query(
        `INSERT INTO settlements (beneficiary_id, amount, remarks, status, initiated_by, created_at)
         VALUES (?, ?, ?, 'pending', ?, NOW())`,
        [beneficiary_id, parsedAmount, remarks || null, initiated_by],
        (err, result) => {
          if (err) {
            console.error("Initiate Settlement Error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
          }
          res.status(201).json({
            success:      true,
            message:      "Settlement initiated successfully",
            settlementId: result.insertId
          });
        }
      );
    }
  );
};

// ================= GET SETTLEMENT HISTORY =================
exports.getSettlementHistory = (req, res) => {

  // FIX: Add optional filters for status and date range
  const { status, from_date, to_date } = req.query;

  let sql = `
    SELECT 
      s.id, s.amount, s.remarks, s.status, s.created_at,
      b.account_name, b.bank_name, b.account_number,
      u.first_name, u.last_name
    FROM settlements s
    INNER JOIN beneficiaries b ON s.beneficiary_id = b.id
    INNER JOIN users u         ON s.initiated_by   = u.id
    WHERE 1=1
  `;

  const params = [];
  if (status)    { sql += ` AND s.status = ?`;            params.push(status); }
  if (from_date) { sql += ` AND DATE(s.created_at) >= ?`; params.push(from_date); }
  if (to_date)   { sql += ` AND DATE(s.created_at) <= ?`; params.push(to_date); }
  sql += ` ORDER BY s.created_at DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Settlement History Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(200).json({
      success: true,
      message: "Settlement history fetched successfully",
      count:   results.length,
      data:    results
    });
  });
};