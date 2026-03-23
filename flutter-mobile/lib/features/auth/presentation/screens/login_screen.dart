import 'package:flutter/material.dart';
import '../data/services/auth_service.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../super_admin/presentation/screens/super_admin_dashboard.dart';
import '../../../admin/presentation/screens/admin_dashboard_screen.dart';
import '../../../user/presentation/screens/user_dashboard_screen.dart';
import '../../../../core/constants/app_session.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController    = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading       = false;
  bool _obscurePassword = true;
  String _errorMessage  = '';

  void _login() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() => _errorMessage = 'Please fill all fields');
      return;
    }

    setState(() { _isLoading = true; _errorMessage = ''; });

    final result = await AuthService.login(
      _emailController.text.trim(),
      _passwordController.text.trim(),
    );

    setState(() => _isLoading = false);

    if (result['token'] != null) {
      AppSession.token = result['token'];
      AppSession.role  = result['role'] ?? 'user';

      print("Token saved: ${AppSession.token}");
      print("Role saved: ${AppSession.role}");

      final String role = AppSession.role;

      if (!mounted) return;

      if (role == 'super_admin' || role == 'superadmin') {
        Navigator.pushReplacement(context,
            MaterialPageRoute(builder: (_) => const SuperAdminDashboard()));
      } else if (role == 'admin') {
        Navigator.pushReplacement(context,
            MaterialPageRoute(builder: (_) => const AdminDashboardScreen()));
      } else if (role == 'user') {
        Navigator.pushReplacement(context,
            MaterialPageRoute(builder: (_) => const UserDashboardScreen()));
      } else {
        setState(() => _errorMessage = 'Unknown role: $role');
      }
    } else {
      setState(() => _errorMessage = result['message'] ?? 'Login failed');
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              Container(
                height: 100,
                width: 100,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock_outline,
                    size: 50, color: AppColors.primary),
              ),
              const SizedBox(height: 24),
              const Text("Welcome Back!",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark)),
              const SizedBox(height: 8),
              const Text("Sign in to your account",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: AppColors.textGrey, fontSize: 15)),
              const SizedBox(height: 40),

              // Email or Mobile
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: "Email or Mobile Number",
                  prefixIcon: const Icon(Icons.person_outline,
                      color: AppColors.primary),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: AppColors.greyLight,
                ),
              ),
              const SizedBox(height: 16),

              // Password
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: "Password",
                  prefixIcon: const Icon(Icons.lock_outline,
                      color: AppColors.primary),
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
              const SizedBox(height: 12),

              // Error message
              if (_errorMessage.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                        color: AppColors.error.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.error, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_errorMessage,
                            style: const TextStyle(
                                color: AppColors.error,
                                fontSize: 13)),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 20),

              // Login Button
              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
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
                    : const Text("Login",
                        style: TextStyle(
                            fontSize: 16,
                            color: Colors.white,
                            fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}