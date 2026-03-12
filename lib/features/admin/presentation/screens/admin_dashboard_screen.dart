import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/balance_card.dart';
import '../../../../core/widgets/quick_link_button.dart';
import '../../../../core/widgets/transaction_tile.dart';
import '../../../auth/presentation/screens/login_screen.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── HEADER ────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1565C0), Color(0xFF42A5F5)],
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text("Shadval Pay",
                              style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 13)),
                          SizedBox(height: 2),
                          Text("Admin Dashboard",
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Row(
                        children: [
                          const CircleAvatar(
                            backgroundColor: Colors.white24,
                            child: Icon(Icons.store_outlined,
                                color: Colors.white),
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
                  const SizedBox(height: 20),
                  // Balance Cards
                  Row(
                    children: [
                      Expanded(
                        child: BalanceCard(
                          title: "Opening Balance",
                          amount: "₹ 10,000",
                          color: Colors.white,
                          icon: Icons.account_balance_wallet_outlined,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: BalanceCard(
                          title: "Current Balance",
                          amount: "₹ 8,450",
                          color: Colors.greenAccent,
                          icon: Icons.currency_rupee,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: BalanceCard(
                          title: "Hold Balance",
                          amount: "₹ 1,550",
                          color: Colors.orangeAccent,
                          icon: Icons.lock_outline,
                        ),
                      ),
                    ],
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
                    const Text("Quick Links",
                        style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textDark)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: QuickLinkButton(
                            label: "Wallet Load",
                            icon: Icons.add_card_outlined,
                            color: AppColors.primary,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        "Wallet Load coming soon!")),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: QuickLinkButton(
                            label: "Settlement",
                            icon: Icons.send_outlined,
                            color: Colors.purple,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        "Settlement coming soon!")),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: QuickLinkButton(
                            label: "Manage Users",
                            icon: Icons.people_outline,
                            color: AppColors.userColor,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        "User Management coming soon!")),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: QuickLinkButton(
                            label: "Reports",
                            icon: Icons.bar_chart_outlined,
                            color: Colors.teal,
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text("Reports coming soon!")),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Recent Transactions",
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textDark)),
                        TextButton(
                          onPressed: () {},
                          child: const Text("View All",
                              style: TextStyle(
                                  color: AppColors.primary)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const TransactionTile(
                      name: "MR SREEKANTH NETHALA",
                      date: "02-02-2026 09:53 PM",
                      amount: "₹ 29,400",
                      status: "PENDING",
                    ),
                    const TransactionTile(
                      name: "Wallet Load",
                      date: "01-02-2026 11:20 AM",
                      amount: "₹ 15,000",
                      status: "SUCCESS",
                    ),
                    const TransactionTile(
                      name: "Bank Transfer",
                      date: "31-01-2026 03:45 PM",
                      amount: "₹ 5,000",
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