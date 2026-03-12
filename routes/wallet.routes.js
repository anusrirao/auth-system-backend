
const express          = require("express");
const router           = express.Router();
const { verifyToken }  = require("../middleware/auth.middleware");
const walletController = require("../controllers/wallet.controller");

router.post("/create",       verifyToken, walletController.createWallet);
router.get("/balance",       verifyToken, walletController.getBalance);
router.post("/load-request", verifyToken, walletController.requestWalletLoad);
router.get("/load-requests", verifyToken, walletController.getMyLoadRequests);

module.exports = router;