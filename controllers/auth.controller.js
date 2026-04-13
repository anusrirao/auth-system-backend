// controllers/auth.controller.js

const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ================= REGISTER =================
exports.register = async (req, res) => {
  const { first_name, last_name, email, mobile, password } = req.body;

  if (!first_name || !last_name || !password) {
    return res.status(400).json({
      message: 'first_name, last_name and password are required'
    });
  }

  if (!email && !mobile) {
    return res.status(400).json({
      message: 'Either email or mobile is required'
    });
  }

  // FIX 1: Prevent duplicate check from matching NULL = NULL in SQL
  // Use separate conditions to avoid false positives when one field is NULL
  let checkSql;
  let checkParams;

  if (email && mobile) {
    checkSql = `SELECT id FROM users WHERE email = ? OR mobile = ?`;
    checkParams = [email, mobile];
  } else if (email) {
    checkSql = `SELECT id FROM users WHERE email = ?`;
    checkParams = [email];
  } else {
    checkSql = `SELECT id FROM users WHERE mobile = ?`;
    checkParams = [mobile];
  }

  db.query(checkSql, checkParams, async (err, results) => {
    if (err) {
      console.error('Register Check Error:', err);
      return res.status(500).json({ message: 'Server error' }); // FIX 2: Don't expose DB error details to client
    }

    if (results.length > 0) {
      return res.status(409).json({ message: 'Email or mobile already exists' }); // FIX 3: Use 409 Conflict (not 400) for duplicate
    }

    // FIX 4: Wrap async bcrypt in try/catch to handle unexpected errors
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error('Bcrypt Error:', hashErr);
      return res.status(500).json({ message: 'Server error' });
    }

    const sql = `
      INSERT INTO users (first_name, last_name, email, mobile, password, role, status)
      VALUES (?, ?, ?, ?, ?, 'user', 'active')
    `;

    db.query(
      sql,
      [first_name, last_name, email || null, mobile || null, hashedPassword],
      (err, result) => {
        if (err) {
          console.error('Register Insert Error:', err);
          return res.status(500).json({ message: 'Server error' }); // FIX 2: No detail leak
        }

        res.status(201).json({
          success: true,
          message: 'Registered successfully',
          userId: result.insertId
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
      message: 'emailOrMobile and password are required'
    });
  }

  // FIX 5: Move JWT_SECRET check BEFORE the DB query (fail fast)
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const sql = `
    SELECT * FROM users
    WHERE (email = ? OR mobile = ?)
    AND status = 'active'
  `;

  db.query(sql, [emailOrMobile, emailOrMobile], async (err, results) => {
    if (err) {
      console.error('Login DB Error:', err);
      return res.status(500).json({ message: 'Server error' }); // FIX 2: No detail leak
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    // FIX 4: Wrap async bcrypt.compare in try/catch
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (compareErr) {
      console.error('Bcrypt Compare Error:', compareErr);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id:         user.id,
        first_name: user.first_name,
        last_name:  user.last_name,
        email:      user.email,
        mobile:     user.mobile,
        role:       user.role
      }
    });
  });
};

// ================= ADD USER =================
exports.addUser = async (req, res) => {
  const { first_name, last_name, email, mobile, password, role } = req.body;

  if (!first_name || !last_name || !password || !role) {
    return res.status(400).json({
      message: 'first_name, last_name, password and role are required'
    });
  }

  if (!email && !mobile) {
    return res.status(400).json({
      message: 'Either email or mobile is required'
    });
  }

  // FIX 6: Whitelist allowed roles to prevent privilege escalation
  const ALLOWED_ROLES = ['user', 'admin', 'moderator']; // adjust to your app's roles
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` });
  }

  // FIX 1: Same NULL-safe duplicate check as register
  let checkSql;
  let checkParams;

  if (email && mobile) {
    checkSql = `SELECT id FROM users WHERE email = ? OR mobile = ?`;
    checkParams = [email, mobile];
  } else if (email) {
    checkSql = `SELECT id FROM users WHERE email = ?`;
    checkParams = [email];
  } else {
    checkSql = `SELECT id FROM users WHERE mobile = ?`;
    checkParams = [mobile];
  }

  db.query(checkSql, checkParams, async (err, results) => {
    if (err) {
      console.error('AddUser Check Error:', err);
      return res.status(500).json({ message: 'Server error' }); // FIX 2: No detail leak
    }

    if (results.length > 0) {
      return res.status(409).json({ message: 'Email or mobile already exists' }); // FIX 3: 409 Conflict
    }

    // FIX 4: Wrap async bcrypt in try/catch
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashErr) {
      console.error('Bcrypt Error:', hashErr);
      return res.status(500).json({ message: 'Server error' });
    }

    const sql = `
      INSERT INTO users (first_name, last_name, email, mobile, password, role, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `;

    db.query(
      sql,
      [first_name, last_name, email || null, mobile || null, hashedPassword, role],
      (err, result) => {
        if (err) {
          console.error('AddUser Insert Error:', err);
          return res.status(500).json({ message: 'Server error' }); // FIX 2: No detail leak
        }

        res.status(201).json({
          success: true,
          message: 'User created successfully',
          userId: result.insertId
        });
      }
    );
  });
};