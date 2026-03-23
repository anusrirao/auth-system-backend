import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/presentation/data/services/auth_service.dart';
import 'create_admin_screen.dart';

class AdminManagementScreen extends StatefulWidget {
  const AdminManagementScreen({super.key});
  @override
  State<AdminManagementScreen> createState() =>
      _AdminManagementScreenState();
}

class _AdminManagementScreenState extends State<AdminManagementScreen> {
  List<Map<String, dynamic>> _admins = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchAdmins();
  }

  // ================= FETCH ALL ADMINS =================
  Future<void> _fetchAdmins() async {
    setState(() { _isLoading = true; _errorMessage = ''; });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';

      final response = await http.get(
        Uri.parse('${AuthService.baseUrl}/admin-management/admins'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        setState(() {
          _admins = List<Map<String, dynamic>>.from(data['data']);
        });
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to load admins';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error: ${e.toString()}';
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // ================= TOGGLE ADMIN STATUS =================
  Future<void> _toggleAdminStatus(int adminId, bool isActive) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';

      final endpoint = isActive
          ? '${AuthService.baseUrl}/admin-management/admins/deactivate/$adminId'
          : '${AuthService.baseUrl}/admin-management/admins/activate/$adminId';

      final response = await http.put(
        Uri.parse(endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isActive
                ? "Admin deactivated successfully"
                : "Admin activated successfully"),
            backgroundColor: AppColors.success,
          ),
        );
        _fetchAdmins();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'Action failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Network error: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeCount   = _admins.where((a) => a['is_active'] == 1).length;
    final inactiveCount = _admins.where((a) => a['is_active'] == 0).length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Admin Management",
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.superAdminColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchAdmins,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => const CreateAdminScreen()),
          );
          if (result == true) _fetchAdmins();
        },
        backgroundColor: AppColors.superAdminColor,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text("Add Admin",
            style: TextStyle(color: Colors.white)),
      ),
      body: Column(
        children: [
          // ── Summary Bar ───────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.superAdminColor,
            child: Row(
              children: [
                _SummaryChip(
                    label: "Total",
                    count: "${_admins.length}",
                    color: Colors.white),
                const SizedBox(width: 12),
                _SummaryChip(
                    label: "Active",
                    count: "$activeCount",
                    color: Colors.greenAccent),
                const SizedBox(width: 12),
                _SummaryChip(
                    label: "Inactive",
                    count: "$inactiveCount",
                    color: Colors.orangeAccent),
              ],
            ),
          ),

          // ── Loading ───────────────────────────────────
          if (_isLoading)
            const Expanded(
              child: Center(
                child: CircularProgressIndicator(
                    color: AppColors.superAdminColor),
              ),
            )

          // ── Error ─────────────────────────────────────
          else if (_errorMessage.isNotEmpty)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline,
                        color: AppColors.error, size: 48),
                    const SizedBox(height: 12),
                    Text(_errorMessage,
                        style:
                            const TextStyle(color: AppColors.error)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _fetchAdmins,
                      child: const Text("Retry"),
                    ),
                  ],
                ),
              ),
            )

          // ── Empty ─────────────────────────────────────
          else if (_admins.isEmpty)
            const Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.people_outline,
                        size: 64, color: AppColors.textGrey),
                    SizedBox(height: 12),
                    Text("No admins found",
                        style: TextStyle(color: AppColors.textGrey)),
                  ],
                ),
              ),
            )

          // ── Admin List ────────────────────────────────
          else
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _admins.length,
                itemBuilder: (context, index) {
                  final admin = _admins[index];
                  final isActive = admin['is_active'] == 1;
                  final name =
                      '${admin['first_name']} ${admin['last_name']}';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.grey.withOpacity(0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 2))
                      ],
                    ),
                    child: Column(
                      children: [
                        // ── Admin Info ────────────────
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor:
                                  AppColors.superAdminColor
                                      .withOpacity(0.1),
                              radius: 24,
                              child: Text(
                                name[0].toUpperCase(),
                                style: const TextStyle(
                                    color: AppColors.superAdminColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(name,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                          color: AppColors.textDark)),
                                  const SizedBox(height: 2),
                                  Text(admin['email'] ?? '',
                                      style: const TextStyle(
                                          color: AppColors.textGrey,
                                          fontSize: 12)),
                                  Text(admin['mobile'] ?? '',
                                      style: const TextStyle(
                                          color: AppColors.textGrey,
                                          fontSize: 12)),
                                ],
                              ),
                            ),
                            // Status Badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: isActive
                                    ? AppColors.successLight
                                    : AppColors.errorLight,
                                borderRadius:
                                    BorderRadius.circular(20),
                              ),
                              child: Text(
                                isActive ? "Active" : "Inactive",
                                style: TextStyle(
                                    color: isActive
                                        ? AppColors.success
                                        : AppColors.error,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1),
                        const SizedBox(height: 10),

                        // ── Action Buttons ────────────
                        Row(
                          children: [
                            // Deactivate Button
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: isActive
                                    ? () => _toggleAdminStatus(
                                        admin['id'], isActive)
                                    : null,
                                icon: const Icon(
                                    Icons.block_outlined,
                                    size: 16,
                                    color: AppColors.error),
                                label: const Text("Deactivate",
                                    style: TextStyle(
                                        color: AppColors.error,
                                        fontSize: 12)),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(
                                      color: AppColors.error),
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(8)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Activate Button
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: !isActive
                                    ? () => _toggleAdminStatus(
                                        admin['id'], isActive)
                                    : null,
                                icon: const Icon(
                                    Icons.check_circle_outline,
                                    size: 16,
                                    color: Colors.white),
                                label: const Text("Activate",
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 12)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.success,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(8)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label;
  final String count;
  final Color color;

  const _SummaryChip({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(count,
            style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 18)),
        const SizedBox(width: 4),
        Text(label,
            style: const TextStyle(
                color: Colors.white70, fontSize: 12)),
      ],
    );
  }
}