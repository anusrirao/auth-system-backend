// ============================================================
// controllers/auth.controller.js
// ============================================================
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ================= REGISTER =================
exports.register = async (req, res) => {

  const { first_name, last_name, email, mobile, password } = req.body;

  if (!first_name || !last_name || !password) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name and password are required'
    });
  }

  if (!email && !mobile) {
    return res.status(400).json({
      success: false,
      message: 'Either email or mobile is required'
    });
  }

  const checkSql = `SELECT * FROM users WHERE email = ? OR mobile = ?`;

  db.query(checkSql, [email || null, mobile || null], async (err, results) => {

    if (err) {
      console.error('DB Check Error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO users (first_name, last_name, email, mobile, password, role, status)
      VALUES (?, ?, ?, ?, ?, 'user', 'active')
    `;

    db.query(
      insertSql,
      [first_name, last_name, email || null, mobile || null, hashedPassword],
      (err, result) => {

        if (err) {
          console.error('DB Insert Error:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(201).json({
          success: true,
          message: 'User registered successfully ✅',
          data: {
            id:        result.insertId,
            first_name,
            last_name,
            email:     email  || null,
            mobile:    mobile || null,
            role:      'user',
            status:    'active'
          }
        });

      }
    );

  });

};

// ================= LOGIN =================
exports.login = async (req, res) => {

  const { emailOrMobile, password } = req.body;

  if (!emailOrMobile || !password) {
    return res.status(400).json({
      success: false,
      message: 'emailOrMobile and password are required'
    });
  }

  // ✅ FIX: Query both email AND mobile columns together
  // Previously only searched one column — now handles both correctly
  const sql = `
    SELECT * FROM users 
    WHERE (email = ? OR mobile = ?) 
    AND status = 'active'
  `;

  db.query(sql, [emailOrMobile, emailOrMobile], async (err, results) => {

    if (err) {
      console.error('DB Login Error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = results[0];

    // ✅ FIX: Check if password in DB is hashed — if not, give clear error
    if (!user.password || !user.password.startsWith('$2b$')) {
      console.error('⚠️  Password for user', emailOrMobile, 'is not hashed in DB!');
      return res.status(500).json({
        success: false,
        message: 'Account setup incomplete. Please contact support.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // ✅ FIX: Also handle 'super_admin' stored in DB as role
    const normalizedRole = (user.role === 'super_admin' || user.role === 'superadmin')
      ? 'superadmin'
      : user.role;

    const token = jwt.sign(
      { id: user.id, role: normalizedRole },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: 'Login successful ✅',
      token,
      user: {
        id:         user.id,
        first_name: user.first_name,
        last_name:  user.last_name,
        email:      user.email,
        mobile:     user.mobile,
        role:       normalizedRole,
        status:     user.status
      }
    });

  });

};

// ================= ADD USER (Admin / Super Admin seeding) =================
exports.addUser = async (req, res) => {

  const { first_name, last_name, email, mobile, password, role } = req.body;

  const allowedRoles = ['admin', 'superadmin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Allowed: ${allowedRoles.join(', ')}`
    });
  }

  if (!email && !mobile) {
    return res.status(400).json({
      success: false,
      message: 'Either email or mobile is required'
    });
  }

  const checkSql = `SELECT id FROM users WHERE email = ? OR mobile = ?`;

  db.query(checkSql, [email || null, mobile || null], async (err, results) => {

    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (results.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email or mobile already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO users (first_name, last_name, email, mobile, password, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `;

    db.query(
      insertSql,
      [first_name, last_name, email || null, mobile || null, hashedPassword, role],
      (err, result) => {

        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        res.status(201).json({
          success: true,
          message: `${role === 'superadmin' ? 'Super Admin' : 'Admin'} created successfully ✅`,
          data: {
            id:        result.insertId,
            first_name,
            last_name,
            email:     email  || null,
            mobile:    mobile || null,
            role,
            status:    'active'
          }
        });

      }
    );

  });

};