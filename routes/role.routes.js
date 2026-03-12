const express = require("express");
const router = express.Router();
const { getUsersByRoleId } = require("../controllers/role.controller");

router.get("/users/:roleId", getUsersByRoleId);

module.exports = router;