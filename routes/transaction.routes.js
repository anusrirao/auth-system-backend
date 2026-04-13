const express     = require("express");
const router      = express.Router();
const ctrl        = require("../controllers/transaction.controller");
const verifyToken = require("../middleware/verifyToken");
const checkRole   = require("../middleware/checkRole");

// All routes below are protected:
// verifyToken  → must be logged in
// checkRole    → must be superadmin

const guard = [verifyToken, checkRole("superadmin")];

// ─────────────────────────────────────────────────────
// GET /api/transactions/summary
// Dashboard stats — total, today, by type, by status
// ─────────────────────────────────────────────────────
router.get("/summary", guard, ctrl.getTransactionSummary);

// ─────────────────────────────────────────────────────
// GET /api/transactions
// All transactions with filters + pagination
// Query: ?page=1&limit=10&type=payment&status=success
// ─────────────────────────────────────────────────────
router.get("/", guard, ctrl.getAllTransactions);

// ─────────────────────────────────────────────────────
// GET /api/transactions/:id
// Single transaction detail
// ─────────────────────────────────────────────────────
router.get("/:id", guard, ctrl.getTransactionById);

module.exports = router;