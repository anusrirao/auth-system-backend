// controllers/admin.controller.js

const db     = require("../config/db");
const bcrypt = require("bcrypt");

// ================= OVERVIEW STATS (SUPER ADMIN) =================
exports.getOverviewStats = (req, res) => {

  // FIX: Run all 4 queries in parallel instead of deeply nested callbacks
  const totalUsersSql = `
    SELECT COUNT(*) AS total_users FROM users WHERE role = 'user'
  `;
  const totalAdminsSql = `
    SELECT COUNT(*) AS total_admins FROM users WHERE role = 'admin'
  `;
  const totalTransactionsSql = `
    SELECT 
      COUNT(*)                     AS total_transactions,
      COALESCE(SUM(amount),     0) AS total_amount,
      COALESCE(SUM(commission), 0) AS total_commission
    FROM transactions
  `;
  const activeAdminsSql = `
    SELECT 
      SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END) AS active_admins,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_admins
    FROM users
    WHERE role = 'admin'
  `;

  // Run all queries in parallel using Promise wrappers
  const query = (sql, params = []) =>
    new Promise((resolve, reject) =>
      db.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)))
    );

  Promise.all([
    query(totalUsersSql),
    query(totalAdminsSql),
    query(totalTransactionsSql),
    query(activeAdminsSql),
  ])
    .then(([userRes, adminRes, txnRes, activeRes]) => {
      res.status(200).json({
        success: true,
        message: "Overview Stats",
        data: {
          total_users:        userRes[0].total_users        || 0,
          total_admins:       adminRes[0].total_admins      || 0,
          active_admins:      activeRes[0].active_admins    || 0,
          inactive_admins:    activeRes[0].inactive_admins  || 0,
          total_transactions: txnRes[0].total_transactions  || 0,
          total_amount:       txnRes[0].total_amount        || 0,
          total_commission:   txnRes[0].total_commission    || 0,
        }
      });
    })
    .catch((err) => {
      console.error("Overview Stats Error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    });
};

// ================= GET ALL ADMINS (SUPER ADMIN) =================
exports.getAllAdmins = (req, res) => {
  const sql = `
    SELECT id, first_name, last_name, email, mobile, status, role, created_at
    FROM users
    WHERE role = 'admin'
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get All Admins Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(200).json({ success: true, count: results.length, data: results });
  });
};

// ================= GET SINGLE ADMIN (SUPER ADMIN) =================
exports.getAdminById = (req, res) => {
  const { id } = req.params;

  // FIX: Validate id is numeric
  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid admin ID" });
  }

  const sql = `
    SELECT id, first_name, last_name, email, mobile, status, role, created_at
    FROM users
    WHERE id = ? AND role = 'admin'
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Get Admin By ID Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    res.status(200).json({ success: true, data: results[0] });
  });
};

// ================= GET ALL USERS (SUPER ADMIN) =================
exports.getAllUsers = (req, res) => {
  const sql = `
    SELECT id, first_name, last_name, email, mobile, status, role, created_at
    FROM users
    WHERE role = 'user'
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get All Users Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(200).json({ success: true, count: results.length, data: results });
  });
};

// ================= CREATE ADMIN (SUPER ADMIN) =================
exports.createAdmin = async (req, res) => {
  const { first_name, last_name, email, mobile, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "first_name, last_name, email and password are required"
    });
  }

  let checkSql, checkParams;
  if (mobile) {
    checkSql    = "SELECT id FROM users WHERE email = ? OR mobile = ?";
    checkParams = [email, mobile];
  } else {
    checkSql    = "SELECT id FROM users WHERE email = ?";
    checkParams = [email];
  }

  db.query(checkSql, checkParams, async (err, existing) => {
    if (err) {
      console.error("Create Admin Check Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Email or mobile already exists" });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error("Bcrypt Error:", hashErr);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    // FIX: Fetch role_id for 'admin' from roles table
    db.query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1", (err, roleResults) => {
      if (err) {
        console.error("Role Fetch Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      const role_id = roleResults.length > 0 ? roleResults[0].id : null;

      db.query(
        `INSERT INTO users (first_name, last_name, email, mobile, password, role, role_id, status)
         VALUES (?, ?, ?, ?, ?, 'admin', ?, 'active')`,
        [first_name, last_name, email, mobile || null, hashedPassword, role_id],
        (err, result) => {
          if (err) {
            console.error("Create Admin Insert Error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
          }

          res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: {
              id:         result.insertId,
              first_name,
              last_name,
              email,
              mobile:     mobile || null,
              role:       "admin",
              status:     "active"
            }
          });
        }
      );
    });
  });
};

// ================= ACTIVATE ADMIN (SUPER ADMIN) =================
exports.activateAdmin = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid admin ID" });
  }

  db.query(
    "UPDATE users SET status = 'active' WHERE id = ? AND role = 'admin'",
    [id],
    (err, result) => {
      if (err) {
        console.error("Activate Admin Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }
      res.status(200).json({ success: true, message: "Admin activated successfully", status: "active" });
    }
  );
};

// ================= DEACTIVATE ADMIN (SUPER ADMIN) =================
exports.deactivateAdmin = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid admin ID" });
  }

  db.query(
    "UPDATE users SET status = 'inactive' WHERE id = ? AND role = 'admin'",
    [id],
    (err, result) => {
      if (err) {
        console.error("Deactivate Admin Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }
      res.status(200).json({ success: true, message: "Admin deactivated successfully", status: "inactive" });
    }
  );
};

// ================= ALL TRANSACTIONS (SUPER ADMIN) =================
exports.getAllTransactions = (req, res) => {
  const { status, type, from_date, to_date } = req.query;

  let sql = `
    SELECT
      t.id, t.amount, t.commission, t.net_amount, t.type, t.status, t.description, t.created_at,
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
    if (err) {
      console.error("Get All Transactions Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const totalAmount     = results.reduce((sum, t) => sum + parseFloat(t.amount     || 0), 0);
    const totalCommission = results.reduce((sum, t) => sum + parseFloat(t.commission || 0), 0);

    res.status(200).json({
      success: true,
      count:   results.length,
      summary: { total_amount: totalAmount, total_commission: totalCommission },
      data:    results
    });
  });
};

