import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/stat_card.dart';
import '../../../../core/widgets/transaction_tile.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import 'admin_management_screen.dart';
import 'commission_settings_screen.dart';
import 'reports_screen.dart';                          // ← NEW

class SuperAdminDashboard extends StatelessWidget {
  const SuperAdminDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── HEADER ────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF4A148C), Color(0xFF9C27B0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(28),
                  bottomRight: Radius.circular(28),
                ),
              ),
              child: Column(
                children: [
                  // ── TOP ROW ──────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Shadval Pay",
                              style: TextStyle(
                                  color: Colors.white70, fontSize: 13)),
                          SizedBox(height: 2),
                          Text("Super Admin",
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold)),
                        ],
                      ),
                      // Notifications + Profile + Logout
                      Row(
                        children: [
                          GestureDetector(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text("Notifications coming soon!")),
                              );
                            },
                            child: const CircleAvatar(
                              backgroundColor: Colors.white24,
                              child: Icon(Icons.notifications_outlined,
                                  color: Colors.white, size: 20),
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text("Profile coming soon!")),
                              );
                            },
                            child: const CircleAvatar(
                              backgroundColor: Colors.white24,
                              child: Icon(Icons.admin_panel_settings,
                                  color: Colors.white, size: 20),
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () => Navigator.pushAndRemoveUntil(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const LoginScreen()),
                              (route) => false,
                            ),
                            child: const CircleAvatar(
                              backgroundColor: Colors.white24,
                              child: Icon(Icons.logout,
                                  color: Colors.white, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ── COMMISSION BANNER ─────────────────
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Total Commission Earned",
                                style: TextStyle(
                                    color: Colors.white70, fontSize: 12)),
                            SizedBox(height: 4),
                            Text("Rs. 1,24,500.00",
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text("2.5% Commission",
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── BODY ──────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    // ── PLATFORM OVERVIEW ─────────────
                    const Text("Platform Overview",
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark)),
                    const SizedBox(height: 12),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.1,
                      children: const [
                        StatCard(
                          title: "Total Admins",
                          value: "24",
                          icon: Icons.store_outlined,
                          color: AppColors.adminColor,
                          subtitle: "Active",
                        ),
                        StatCard(
                          title: "Total Users",
                          value: "1,248",
                          icon: Icons.people_outline,
                          color: AppColors.userColor,
                          subtitle: "Active",
                        ),
                        StatCard(
                          title: "Total Transactions",
                          value: "8,540",
                          icon: Icons.swap_horiz_outlined,
                          color: AppColors.primary,
                          subtitle: "This Month",
                        ),
                        StatCard(
                          title: "Total Volume",
                          value: "Rs. 49.8L",
                          icon: Icons.account_balance_outlined,
                          color: AppColors.superAdminColor,
                          subtitle: "This Month",
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── QUICK ACTIONS ─────────────────
                    const Text("Quick Actions",
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark)),
                    const SizedBox(height: 12),

                    // Row 1
                    Row(
                      children: [
                        Expanded(
                          child: _ActionButton(
                            label: "Manage Admins",
                            icon: Icons.manage_accounts_outlined,
                            color: AppColors.adminColor,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const AdminManagementScreen()),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _ActionButton(
                            label: "Commission Settings",
                            icon: Icons.percent_outlined,
                            color: AppColors.superAdminColor,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const CommissionSettingsScreen()),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Row 2                              ← UPDATED — Reports wired
                    Row(
                      children: [
                        Expanded(
                          child: _ActionButton(
                            label: "All Reports",
                            icon: Icons.bar_chart_outlined,
                            color: AppColors.userColor,
                            onTap: () => Navigator.push(   // ← was SnackBar
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      const SuperAdminReportsScreen()),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _ActionButton(
                            label: "All Transactions",
                            icon: Icons.swap_horiz_outlined,
                            color: AppColors.primary,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        "All Transactions coming soon!")),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── RECENT TRANSACTIONS ───────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Recent Transactions",
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textDark)),
                        TextButton(
                          onPressed: () => Navigator.push(   // ← wired to Reports
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    const SuperAdminReportsScreen()),
                          ),
                          child: const Text("View All",
                              style:
                                  TextStyle(color: AppColors.primary)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const TransactionTile(
                      name: "MR SREEKANTH NETHALA",
                      date: "02-02-2026 09:53 PM",
                      amount: "Rs. 29,400",
                      status: "PENDING",
                    ),
                    const TransactionTile(
                      name: "Wallet Load - Admin 1",
                      date: "01-02-2026 11:20 AM",
                      amount: "Rs. 15,000",
                      status: "SUCCESS",
                    ),
                    const TransactionTile(
                      name: "Settlement - Admin 3",
                      date: "31-01-2026 03:45 PM",
                      amount: "Rs. 5,000",
                      status: "FAILED",
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Action Button Widget ───────────────────────────
class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.12),
              blurRadius: 8,
              offset: const Offset(0, 3),
            )
          ],
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(label,
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 11)),
          ],
        ),
      ),
    );
  }
}