const express = require("express");
const cors    = require("cors");
const dotenv  = require("dotenv");
const path    = require("path");

dotenv.config();

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// Static files
app.use(express.static("public"));

// ================= DEBUG LOGGER =================
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

// ================= TEST ROUTE =================
app.post("/api/test", (req, res) => {
  console.log("TEST API HIT");
  res.json({ message: "API working ✅" });
});

// ================= API ROUTES =================

// Auth Routes
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);
console.log("✅ Auth routes loaded");

// Dashboard Routes
const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api/dashboard", dashboardRoutes);
console.log("✅ Dashboard routes loaded");

// Superadmin Routes
const superadminRoutes = require("./routes/superadmin.routes");
app.use("/api/admin-management", superadminRoutes);
console.log("✅ Superadmin routes loaded");

// Transaction Routes
const transactionRoutes = require("./routes/transaction.routes");
app.use("/api/transaction", transactionRoutes);
console.log("✅ Transaction routes loaded");

// Profile Routes
const profileRoutes = require("./routes/profile.routes");
app.use("/api/profile", profileRoutes);
console.log("✅ Profile routes loaded");

// Role Routes
const roleRoutes = require("./routes/role.routes");
app.use("/api/role", roleRoutes);
console.log("✅ Role routes loaded");

// Notification Routes
const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notifications", notificationRoutes);
console.log("✅ Notification routes loaded");

// Admin Dashboard Routes
const adminDashboardRoutes = require("./routes/adminDashboard.routes");
app.use("/api/admin-dashboard", adminDashboardRoutes);
console.log("✅ Admin Dashboard routes loaded");

// Commission Routes
const commissionRoutes = require("./routes/commission.routes");
app.use("/api/commissions", commissionRoutes);
console.log("✅ Commission routes loaded");

// Settlement Routes
const settlementRoutes = require("./routes/settlement.routes");
app.use("/api/settlement", settlementRoutes);
console.log("✅ Settlement routes loaded");

// ================= STATIC HTML ROUTES =================

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/admin-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-dashboard.html"));
});

app.get("/superadmin-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "superadmin-dashboard.html"));
});

// Commission Settings Page
app.get("/commission-settings", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "commission-settings.html"));
});

app.get("/", (req, res) => {
  res.send("🚀 Shadval Pay Server Running");
});

// ================= API 404 HANDLER =================
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API route not found"
  });
});

// ================= GLOBAL 404 =================
app.use((req, res) => {
  res.status(404).send("Route not found");
});

// ================= START SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
});