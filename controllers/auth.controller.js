// controllers/auth.controller.js

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ================= REGISTER =================
exports.register = async (req, res) => {
  const { first_name, last_name, email, mobile, password } = req.body;

  if (!first_name || !last_name || !password) {
    return res.status(400).json({
      success: false,
      message: 'first_name, last_name and password are required'
    });
  }

  if (!email && !mobile) {
    return res.status(400).json({
      success: false,
      message: 'Either email or mobile is required'
    });
  }

  // NULL-safe duplicate check
  let checkSql, checkParams;
  if (email && mobile) {
    checkSql    = `SELECT id FROM users WHERE email = ? OR mobile = ?`;
    checkParams = [email, mobile];
  } else if (email) {
    checkSql    = `SELECT id FROM users WHERE email = ?`;
    checkParams = [email];
  } else {
    checkSql    = `SELECT id FROM users WHERE mobile = ?`;
    checkParams = [mobile];
  }

  db.query(checkSql, checkParams, async (err, results) => {
    if (err) {
      console.error('Register Check Error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or mobile already exists' });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error('Bcrypt Error:', hashErr);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // FIX: Get the default 'user' role_id from roles table
    db.query(`SELECT id FROM roles WHERE name = 'user' LIMIT 1`, (err, roleResults) => {
      if (err) {
        console.error('Role Fetch Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      // FIX: role_id is nullable — use null if roles table has no 'user' role yet
      const role_id = roleResults.length > 0 ? roleResults[0].id : null;

      const sql = `
        INSERT INTO users (first_name, last_name, email, mobile, password, role, role_id, status)
        VALUES (?, ?, ?, ?, ?, 'user', ?, 'active')
      `;

      db.query(
        sql,
        [first_name, last_name, email || null, mobile || null, hashedPassword, role_id],
        (err, result) => {
          if (err) {
            console.error('Register Insert Error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.status(201).json({
            success:  true,
            message:  'Registered successfully',
            userId:   result.insertId
          });
        }
      );
    });
  });
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  const { emailOrMobile, email, mobile, password } = req.body;

  // ✅ support all possible inputs
  const loginField = emailOrMobile || email || mobile;

  if (!loginField || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email/Mobile and password are required'
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error'
    });
  }

  const sql = `
    SELECT * FROM users
    WHERE (email = ? OR mobile = ?)
    AND status = 'active'
    LIMIT 1
  `;

  db.query(sql, [loginField, loginField], async (err, results) => {
    if (err) {
      console.error('Login DB Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          mobile: user.mobile,
          role: user.role
        }
      });

    } catch (compareErr) {
      console.error('Bcrypt Compare Error:', compareErr);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  });
};

// ================= ADD USER =================
exports.addUser = async (req, res) => {
  const { first_name, last_name, email, mobile, password, role } = req.body;

  if (!first_name || !last_name || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'first_name, last_name, password and role are required'
    });
  }

  if (!email && !mobile) {
    return res.status(400).json({
      success: false,
      message: 'Either email or mobile is required'
    });
  }

  // Whitelist roles to prevent privilege escalation
  const ALLOWED_ROLES = ['user', 'admin', 'superadmin'];
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}`
    });
  }

  // NULL-safe duplicate check
  let checkSql, checkParams;
  if (email && mobile) {
    checkSql    = `SELECT id FROM users WHERE email = ? OR mobile = ?`;
    checkParams = [email, mobile];
  } else if (email) {
    checkSql    = `SELECT id FROM users WHERE email = ?`;
    checkParams = [email];
  } else {
    checkSql    = `SELECT id FROM users WHERE mobile = ?`;
    checkParams = [mobile];
  }

  db.query(checkSql, checkParams, async (err, results) => {
    if (err) {
      console.error('AddUser Check Error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or mobile already exists' });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error('Bcrypt Error:', hashErr);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    // FIX:Also fetch role_id from roles table
    db.query(`SELECT id FROM roles WHERE name = ? LIMIT 1`, [role], (err, roleResults) => {
      if (err) {
        console.error('Role Fetch Error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      const role_id = roleResults.length > 0 ? roleResults[0].id : null;

      const sql = `
        INSERT INTO users (first_name, last_name, email, mobile, password, role, role_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `;

      db.query(
        sql,
        [first_name, last_name, email || null, mobile || null, hashedPassword, role, role_id],
        (err, result) => {
          if (err) {
            console.error('AddUser Insert Error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }

          res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId:  result.insertId
          });
        }
      );
    });
  });
};