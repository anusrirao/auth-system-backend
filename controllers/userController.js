const db = require("../config/db"); // path to your db.js

// Fetch users by role ID
const getUsersByRoleId = (req, res) => {
  const { roleId } = req.params;

  // Validate roleId
  if (isNaN(roleId)) {
    return res.status(400).json({ success: false, message: "Role ID must be a number" });
  }

  // Check if role exists
  db.query("SELECT * FROM roles WHERE id = ?", [roleId], (err, role) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (role.length === 0) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    // Fetch users with that role
    db.query(
      `SELECT users.id, users.name, users.email,
              roles.name AS role_name, roles.description
       FROM users
       INNER JOIN roles ON users.role_id = roles.id
       WHERE roles.id = ?`,
      [roleId],
      (err, users) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        res.json({
          success: true,
          role: role[0].name,
          count: users.length,
          data: users
        });
      }
    );
  });
};

module.exports = { getUsersByRoleId };