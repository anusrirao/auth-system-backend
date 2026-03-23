const express               = require("express");
const router                = express.Router();
const { verifyToken }       = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");

router.post("/pay",    verifyToken, transactionController.makePayment);
router.get("/history", verifyToken, transactionController.getMyTransactions);

module.exports = router;