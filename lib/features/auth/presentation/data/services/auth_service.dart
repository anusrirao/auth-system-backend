import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // ✅ ONE baseUrl used everywhere
  static const String baseUrl = "http://192.168.29.167:3000/api";

  // ================= LOGIN =================
  static Future<Map<String, dynamic>> login(
      String emailOrMobile, String password) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "emailOrMobile": emailOrMobile,
          "password":      password,
        }),
      ).timeout(const Duration(seconds: 10));

      print("✅ Login Status Code: ${response.statusCode}");
      print("✅ Login Response: ${response.body}");

      final data = jsonDecode(response.body);

      if (data['token'] != null) {
        // ✅ Save token and role to SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        await prefs.setString('role',  data['user']['role']);
        await prefs.setString('user',  jsonEncode(data['user']));

        return {
          'token':   data['token'],
          'role':    data['user']['role'],
          'user':    data['user'],
          'message': data['message'] ?? 'Login successful',
        };
      }

      return data;

    } catch (e) {
      print("❌ Login Error: $e");
      return {"message": "Connection failed: $e"};
    }
  }

  // ================= REGISTER — SEND OTP =================
  static Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String mobile,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/register"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "first_name": firstName,
          "last_name":  lastName,
          "email":      email,
          "mobile":     mobile,
          "password":   password,
        }),
      ).timeout(const Duration(seconds: 15));

      print("✅ Register Status: ${response.statusCode}");
      print("✅ Register Response: ${response.body}");

      return jsonDecode(response.body);

    } catch (e) {
      print("❌ Register Error: $e");
      return {"message": "Connection failed: $e"};
    }
  }

  // ================= VERIFY OTP =================
  static Future<Map<String, dynamic>> verifyOTP({
    required String emailOrMobile,
    required String otp,
  }) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/verify-otp"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "emailOrMobile": emailOrMobile,
          "otp":           otp,
        }),
      ).timeout(const Duration(seconds: 10));

      print("✅ OTP Status: ${response.statusCode}");
      print("✅ OTP Response: ${response.body}");

      return jsonDecode(response.body);

    } catch (e) {
      print("❌ OTP Error: $e");
      return {"message": "Connection failed: $e"};
    }
  }

  // ================= VERIFY OTP AND REGISTER =================
  static Future<Map<String, dynamic>> verifyOTPAndRegister({
    required String firstName,
    required String lastName,
    required String email,
    required String mobile,
    required String password,
    required String otp,
  }) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/verify-otp"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "first_name":    firstName,
          "last_name":     lastName,
          "email":         email,
          "mobile":        mobile,
          "password":      password,
          "otp":           otp,
          "emailOrMobile": email.isNotEmpty ? email : mobile,
        }),
      ).timeout(const Duration(seconds: 10));

      print("✅ Verify OTP Status: ${response.statusCode}");
      print("✅ Verify OTP Response: ${response.body}");

      return jsonDecode(response.body);

    } catch (e) {
      print("❌ Verify OTP Error: $e");
      return {"message": "Connection failed: $e"};
    }
  }

  // ================= LOGOUT =================
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  // ================= GET TOKEN =================
  static Future<String> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  // ================= GET ROLE =================
  static Future<String> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('role') ?? '';
  }
}