// ================= GET COMMISSION SETTINGS (SUPER ADMIN) =================
exports.getCommissionSettings = (req, res) => {
  db.query(`SELECT * FROM commission_settings ORDER BY transaction_type`, (err, results) => {
    if (err) {
      console.error("Get Commission Settings Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(200).json({ success: true, count: results.length, data: results });
  });
};

// ================= ADD NEW COMMISSION SETTING (SUPER ADMIN) =================
exports.addCommissionSetting = (req, res) => {
  const { transaction_type, commission_type, commission_value } = req.body;

  if (!transaction_type || !commission_type || commission_value === undefined) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  if (!["percentage", "flat"].includes(commission_type)) {
    return res.status(400).json({ success: false, message: "commission_type must be 'percentage' or 'flat'" });
  }

  const parsed = parseFloat(commission_value);
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ success: false, message: "commission_value must be a valid positive number" });
  }
  if (commission_type === "percentage" && parsed > 100) {
    return res.status(400).json({ success: false, message: "Percentage cannot exceed 100" });
  }

  db.query(
    "SELECT id FROM commission_settings WHERE transaction_type = ?",
    [transaction_type],
    (err, existing) => {
      if (err) {
        console.error("Commission Check Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: `Commission for '${transaction_type}' already exists` });
      }

      db.query(
        `INSERT INTO commission_settings (transaction_type, commission_type, commission_value, status)
         VALUES (?, ?, ?, 'active')`,
        [transaction_type, commission_type, parsed],
        (err, result) => {
          if (err) {
            console.error("Add Commission Error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
          }
          res.status(201).json({
            success: true,
            message: "Commission setting added",
            data: { id: result.insertId, transaction_type, commission_type, commission_value: parsed, status: "active" }
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

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid commission ID" });
  }
  if (!commission_type || commission_value === undefined) {
    return res.status(400).json({ success: false, message: "commission_type and commission_value are required" });
  }
  if (!["percentage", "flat"].includes(commission_type)) {
    return res.status(400).json({ success: false, message: "commission_type must be 'percentage' or 'flat'" });
  }

  const parsed = parseFloat(commission_value);
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ success: false, message: "commission_value must be a valid positive number" });
  }
  if (commission_type === "percentage" && parsed > 100) {
    return res.status(400).json({ success: false, message: "Percentage cannot exceed 100" });
  }

  db.query(
    `UPDATE commission_settings SET commission_type = ?, commission_value = ?, updated_at = NOW() WHERE id = ?`,
    [commission_type, parsed, id],
    (err, result) => {
      if (err) {
        console.error("Update Commission Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Commission setting not found" });
      }
      res.status(200).json({
        success: true,
        message: "Commission updated",
        data: { id, commission_type, commission_value: parsed }
      });
    }
  );
};

// ================= ACTIVATE COMMISSION (SUPER ADMIN) =================
exports.activateCommission = (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid commission ID" });
  }
  db.query(
    "UPDATE commission_settings SET status = 'active', updated_at = NOW() WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Activate Commission Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Commission setting not found" });
      }
      res.status(200).json({ success: true, message: "Commission activated", status: "active" });
    }
  );
};

