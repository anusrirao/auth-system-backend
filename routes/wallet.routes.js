const express          = require("express");
const router           = express.Router();
const { verifyToken }  = require("../middleware/auth.middleware");
const checkRole        = require("../middleware/checkRole");
const walletController = require("../controllers/wallet.controller");

// ===== USER ROUTES =====
router.post("/create",       verifyToken, walletController.createWallet);
router.get("/balance",       verifyToken, walletController.getBalance);
router.post("/load-request", verifyToken, walletController.requestWalletLoad);
router.get("/load-requests", verifyToken, walletController.getMyLoadRequests);

// ===== SUPER ADMIN ROUTES =====
router.get("/admin/load-requests",         verifyToken, checkRole("super_admin"), walletController.getAllLoadRequests);
router.put("/admin/load-requests/:id/approve", verifyToken, checkRole("super_admin"), walletController.approveLoadRequest);
router.put("/admin/load-requests/:id/reject",  verifyToken, checkRole("super_admin"), walletController.rejectLoadRequest);

module.exports = router;