import 'package:flutter/material.dart';
import 'package:auth_system_app/features/auth/presentation/data/services/auth_service.dart';
import 'login_screen.dart';

class OTPScreen extends StatefulWidget {
  // ✅ FIXED: Only needs emailOrMobile — not all user details
  final String emailOrMobile;

  const OTPScreen({
    super.key,
    required this.emailOrMobile,
  });

  @override
  State<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends State<OTPScreen> {
  final _otpController = TextEditingController();
  bool _isLoading   = false;
  bool _isResending = false;
  String _errorMessage   = '';
  String _successMessage = '';

  void _verifyOTP() async {
    // Validation
    if (_otpController.text.trim().length != 6) {
      setState(() => _errorMessage = 'Please enter a valid 6-digit OTP');
      return;
    }

    setState(() {
      _isLoading      = true;
      _errorMessage   = '';
      _successMessage = '';
    });

    // ✅ FIXED: Call verifyOTP() with only emailOrMobile + otp
    final result = await AuthService.verifyOTP(
      emailOrMobile: widget.emailOrMobile,
      otp: _otpController.text.trim(),
    );

    setState(() => _isLoading = false);

    if (result['message']?.toString().contains('successfully') == true ||
        result['message']?.toString().contains('success') == true) {

      // ✅ Show success message
      setState(() =>
          _successMessage = '✅ Registration Successful! Redirecting to login...');

      await Future.delayed(const Duration(seconds: 2));

      // ✅ Go to login screen — remove all previous routes
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    } else {
      setState(() =>
          _errorMessage = result['message'] ?? 'OTP verification failed');
    }
  }

  // ✅ FIXED: Resend calls register again with emailOrMobile
  void _resendOTP() async {
    setState(() {
      _isResending    = true;
      _errorMessage   = '';
      _successMessage = '';
    });

    // Detect if email or mobile
    final isEmail = widget.emailOrMobile.contains('@');

    final result = await AuthService.register(
      firstName: '',
      lastName:  '',
      email:     isEmail ? widget.emailOrMobile : '',
      mobile:    isEmail ? '' : widget.emailOrMobile,
      password:  '',
    );

    setState(() => _isResending = false);

    if (result['message']?.toString().contains('sent') == true ||
        result['message']?.toString().contains('OTP') == true) {
      setState(() => _successMessage = '✅ OTP resent! Check terminal.');
    } else {
      setState(() =>
          _errorMessage = result['message'] ?? 'Failed to resend OTP');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),

              // Back + Title
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const Text("OTP Verification",
                      style: TextStyle(
                          fontSize: 22, fontWeight: FontWeight.bold)),
                ],
              ),
              const Spacer(),

              // Icon
              Center(
                child: Container(
                  height: 100,
                  width: 100,
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.mark_email_read_outlined,
                      size: 50, color: Colors.blue),
                ),
              ),
              const SizedBox(height: 24),

              const Text("Verify Your OTP",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),

              // ✅ Show where OTP was sent
              Text(
                "We sent a 6-digit OTP to\n${widget.emailOrMobile}",
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey, height: 1.5),
              ),
              const SizedBox(height: 8),

              // ✅ Hint to check terminal during development
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: const Text(
                  "💡 Check your backend terminal for the OTP number",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.orange, fontSize: 13),
                ),
              ),
              const SizedBox(height: 32),

              // OTP Input
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 12),
                decoration: InputDecoration(
                  hintText: "------",
                  hintStyle: const TextStyle(
                      letterSpacing: 12, color: Colors.grey),
                  counterText: '',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                ),
              ),
              const SizedBox(height: 12),

              // Error Message
              if (_errorMessage.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_errorMessage,
                            style: const TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                ),

              // Success Message
              if (_successMessage.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_outline,
                          color: Colors.green, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(_successMessage,
                            style: const TextStyle(color: Colors.green)),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 20),

              // Verify Button
              ElevatedButton(
                onPressed: _isLoading ? null : _verifyOTP,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
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
                    : const Text("Verify & Register",
                        style: TextStyle(
                            fontSize: 16,
                            color: Colors.white,
                            fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 12),

              // Resend OTP
              Center(
                child: _isResending
                    ? const CircularProgressIndicator()
                    : TextButton(
                        onPressed: _resendOTP,
                        child: const Text(
                          "Didn't receive OTP? Resend",
                          style: TextStyle(color: Colors.blue),
                        ),
                      ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}