const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth.middleware");
const profileController = require("../controllers/profile.controller");

router.get("/", verifyToken, profileController.getProfile);
router.put("/update", verifyToken, profileController.updateProfile);
router.put("/password", verifyToken, profileController.changePassword);

module.exports = router;