import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/app_session.dart';

class CreateAdminScreen extends StatefulWidget {
  const CreateAdminScreen({super.key});
  @override
  State<CreateAdminScreen> createState() => _CreateAdminScreenState();
}

class _CreateAdminScreenState extends State<CreateAdminScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController  = TextEditingController();
  final _emailController     = TextEditingController();
  final _mobileController    = TextEditingController();
  final _passwordController  = TextEditingController();
  bool _isLoading       = false;
  bool _obscurePassword = true;
  String _errorMessage  = '';

  // ================= CREATE ADMIN API CALL =================
  void _createAdmin() async {
    if (_firstNameController.text.isEmpty ||
        _lastNameController.text.isEmpty  ||
        _emailController.text.isEmpty     ||
        _mobileController.text.isEmpty    ||
        _passwordController.text.isEmpty) {
      setState(() => _errorMessage = 'Please fill all fields');
      return;
    }

    setState(() { _isLoading = true; _errorMessage = ''; });

    try {
      // ✅ Get token from AppSession — no SharedPreferences needed
      final token = AppSession.token;
      print("🔵 Token: $token");

      if (token.isEmpty) {
        setState(() {
          _errorMessage = 'Session expired. Please login again.';
          _isLoading    = false;
        });
        return;
      }

      final response = await http.post(
        Uri.parse('${AppSession.baseUrl}/admin-management/admins/create'),
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'first_name': _firstNameController.text.trim(),
          'last_name':  _lastNameController.text.trim(),
          'email':      _emailController.text.trim(),
          'mobile':     _mobileController.text.trim(),
          'password':   _passwordController.text.trim(),
        }),
      );

      print("🔵 Response: ${response.statusCode} ${response.body}");

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 && data['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content:         Text("Admin created successfully! ✅"),
              backgroundColor: AppColors.success,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        setState(() {
          _errorMessage = data['message'] ?? 'Failed to create admin';
        });
      }
    } catch (e) {
      print("❌ ERROR: $e");
      setState(() {
        _errorMessage = 'Error: ${e.toString()}';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: const Text("Create New Admin",
            style: TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.superAdminColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.superAdminColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person_add_outlined,
                    size: 40, color: AppColors.superAdminColor),
              ),
            ),
            const SizedBox(height: 8),
            const Text("Admin Details",
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textDark)),
            const Text(
                "Credentials will be sent to admin via email & SMS",
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: AppColors.textGrey, fontSize: 13)),
            const SizedBox(height: 28),

            _buildField(
                controller: _firstNameController,
                label: "First Name",
                icon: Icons.person_outline),
            const SizedBox(height: 14),

            _buildField(
                controller: _lastNameController,
                label: "Last Name",
                icon: Icons.person_outline),
            const SizedBox(height: 14),

            _buildField(
                controller: _emailController,
                label: "Email Address",
                icon: Icons.email_outlined,
                keyboard: TextInputType.emailAddress),
            const SizedBox(height: 14),

            _buildField(
                controller: _mobileController,
                label: "Mobile Number",
                icon: Icons.phone_outlined,
                keyboard: TextInputType.phone),
            const SizedBox(height: 14),

            TextField(
              controller: _passwordController,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                labelText: "Temporary Password",
                prefixIcon: const Icon(Icons.lock_outline,
                    color: AppColors.superAdminColor),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: AppColors.grey,
                  ),
                  onPressed: () => setState(
                      () => _obscurePassword = !_obscurePassword),
                ),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: AppColors.greyLight,
              ),
            ),
            const SizedBox(height: 8),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                    color: AppColors.primary.withOpacity(0.2)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline,
                      color: AppColors.primary, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "Admin will be prompted to change password on first login via OTP verification.",
                      style: TextStyle(
                          color: AppColors.primary, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

            if (_errorMessage.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.errorLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(_errorMessage,
                    style: const TextStyle(color: AppColors.error)),
              ),
            ],
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _isLoading ? null : _createAdmin,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.superAdminColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text("Create Admin Account",
                      style: TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                          fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType keyboard = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboard,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.superAdminColor),
        border:     OutlineInputBorder(
            borderRadius: BorderRadius.circular(12)),
        filled:    true,
        fillColor: AppColors.greyLight,
      ),
    );
  }
}