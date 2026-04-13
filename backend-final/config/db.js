// config/db.js

const mysql = require("mysql2/promise"); // ✅ promise version — needed for async/await
require("dotenv").config();

const db = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  user:               process.env.DB_USER     || "appuser",
  password:           process.env.DB_PASSWORD || "Samuel@123",
  database:           process.env.DB_NAME     || "authDB",
  waitForConnections: true,
  connectionLimit:    10,
  connectTimeout:     10000,
});

// Test connection on startup
db.getConnection()
  .then(connection => {
    console.log("MySQL Connected Successfully ✅");
    connection.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });

module.exports = db;