const express = require("express");
const router = express.Router();

// GET all transactions
router.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Get all transactions", data: [] });
});

// GET single transaction by ID
router.get("/:id", (req, res) => {
  res.status(200).json({ success: true, message: `Get transaction ${req.params.id}`, data: {} });
});

// POST create new transaction
router.post("/", (req, res) => {
  res.status(201).json({ success: true, message: "Transaction created", data: req.body });
});

// PUT update transaction
router.put("/:id", (req, res) => {
  res.status(200).json({ success: true, message: `Transaction ${req.params.id} updated`, data: req.body });
});

// DELETE transaction
router.delete("/:id", (req, res) => {
  res.status(200).json({ success: true, message: `Transaction ${req.params.id} deleted` });
});

module.exports = router;