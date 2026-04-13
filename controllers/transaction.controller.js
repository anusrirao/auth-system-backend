const db = require("../config/db");

// ─────────────────────────────────────────────────────
// GET ALL TRANSACTIONS (superadmin view — full app)
// GET /api/transactions
// Query params: ?page=1&limit=10&type=payment&status=success
// Auth: verifyToken + checkRole(superadmin)
// ─────────────────────────────────────────────────────
exports.getAllTransactions = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 10;
    const offset = (page - 1) * limit;

    // Optional filters
    const { type, status } = req.query;

    // Build WHERE clause dynamically
    let where  = "WHERE 1=1";
    let params = [];

    if (type) {
      where += " AND t.type = ?";
      params.push(type);
    }

    if (status) {
      where += " AND t.status = ?";
      params.push(status);
    }

    // Fetch transactions with sender and receiver names
    const [transactions] = await db.query(
      `SELECT
         t.id,
         t.amount,
         t.commission,
         t.net_amount,
         t.type,
         t.status,
         t.description,
         t.created_at,
         sender.id         AS sender_id,
         sender.first_name AS sender_first_name,
         sender.last_name  AS sender_last_name,
         sender.email      AS sender_email,
         receiver.id          AS receiver_id,
         receiver.first_name  AS receiver_first_name,
         receiver.last_name   AS receiver_last_name,
         receiver.email       AS receiver_email
       FROM transactions t
       LEFT JOIN users sender   ON t.sender_id   = sender.id
       LEFT JOIN users receiver ON t.receiver_id = receiver.id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Total count for pagination
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM transactions t ${where}`,
      params
    );

    // Summary totals
    const [[summary]] = await db.query(
      `SELECT
         COUNT(*)        AS total_transactions,
         SUM(amount)     AS total_amount,
         SUM(commission) AS total_commission,
         SUM(net_amount) AS total_net_amount
       FROM transactions t ${where}`,
      params
    );

    res.json({
      success: true,
      summary: {
        total_transactions:  summary.total_transactions   || 0,
        total_amount:        parseFloat(summary.total_amount     || 0).toFixed(2),
        total_commission:    parseFloat(summary.total_commission  || 0).toFixed(2),
        total_net_amount:    parseFloat(summary.total_net_amount  || 0).toFixed(2)
      },
      pagination: {
        page,
        limit,
        total_records: total,
        total_pages:   Math.ceil(total / limit)
      },
      data: transactions.map(t => ({
        id:          t.id,
        type:        t.type,
        status:      t.status,
        amount:      parseFloat(t.amount).toFixed(2),
        commission:  parseFloat(t.commission || 0).toFixed(2),
        net_amount:  parseFloat(t.net_amount).toFixed(2),
        description: t.description,
        created_at:  t.created_at,
        sender: {
          id:    t.sender_id,
          name:  `${t.sender_first_name} ${t.sender_last_name}`,
          email: t.sender_email
        },
        receiver: {
          id:    t.receiver_id,
          name:  `${t.receiver_first_name} ${t.receiver_last_name}`,
          email: t.receiver_email
        }
      }))
    });

  } catch (err) {
    console.error("getAllTransactions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch transactions." });
  }
};

// ─────────────────────────────────────────────────────
// GET SINGLE TRANSACTION BY ID
// GET /api/transactions/:id
// Auth: verifyToken + checkRole(superadmin)
// ─────────────────────────────────────────────────────
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
         t.*,
         sender.first_name   AS sender_first_name,
         sender.last_name    AS sender_last_name,
         sender.email        AS sender_email,
         sender.mobile       AS sender_mobile,
         receiver.first_name AS receiver_first_name,
         receiver.last_name  AS receiver_last_name,
         receiver.email      AS receiver_email,
         receiver.mobile     AS receiver_mobile
       FROM transactions t
       LEFT JOIN users sender   ON t.sender_id   = sender.id
       LEFT JOIN users receiver ON t.receiver_id = receiver.id
       WHERE t.id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    const t = rows[0];

    res.json({
      success: true,
      data: {
        id:          t.id,
        type:        t.type,
        status:      t.status,
        amount:      parseFloat(t.amount).toFixed(2),
        commission:  parseFloat(t.commission || 0).toFixed(2),
        net_amount:  parseFloat(t.net_amount).toFixed(2),
        description: t.description,
        created_at:  t.created_at,
        sender: {
          id:     t.sender_id,
          name:   `${t.sender_first_name} ${t.sender_last_name}`,
          email:  t.sender_email,
          mobile: t.sender_mobile
        },
        receiver: {
          id:     t.receiver_id,
          name:   `${t.receiver_first_name} ${t.receiver_last_name}`,
          email:  t.receiver_email,
          mobile: t.receiver_mobile
        }
      }
    });

  } catch (err) {
    console.error("getTransactionById error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch transaction." });
  }
};

// ─────────────────────────────────────────────────────
// GET TRANSACTION SUMMARY (dashboard stats)
// GET /api/transactions/summary
// Auth: verifyToken + checkRole(superadmin)
// ─────────────────────────────────────────────────────
exports.getTransactionSummary = async (req, res) => {
  try {

    // Total by type
    const [byType] = await db.query(
      `SELECT
         type,
         COUNT(*)        AS total_count,
         SUM(amount)     AS total_amount,
         SUM(commission) AS total_commission
       FROM transactions
       GROUP BY type`
    );

    // Total by status
    const [byStatus] = await db.query(
      `SELECT
         status,
         COUNT(*) AS total_count,
         SUM(amount) AS total_amount
       FROM transactions
       GROUP BY status`
    );

    // Overall totals
    const [[overall]] = await db.query(
      `SELECT
         COUNT(*)        AS total_transactions,
         SUM(amount)     AS total_amount,
         SUM(commission) AS total_commission,
         SUM(net_amount) AS total_net_amount
       FROM transactions`
    );

    // Today's totals
    const [[today]] = await db.query(
      `SELECT
         COUNT(*)        AS today_transactions,
         SUM(amount)     AS today_amount,
         SUM(commission) AS today_commission
       FROM transactions
       WHERE DATE(created_at) = CURDATE()`
    );

    res.json({
      success: true,
      data: {
        overall: {
          total_transactions: overall.total_transactions || 0,
          total_amount:       parseFloat(overall.total_amount      || 0).toFixed(2),
          total_commission:   parseFloat(overall.total_commission   || 0).toFixed(2),
          total_net_amount:   parseFloat(overall.total_net_amount   || 0).toFixed(2)
        },
        today: {
          total_transactions: today.today_transactions || 0,
          total_amount:       parseFloat(today.today_amount      || 0).toFixed(2),
          total_commission:   parseFloat(today.today_commission   || 0).toFixed(2)
        },
        by_type:   byType.map(r => ({
          type:             r.type,
          total_count:      r.total_count,
          total_amount:     parseFloat(r.total_amount    || 0).toFixed(2),
          total_commission: parseFloat(r.total_commission || 0).toFixed(2)
        })),
        by_status: byStatus.map(r => ({
          status:       r.status,
          total_count:  r.total_count,
          total_amount: parseFloat(r.total_amount || 0).toFixed(2)
        }))
      }
    });

  } catch (err) {
    console.error("getTransactionSummary error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch summary." });
  }
};