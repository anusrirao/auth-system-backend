import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/transaction_tile.dart';
import '../../../auth/presentation/screens/login_screen.dart';

class UserDashboardScreen extends StatelessWidget {
  const UserDashboardScreen({super.key});

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
                  colors: [Color(0xFF00695C), Color(0xFF26A69A)],
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
                          Text("Welcome!",
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
                            child: Icon(Icons.person_outline,
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
                  // Make Payment Button
                  ElevatedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content:
                                Text("Make Payment coming soon!")),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.userColor,
                      padding: const EdgeInsets.symmetric(
                          vertical: 14, horizontal: 32),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.payment_outlined),
                    label: const Text("Make Payment",
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16)),
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Payment History",
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textDark)),
                        TextButton(
                          onPressed: () {},
                          child: const Text("View All",
                              style: TextStyle(
                                  color: AppColors.userColor)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const TransactionTile(
                      name: "Payment to Vendor",
                      date: "02-02-2026 09:53 PM",
                      amount: "₹ 1,200",
                      status: "SUCCESS",
                    ),
                    const TransactionTile(
                      name: "Payment to Vendor",
                      date: "01-02-2026 11:20 AM",
                      amount: "₹ 500",
                      status: "SUCCESS",
                    ),
                    const TransactionTile(
                      name: "Payment to Vendor",
                      date: "31-01-2026 03:45 PM",
                      amount: "₹ 2,000",
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