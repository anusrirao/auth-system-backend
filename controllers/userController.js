// controllers/userController.js
// FIX: Renamed to user.controller.js is recommended for consistency

const db = require("../config/db");

// ================= GET USERS BY ROLE ID =================
const getUsersByRoleId = (req, res) => {
  const { roleId } = req.params;

  if (!roleId || isNaN(roleId)) {
    return res.status(400).json({ success: false, message: "Role ID must be a valid number" });
  }

  // Check if role exists
  db.query("SELECT * FROM roles WHERE id = ?", [roleId], (err, role) => {
    if (err) {
      console.error("Role Check Error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (role.length === 0) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    // FIX: users table has BOTH role (string) and role_id (FK)
    // Join on role_id which is the proper FK
    db.query(
      `SELECT 
         users.id,
         users.first_name,
         users.last_name,
         users.email,
         users.mobile,
         users.status,
         users.created_at,
         roles.name        AS role_name,
         roles.description AS role_description
       FROM users
       INNER JOIN roles ON users.role_id = roles.id
       WHERE roles.id = ?
       ORDER BY users.created_at DESC`,
      [roleId],
      (err, users) => {
        if (err) {
          console.error("Fetch Users Error:", err);
          return res.status(500).json({ success: false, message: "Server error" });
        }

        return res.status(200).json({
          success: true,
          role:    role[0].name,
          count:   users.length,
          data:    users
        });
      }
    );
  });
};

module.exports = { getUsersByRoleId };