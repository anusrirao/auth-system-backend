const express     = require("express");
const router      = express.Router();
const ctrl        = require("../controllers/wallet.controller");
const verifyToken = require("../middleware/verifyToken");
const checkRole   = require("../middleware/checkRole");

// ─────────────────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────────────────

// GET all 3 wallets at once (dashboard)
// GET /api/wallet/all
router.get("/all",       verifyToken, ctrl.getAllWallets);

// GET main wallet balance
// GET /api/wallet/main
router.get("/main",      verifyToken, ctrl.getMainWallet);

// GET add money wallet balance
// GET /api/wallet/add-money
router.get("/add-money", verifyToken, ctrl.getAddMoneyWallet);

// GET aeps wallet balance  ← NEW
// GET /api/wallet/aeps
router.get("/aeps",      verifyToken, ctrl.getAepsWallet);

// POST wallet load (works for all wallet types)
// Body: { amount, wallet_type: 'main'|'add_money'|'aeps' }
router.post("/load",     verifyToken, ctrl.walletLoad);

// POST hold balance
router.post("/hold",     verifyToken, ctrl.holdBalance);

// GET wallet statement
router.get("/statement", verifyToken, ctrl.getStatement);

// ─────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────

// GET any user's all wallets
// GET /api/wallet/admin/:user_id
router.get("/admin/:user_id", verifyToken, checkRole("admin", "superadmin"), ctrl.getWalletByUserId);

module.exports = router;