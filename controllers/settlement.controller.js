// controllers/settlement.controller.js

const db = require("../config/db");

// ================= ADD BENEFICIARY =================
exports.addBeneficiary = (req, res) => {
  const { user_id, account_name, account_number, bank_name, ifsc_code } = req.body;

  if (!user_id || !account_name || !account_number || !bank_name || !ifsc_code) {
    return res.status(400).json({ message: "All beneficiary fields are required" });
  }

  const sql = `
    INSERT INTO beneficiaries (user_id, account_name, account_number, bank_name, ifsc_code, is_verified)
    VALUES (?, ?, ?, ?, ?, 0)
  `;

  db.query(sql, [user_id, account_name, account_number, bank_name, ifsc_code], (err, result) => {
    if (err) {
      console.error("DB Add Beneficiary Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.status(201).json({
      success: true,
      message: "Beneficiary added successfully ✅",
      beneficiaryId: result.insertId
    });
  });
};

// ================= LIST BENEFICIARIES =================
exports.listBeneficiaries = (req, res) => {
  const sql = `
    SELECT b.id, b.account_name, b.account_number, b.bank_name, b.ifsc_code, b.is_verified,
           u.first_name, u.last_name, u.email
    FROM beneficiaries b
    INNER JOIN users u ON b.user_id = u.id
    ORDER BY b.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB List Beneficiaries Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.json({
      success: true,
      message: "Beneficiaries fetched successfully ✅",
      count: results.length,
      data: results
    });
  });
};

// ================= VERIFY BENEFICIARY =================
exports.verifyBeneficiary = (req, res) => {
  const { id } = req.params;

  const checkSql = `SELECT * FROM beneficiaries WHERE id = ?`;

  db.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error("DB Check Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Beneficiary not found" });
    }

    const updateSql = `UPDATE beneficiaries SET is_verified = 1 WHERE id = ?`;

    db.query(updateSql, [id], (err, result) => {
      if (err) {
        console.error("DB Verify Error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      res.json({
        success: true,
        message: "Beneficiary verified successfully ✅"
      });
    });
  });
};

// ================= INITIATE SETTLEMENT =================
exports.initiateSettlement = (req, res) => {
  const { beneficiary_id, amount, remarks } = req.body;
  const initiated_by = req.user.id;

  if (!beneficiary_id || !amount) {
    return res.status(400).json({ message: "Beneficiary ID and amount are required" });
  }

  // Check beneficiary exists and is verified
  const checkSql = `SELECT * FROM beneficiaries WHERE id = ? AND is_verified = 1`;

  db.query(checkSql, [beneficiary_id], (err, results) => {
    if (err) {
      console.error("DB Check Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Beneficiary not found or not verified" });
    }

    const sql = `
      INSERT INTO settlements (beneficiary_id, amount, remarks, status, initiated_by, created_at)
      VALUES (?, ?, ?, 'pending', ?, NOW())
    `;

    db.query(sql, [beneficiary_id, amount, remarks || null, initiated_by], (err, result) => {
      if (err) {
        console.error("DB Settlement Insert Error:", err);
        return res.status(500).json({ message: "Server error" });
      }

      res.status(201).json({
        success: true,
        message: "Settlement initiated successfully ✅",
        settlementId: result.insertId
      });
    });
  });
};

// ================= GET SETTLEMENT HISTORY =================
exports.getSettlementHistory = (req, res) => {
  const sql = `
    SELECT s.id, s.amount, s.remarks, s.status, s.created_at,
           b.account_name, b.bank_name, b.account_number,
           u.first_name, u.last_name
    FROM settlements s
    INNER JOIN beneficiaries b ON s.beneficiary_id = b.id
    INNER JOIN users u ON s.initiated_by = u.id
    ORDER BY s.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB Settlement History Error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.json({
      success: true,
      message: "Settlement history fetched successfully ✅",
      count: results.length,
      data: results
    });
  });
};