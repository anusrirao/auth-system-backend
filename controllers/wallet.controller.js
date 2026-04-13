const db = require("../config/db");

// ─────────────────────────────────────────────────────
// HELPER — Get or create wallet by type
// wallet_type: 'main' | 'add_money' | 'aeps'
// ─────────────────────────────────────────────────────
const getOrCreateWallet = async (db_conn, user_id, wallet_type) => {
  const [rows] = await db_conn.query(
    "SELECT * FROM main_wallet WHERE user_id = ? AND wallet_type = ?",
    [user_id, wallet_type]
  );

  if (rows.length) return rows[0];

  // Auto create wallet if not exists
  await db_conn.query(
    `INSERT INTO main_wallet (user_id, wallet_type, opening_balance, current_balance, hold_balance)
     VALUES (?, ?, 0.00, 0.00, 0.00)`,
    [user_id, wallet_type]
  );

  const [newRows] = await db_conn.query(
    "SELECT * FROM main_wallet WHERE user_id = ? AND wallet_type = ?",
    [user_id, wallet_type]
  );
  return newRows[0];
};

// ─────────────────────────────────────────────────────
// GET MAIN WALLET BALANCE
// GET /api/wallet/main
// ─────────────────────────────────────────────────────
exports.getMainWallet = async (req, res) => {
  try {
    const user_id = req.user.id;
    const wallet  = await getOrCreateWallet(db, user_id, "main");
    res.json({
      success: true,
      data: {
        wallet_type:     "main",
        opening_balance: parseFloat(wallet.opening_balance).toFixed(2),
        current_balance: parseFloat(wallet.current_balance).toFixed(2),
        hold_balance:    parseFloat(wallet.hold_balance).toFixed(2)
      }
    });
  } catch (err) {
    console.error("getMainWallet error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch wallet balance." });
  }
};

// ─────────────────────────────────────────────────────
// GET ADD MONEY WALLET BALANCE
// GET /api/wallet/add-money
// ─────────────────────────────────────────────────────
exports.getAddMoneyWallet = async (req, res) => {
  try {
    const user_id = req.user.id;
    const wallet  = await getOrCreateWallet(db, user_id, "add_money");
    res.json({
      success: true,
      data: {
        wallet_type:     "add_money",
        opening_balance: parseFloat(wallet.opening_balance).toFixed(2),
        current_balance: parseFloat(wallet.current_balance).toFixed(2),
        hold_balance:    parseFloat(wallet.hold_balance).toFixed(2)
      }
    });
  } catch (err) {
    console.error("getAddMoneyWallet error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch Add Money wallet." });
  }
};

// ─────────────────────────────────────────────────────
// GET AEPS WALLET BALANCE  ← NEW
// GET /api/wallet/aeps
// ─────────────────────────────────────────────────────
exports.getAepsWallet = async (req, res) => {
  try {
    const user_id = req.user.id;
    const wallet  = await getOrCreateWallet(db, user_id, "aeps");
    res.json({
      success: true,
      data: {
        wallet_type:     "aeps",
        opening_balance: parseFloat(wallet.opening_balance).toFixed(2),
        current_balance: parseFloat(wallet.current_balance).toFixed(2),
        hold_balance:    parseFloat(wallet.hold_balance).toFixed(2)
      }
    });
  } catch (err) {
    console.error("getAepsWallet error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch AePS wallet." });
  }
};

// ─────────────────────────────────────────────────────
// GET ALL 3 WALLETS AT ONCE (Dashboard view)
// GET /api/wallet/all
// ─────────────────────────────────────────────────────
exports.getAllWallets = async (req, res) => {
  try {
    const user_id = req.user.id;

    const [rows] = await db.query(
      "SELECT * FROM main_wallet WHERE user_id = ? ORDER BY wallet_type ASC",
      [user_id]
    );

    // Default all 3 wallets to 0
    const wallets = {
      main:      { opening_balance: "0.00", current_balance: "0.00", hold_balance: "0.00" },
      add_money: { opening_balance: "0.00", current_balance: "0.00", hold_balance: "0.00" },
      aeps:      { opening_balance: "0.00", current_balance: "0.00", hold_balance: "0.00" }
    };

    // Fill actual values from DB
    rows.forEach(w => {
      if (wallets[w.wallet_type] !== undefined) {
        wallets[w.wallet_type] = {
          opening_balance: parseFloat(w.opening_balance).toFixed(2),
          current_balance: parseFloat(w.current_balance).toFixed(2),
          hold_balance:    parseFloat(w.hold_balance).toFixed(2)
        };
      }
    });

    res.json({
      success: true,
      data: {
        main_wallet:      wallets.main,
        add_money_wallet: wallets.add_money,
        aeps_wallet:      wallets.aeps
      }
    });
  } catch (err) {
    console.error("getAllWallets error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch wallets." });
  }
};

