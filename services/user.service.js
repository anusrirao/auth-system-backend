// services/user.service.js
const db = require("../config/db");

const findUserByEmailOrMobile = (emailOrMobile) => {
  return new Promise((resolve, reject) => {
    const isEmail = emailOrMobile.includes("@");
    const sql = isEmail
      ? `SELECT * FROM users WHERE LOWER(email) = LOWER(?)`
      : `SELECT * FROM users WHERE mobile = ?`;

    db.query(sql, [emailOrMobile], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
};

const createUser = (userData) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO users (first_name, last_name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [userData.first_name, userData.last_name, userData.email, userData.mobile, userData.password, "user"],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

module.exports = { findUserByEmailOrMobile, createUser };