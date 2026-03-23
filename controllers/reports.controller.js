
const db = require("../config/db");

exports.getSuperAdminReport = (req, res) => {

  const period = req.query.period || "monthly";

  // ── Date range based on period ───────────────────────────
  let dateFilter = "";
  if (period === "daily") {
    dateFilter = "AND DATE(t.created_at) = CURDATE()";
  } else if (period === "weekly") {
    dateFilter = "AND t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  } else {
    dateFilter = "AND t.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
  }

  // ── 1. Platform summary ──────────────────────────────────
  const summarySQL = `
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'user')                     AS total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'user'  AND is_active = 1)  AS active_users,
      (SELECT COUNT(*) FROM users WHERE role = 'admin')                    AS total_admins,
      (SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1)  AS active_admins,
      COALESCE(SUM(t.amount), 0)                                           AS total_revenue,
      COALESCE(SUM(t.commission_amount), 0)                                AS total_commission,
      COUNT(t.id)                                                          AS total_transactions,
      SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END)                AS failed_transactions
    FROM transactions t
    WHERE 1=1 ${dateFilter}
  `;

  // ── 2. Chart data ────────────────────────────────────────
  let chartSQL = "";
  if (period === "daily") {
    chartSQL = `
      SELECT
        DAYNAME(created_at)                  AS label,
        COALESCE(SUM(amount), 0)             AS revenue,
        COALESCE(SUM(commission_amount), 0)  AS commission,
        COUNT(*)                             AS transactions
      FROM transactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
      ORDER BY DAYOFWEEK(created_at)
    `;
  } else if (period === "weekly") {
    chartSQL = `
      SELECT
        CONCAT('Wk ', WEEK(created_at))      AS label,
        COALESCE(SUM(amount), 0)             AS revenue,
        COALESCE(SUM(commission_amount), 0)  AS commission,
        COUNT(*)                             AS transactions
      FROM transactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
      GROUP BY WEEK(created_at)
      ORDER BY WEEK(created_at)
    `;
  } else {
    chartSQL = `
      SELECT
        DATE_FORMAT(created_at, '%b')        AS label,
        COALESCE(SUM(amount), 0)             AS revenue,
        COALESCE(SUM(commission_amount), 0)  AS commission,
        COUNT(*)                             AS transactions
      FROM transactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%b')
      ORDER BY MONTH(created_at)
    `;
  }

  // ── 3. Recent transactions ───────────────────────────────
  const txnSQL = `
    SELECT
      t.id,
      CONCAT(u.first_name, ' ', u.last_name)  AS user_name,
      CONCAT(a.first_name, ' ', a.last_name)  AS admin_name,
      t.amount,
      t.commission_amount                      AS commission,
      t.transaction_type                       AS type,
      t.status,
      DATE_FORMAT(t.created_at, '%b %d, %h:%i %p') AS created_at,
      t.description
    FROM transactions t
    LEFT JOIN users u ON t.user_id  = u.id
    LEFT JOIN users a ON t.admin_id = a.id
    ORDER BY t.created_at DESC
    LIMIT 20
  `;

  // ── 4. Admin activity logs ───────────────────────────────
  const adminLogSQL = `
    SELECT
      al.id,
      CONCAT(u.first_name, ' ', u.last_name) AS actor_name,
      u.role                                  AS actor_role,
      al.action,
      al.target,
      DATE_FORMAT(al.created_at, '%b %d, %h:%i %p') AS created_at,
      al.is_warning
    FROM activity_logs al
    JOIN users u ON al.user_id = u.id
    WHERE u.role = 'admin'
    ORDER BY al.created_at DESC
    LIMIT 20
  `;

  // ── 5. User activity logs ────────────────────────────────
  const userLogSQL = `
    SELECT
      al.id,
      CONCAT(u.first_name, ' ', u.last_name) AS actor_name,
      u.role                                  AS actor_role,
      al.action,
      al.target,
      DATE_FORMAT(al.created_at, '%b %d, %h:%i %p') AS created_at,
      al.is_warning
    FROM activity_logs al
    JOIN users u ON al.user_id = u.id
    WHERE u.role = 'user'
    ORDER BY al.created_at DESC
    LIMIT 20
  `;

  // ── Run all queries in parallel ──────────────────────────
  db.query(summarySQL, (err, summaryRows) => {
    if (err) {
      console.error("Summary Query Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    db.query(chartSQL, (err, chartRows) => {
      if (err) {
        console.error("Chart Query Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      db.query(txnSQL, (err, txnRows) => {
        if (err) {
          console.error("Transaction Query Error:", err);
          return res.status(500).json({ success: false, message: "Server error" });
        }

        db.query(adminLogSQL, (err, adminLogRows) => {
          if (err) {
            console.error("Admin Log Query Error:", err);
            // activity_logs table may not exist yet — return empty array
            adminLogRows = [];
          }

          db.query(userLogSQL, (err, userLogRows) => {
            if (err) {
              console.error("User Log Query Error:", err);
              userLogRows = [];
            }

            const summary = summaryRows[0];

            return res.json({
              success: true,
              data: {
                summary: {
                  total_revenue:       parseFloat(summary.total_revenue)      || 0,
                  total_commission:    parseFloat(summary.total_commission)   || 0,
                  total_transactions:  parseInt(summary.total_transactions)   || 0,
                  failed_transactions: parseInt(summary.failed_transactions)  || 0,
                  total_users:         parseInt(summary.total_users)          || 0,
                  active_users:        parseInt(summary.active_users)         || 0,
                  total_admins:        parseInt(summary.total_admins)         || 0,
                  active_admins:       parseInt(summary.active_admins)        || 0,
                  revenue_growth:      12.4,   // wire to real calc when ready
                  transaction_growth:  8.1
                },
                chart_data:     chartRows,
                transactions:   txnRows,
                admin_activity: adminLogRows,
                user_activity:  userLogRows
              }
            });

          });
        });
      });
    });
  });

};