// ─────────────────────────────────────────────────────
// WALLET LOAD (Add money to any wallet)
// POST /api/wallet/load
// Body: { amount, wallet_type: 'main'|'add_money'|'aeps' }
// ─────────────────────────────────────────────────────
exports.walletLoad = async (req, res) => {
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const user_id                      = req.user.id;
    const { amount, wallet_type = "main" } = req.body;

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0)
      return res.status(400).json({ success: false, message: "Enter a valid amount." });

    const allowed = ["main", "add_money", "aeps"];
    if (!allowed.includes(wallet_type))
      return res.status(400).json({ success: false, message: "Invalid wallet type." });

    const wallet         = await getOrCreateWallet(conn, user_id, wallet_type);
    const balance_before = parseFloat(wallet.current_balance);
    const balance_after  = balance_before + parsed;

    await conn.query(
      "UPDATE main_wallet SET current_balance = ?, updated_at = NOW() WHERE user_id = ? AND wallet_type = ?",
      [balance_after, user_id, wallet_type]
    );
    await conn.query(
      `INSERT INTO wallet_transactions
       (user_id, transaction_type, amount, balance_before, balance_after, description, status)
       VALUES (?, 'load', ?, ?, ?, ?, 'success')`,
      [user_id, parsed, balance_before, balance_after, `${wallet_type} Wallet Load`]
    );

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: `${wallet_type} wallet loaded successfully ✅`,
      data: {
        wallet_type,
        amount_loaded:   parsed.toFixed(2),
        current_balance: balance_after.toFixed(2)
      }
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("walletLoad error:", err);
    res.status(500).json({ success: false, message: "Wallet load failed." });
  }
};

// ─────────────────────────────────────────────────────
// HOLD BALANCE
// POST /api/wallet/hold
// Body: { amount, wallet_type }
// ─────────────────────────────────────────────────────
exports.holdBalance = async (req, res) => {
  const conn = await db.getConnection();
  await conn.beginTransaction();
  try {
    const user_id                      = req.user.id;
    const { amount, wallet_type = "main" } = req.body;

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0)
      return res.status(400).json({ success: false, message: "Enter a valid amount." });

    const wallet  = await getOrCreateWallet(conn, user_id, wallet_type);
    const current = parseFloat(wallet.current_balance);
    const hold    = parseFloat(wallet.hold_balance);

    if (current < parsed)
      return res.status(400).json({ success: false, message: "Insufficient balance to hold." });

    await conn.query(
      `UPDATE main_wallet SET current_balance = ?, hold_balance = ?, updated_at = NOW()
       WHERE user_id = ? AND wallet_type = ?`,
      [current - parsed, hold + parsed, user_id, wallet_type]
    );
    await conn.query(
      `INSERT INTO wallet_transactions
       (user_id, transaction_type, amount, balance_before, balance_after, description, status)
       VALUES (?, 'hold', ?, ?, ?, 'Balance Hold', 'pending')`,
      [user_id, parsed, current, current - parsed]
    );

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: "Amount held successfully ✅",
      data: {
        wallet_type,
        hold_amount:     parsed.toFixed(2),
        current_balance: (current - parsed).toFixed(2),
        hold_balance:    (hold + parsed).toFixed(2)
      }
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("holdBalance error:", err);
    res.status(500).json({ success: false, message: "Hold failed." });
  }
};

// ─────────────────────────────────────────────────────
// VIEW WALLET STATEMENT
// GET /api/wallet/statement
// ─────────────────────────────────────────────────────
exports.getStatement = async (req, res) => {
  try {
    const user_id = req.user.id;
    const page    = parseInt(req.query.page)  || 1;
    const limit   = parseInt(req.query.limit) || 10;
    const offset  = (page - 1) * limit;

    const [transactions] = await db.query(
      `SELECT * FROM wallet_transactions WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [user_id, limit, offset]
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?",
      [user_id]
    );

    res.json({
      success: true,
      pagination: { page, limit, total_records: total, total_pages: Math.ceil(total / limit) },
      data: transactions
    });
  } catch (err) {
    console.error("getStatement error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch statement." });
  }
};

// ─────────────────────────────────────────────────────
// ADMIN — GET ANY USER'S ALL WALLETS
// GET /api/wallet/admin/:user_id
// ─────────────────────────────────────────────────────
exports.getWalletByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [rows] = await db.query(
      `SELECT w.*, u.first_name, u.last_name, u.email
       FROM main_wallet w JOIN users u ON w.user_id = u.id
       WHERE w.user_id = ? ORDER BY w.wallet_type ASC`,
      [user_id]
    );

    if (!rows.length)
      return res.status(404).json({ success: false, message: "Wallet not found." });

    const user    = rows[0];
    const wallets = {};
    rows.forEach(w => {
      wallets[w.wallet_type] = {
        opening_balance: parseFloat(w.opening_balance).toFixed(2),
        current_balance: parseFloat(w.current_balance).toFixed(2),
        hold_balance:    parseFloat(w.hold_balance).toFixed(2),
        updated_at:      w.updated_at
      };
    });

    res.json({
      success: true,
      data: {
        user_name: `${user.first_name} ${user.last_name}`,
        email:     user.email,
        wallets
      }
    });
  } catch (err) {
    console.error("getWalletByUserId error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch wallet." });
  }
};