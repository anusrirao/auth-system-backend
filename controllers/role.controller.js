const db = require("../config/db");

const getUsersByRoleId = (req, res) => {
  const { roleId } = req.params;

  if (isNaN(roleId)) {
    return res.status(400).json({ success: false, message: "Role ID must be a number" });
  }

  // Check role exists
  db.query("SELECT * FROM roles WHERE id = ?", [roleId], (err, role) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    if (role.length === 0) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    // Fetch users by role_id
    db.query(
      `SELECT 
          users.id, 
          users.first_name, 
          users.last_name, 
          users.email, 
          users.mobile, 
          users.role, 
          users.role_id,
          users.created_at,
          roles.name AS role_name, 
          roles.description
       FROM users
       INNER JOIN roles ON users.role_id = roles.id
       WHERE users.role_id = ?`,
      [roleId],
      (err, users) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

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