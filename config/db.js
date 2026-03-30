// config/db.js

const mysql = require("mysql2");
require("dotenv").config();

// FIX: Use connection pool instead of single connection
// Single connections crash if idle too long or on DB restart
const db = mysql.createPool({
  host:            process.env.DB_HOST     || "localhost",
  user:            process.env.DB_USER     || "root",
  password:        process.env.DB_PASSWORD || "Samuel@123",
  database:        process.env.DB_NAME     || "authDB",
  waitForConnections: true,
  connectionLimit:    10,
  connectTimeout:     10000,
});

// FIX: Test connection on startup
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1); // Exit if DB is unreachable on startup
  } else {
    console.log("MySQL Connected Successfully ✅");
    connection.release();
  }
});

module.exports = db;