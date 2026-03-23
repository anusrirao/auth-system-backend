const express = require("express");
const router = express.Router();
const db = require("../config/db"); // adjust if needed

// GET all commissions
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM commission_settings ORDER BY id ASC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("GET /commissions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch commissions." });
  }
});

// POST create commission
router.post("/", async (req, res) => {
  const { transaction_type, commission_type, commission_value } = req.body;

  if (!transaction_type || !commission_type || commission_value === undefined || commission_value === "") {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const parsed = parseFloat(commission_value);
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ success: false, message: "Value must be a valid positive number." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO commission_settings (transaction_type, commission_type, commission_value, is_active) VALUES (?, ?, ?, 1)",
      [transaction_type, commission_type, parsed]
    );
    const [rows] = await db.query("SELECT * FROM commission_settings WHERE id = ?", [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("POST /commissions error:", err);
    res.status(500).json({ success: false, message: "Failed to create commission." });
  }
});

// PUT update commission value  ← THIS FIXES THE EDIT NOT SAVING
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { commission_value, commission_type } = req.body;

  if (commission_value === undefined || commission_value === "") {
    return res.status(400).json({ success: false, message: "Value is required." });
  }

  const parsed = parseFloat(commission_value);
  if (isNaN(parsed) || parsed < 0) {
    return res.status(400).json({ success: false, message: "Value must be a valid positive number." });
  }

  try {
    const [check] = await db.query("SELECT * FROM commission_settings WHERE id = ?", [id]);
    if (!check.length) return res.status(404).json({ success: false, message: "Commission not found." });

    await db.query(
      "UPDATE commission_settings SET commission_value = ?, commission_type = ?, updated_at = NOW() WHERE id = ?",
      [parsed, commission_type || check[0].commission_type, id]
    );

    const [rows] = await db.query("SELECT * FROM commission_settings WHERE id = ?", [id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("PUT /commissions/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to update commission." });
  }
});

// PATCH toggle is_active
router.patch("/:id/toggle", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM commission_settings WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Commission not found." });

    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query(
      "UPDATE commission_settings SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, id]
    );

    res.json({ success: true, data: { ...rows[0], is_active: newStatus } });
  } catch (err) {
    console.error("PATCH /commissions/:id/toggle error:", err);
    res.status(500).json({ success: false, message: "Failed to update status." });
  }
});

// DELETE commission
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM commission_settings WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Commission not found." });

    await db.query("DELETE FROM commission_settings WHERE id = ?", [id]);
    res.json({ success: true, message: "Deleted successfully." });
  } catch (err) {
    console.error("DELETE /commissions/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to delete commission." });
  }
});

module.exports = router;