// ================= DEACTIVATE COMMISSION (SUPER ADMIN) =================
exports.deactivateCommission = (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: "Invalid commission ID" });
  }
  db.query(
    "UPDATE commission_settings SET status = 'inactive', updated_at = NOW() WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("Deactivate Commission Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Commission setting not found" });
      }
      res.status(200).json({ success: true, message: "Commission deactivated", status: "inactive" });
    }
  );
};

// ================= GET GLOBAL COMMISSION (SUPER ADMIN) =================
exports.getGlobalCommission = (req, res) => {
  db.query(
    `SELECT * FROM commission_settings WHERE status = 'active' LIMIT 1`,
    (err, results) => {
      if (err) {
        console.error("Get Global Commission Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "No active commission setting found" });
      }
      res.status(200).json({
        success: true,
        data: {
          commission_type:  results[0].commission_type,
          commission_value: results[0].commission_value
        }
      });
    }
  );
};

// ================= UPDATE GLOBAL COMMISSION (SUPER ADMIN) =================
exports.updateGlobalCommission = (req, res) => {
  const { commission_type, commission_value } = req.body;

  if (commission_value === undefined || commission_value === null || commission_value === "") {
    return res.status(400).json({ success: false, message: "commission_value is required" });
  }

  const parsed = parseFloat(commission_value);
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ success: false, message: "commission_value must be a valid positive number" });
  }
  if (commission_type && !["percentage", "flat"].includes(commission_type)) {
    return res.status(400).json({ success: false, message: "commission_type must be 'percentage' or 'flat'" });
  }
  if (commission_type === "percentage" && parsed > 100) {
    return res.status(400).json({ success: false, message: "Percentage cannot exceed 100" });
  }

  db.query(
    `UPDATE commission_settings 
     SET commission_type  = COALESCE(?, commission_type),
         commission_value = ?,
         updated_at       = NOW()`,
    [commission_type || null, parsed],
    (err, result) => {
      if (err) {
        console.error("Update Global Commission Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      res.status(200).json({
        success: true,
        message: `Global commission updated (${result.affectedRows} types updated)`,
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
  const { type, from_date, to_date } = req.query;

  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // FIX: cap limit at 100
  const offset = (page - 1) * limit;

  const conditions = [];
  const params     = [];
  if (type)      { conditions.push("ch.transaction_type = ?");  params.push(type); }
  if (from_date) { conditions.push("DATE(ch.created_at) >= ?"); params.push(from_date); }
  if (to_date)   { conditions.push("DATE(ch.created_at) <= ?"); params.push(to_date); }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const summarySQL = `
    SELECT
      COUNT(*)                             AS total_records,
      COALESCE(SUM(commission_earned),  0) AS total_commission_earned,
      COALESCE(SUM(transaction_amount), 0) AS total_transaction_amount
    FROM commission_history ch ${where}
  `;

  const listSQL = `
    SELECT
      ch.id, ch.transaction_id, ch.transaction_type, ch.commission_type,
      ch.commission_value, ch.transaction_amount, ch.commission_earned, ch.created_at,
      CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) AS sender_name,
      CONCAT(r.first_name, ' ', COALESCE(r.last_name, '')) AS receiver_name
    FROM commission_history ch
    LEFT JOIN users s ON ch.sender_id   = s.id
    LEFT JOIN users r ON ch.receiver_id = r.id
    ${where}
    ORDER BY ch.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const query = (sql, p = []) =>
    new Promise((resolve, reject) =>
      db.query(sql, p, (err, results) => (err ? reject(err) : resolve(results)))
    );

  Promise.all([query(summarySQL, params), query(listSQL, [...params, limit, offset])])
    .then(([summaryResult, listResult]) => {
      const totalRecords = summaryResult[0].total_records;
      res.status(200).json({
        success: true,
        summary: {
          total_records:            totalRecords,
          total_commission_earned:  summaryResult[0].total_commission_earned,
          total_transaction_amount: summaryResult[0].total_transaction_amount,
        },
        pagination: {
          page,
          limit,
          total_pages: Math.ceil(totalRecords / limit),
        },
        data: listResult
      });
    })
    .catch((err) => {
      console.error("Commission History Error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    });
};

// ================= GET COMMISSION SUMMARY BY TYPE (SUPER ADMIN) =================
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
    if (err) {
      console.error("Commission Summary Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(200).json({ success: true, data: results });
  });
};