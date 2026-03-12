const express              = require("express");
const router               = express.Router();
const { verifyToken }      = require("../middleware/auth.middleware");
const { checkRole }        = require("../middleware/role.middleware");
const superAdminController = require("../controllers/superadmin.controller");

router.get("/stats",                   verifyToken, checkRole("super_admin"), superAdminController.getStats);
router.get("/admins",                  verifyToken, checkRole("super_admin"), superAdminController.getAllAdmins);
router.post("/admins/create",          verifyToken, checkRole("super_admin"), superAdminController.createAdmin);
router.put("/admins/status",           verifyToken, checkRole("super_admin"), superAdminController.updateAdminStatus);
router.get("/users",                   verifyToken, checkRole("super_admin"), superAdminController.getAllUsers);
router.get("/transactions",            verifyToken, checkRole("super_admin"), superAdminController.getAllTransactions);
router.get("/wallet-requests",         verifyToken, checkRole("super_admin"), superAdminController.getWalletLoadRequests);
router.put("/wallet-requests/approve", verifyToken, checkRole("super_admin"), superAdminController.approveWalletLoad);
router.put("/wallet-requests/reject",  verifyToken, checkRole("super_admin"), superAdminController.rejectWalletLoad);
router.put("/commission",              verifyToken, checkRole("super_admin"), superAdminController.setCommission);
router.post("/notifications",          verifyToken, checkRole("super_admin"), superAdminController.sendNotification);
router.get("/reports",                 verifyToken, checkRole("super_admin"), superAdminController.getReports);

module.exports = router;