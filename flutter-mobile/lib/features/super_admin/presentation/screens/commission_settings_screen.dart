import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/presentation/data/services/auth_service.dart';

class CommissionSettingsScreen extends StatefulWidget {
  const CommissionSettingsScreen({super.key});

  @override
  State<CommissionSettingsScreen> createState() =>
      _CommissionSettingsScreenState();
}

class _CommissionSettingsScreenState
    extends State<CommissionSettingsScreen> {
  bool _isLoading = true;
  bool _isHistoryLoading = true;
  bool _isEditing = false;
  bool _isSaving = false;
  double _currentValue = 0.0;
  String _commissionType = 'percentage';
  List<dynamic> _commissionHistory = [];
  String _errorMessage = '';
  final TextEditingController _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchGlobalCommission();
    _fetchCommissionHistory();
  }

  void _fetchGlobalCommission() async {
    setState(() { _isLoading = true; _errorMessage = ''; });
    final result = await AuthService.getGlobalCommission();
    setState(() { _isLoading = false; });

    if (result is Map && result['data'] != null) {
      setState(() {
        _currentValue = double.tryParse(
                result['data']['commission_value'].toString()) ??
            0.0;
        _commissionType =
            result['data']['commission_type'].toString();
        _controller.text = _currentValue.toString();
      });
    } else {
      setState(() =>
          _errorMessage =
              result['message'] ?? 'Failed to fetch commission');
    }
  }

  void _fetchCommissionHistory() async {
    setState(() { _isHistoryLoading = true; });
    final result = await AuthService.getCommissionHistory();
    setState(() {
      _isHistoryLoading = false;
      _commissionHistory =
          (result is Map && result['data'] != null)
              ? result['data']
              : [];
    });
  }

  void _saveCommission() async {
    final input = double.tryParse(_controller.text.trim());
    if (input == null || input < 0 || input > 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please enter a valid value'),
            backgroundColor: AppColors.error),
      );
      return;
    }

    setState(() { _isSaving = true; });
    final result = await AuthService.updateGlobalCommission(input);
    setState(() { _isSaving = false; _isEditing = false; });

    if (result is Map && result['success'] == true) {
      setState(() => _currentValue = input);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Commission updated successfully!'),
            backgroundColor: AppColors.success),
      );
      _fetchCommissionHistory();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(result['message'] ?? 'Update failed'),
            backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text("Commission Settings",
            style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.superAdminColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: () {
              _fetchGlobalCommission();
              _fetchCommissionHistory();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                  color: AppColors.superAdminColor))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  // ── ERROR ─────────────────────────────
                  if (_errorMessage.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: AppColors.errorLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(_errorMessage,
                          style: const TextStyle(
                              color: AppColors.error)),
                    ),

                  // ── COMMISSION CARD ───────────────────
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Color(0xFF4A148C),
                          Color(0xFF9C27B0)
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            const Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                Text("Global Commission Rate",
                                    style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 13)),
                                SizedBox(height: 4),
                                Text("Applied on all transactions",
                                    style: TextStyle(
                                        color: Colors.white54,
                                        fontSize: 11)),
                              ],
                            ),
                            GestureDetector(
                              onTap: () => setState(() {
                                _isEditing = !_isEditing;
                                if (_isEditing) {
                                  _controller.text =
                                      _currentValue.toString();
                                }
                              }),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color:
                                      Colors.white.withOpacity(0.2),
                                  borderRadius:
                                      BorderRadius.circular(20),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      _isEditing
                                          ? Icons.close
                                          : Icons.edit_outlined,
                                      color: Colors.white,
                                      size: 14,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      _isEditing ? "Cancel" : "Edit",
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight:
                                              FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        if (!_isEditing)
                          Text(
                            _commissionType == 'percentage'
                                ? "$_currentValue%"
                                : "Rs.$_currentValue",
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 56,
                                fontWeight: FontWeight.bold),
                          ),

                        if (_isEditing) ...[
                          TextField(
                            controller: _controller,
                            keyboardType:
                                const TextInputType.numberWithOptions(
                                    decimal: true),
                            autofocus: true,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                            decoration: InputDecoration(
                              hintText: "Enter value",
                              hintStyle: const TextStyle(
                                  color: Colors.white38),
                              suffixText:
                                  _commissionType == 'percentage'
                                      ? '%'
                                      : 'Rs.',
                              suffixStyle: const TextStyle(
                                  color: Colors.white70),
                              enabledBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                    color: Colors.white30),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                    color: Colors.white),
                              ),
                              filled: true,
                              fillColor:
                                  Colors.white.withOpacity(0.1),
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed:
                                  _isSaving ? null : _saveCommission,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    vertical: 14),
                                shape: RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(12)),
                              ),
                              child: _isSaving
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                          color:
                                              AppColors.superAdminColor,
                                          strokeWidth: 2))
                                  : const Text("Save Commission",
                                      style: TextStyle(
                                          color:
                                              AppColors.superAdminColor,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15)),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── COMMISSION HISTORY ────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Commission History",
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textDark)),
                      if (_isHistoryLoading)
                        const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.superAdminColor),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  _isHistoryLoading
                      ? const SizedBox()
                      : _commissionHistory.isEmpty
                          ? Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppColors.white,
                                borderRadius:
                                    BorderRadius.circular(12),
                              ),
                              child: const Center(
                                child: Text(
                                    "No commission history yet",
                                    style: TextStyle(
                                        color: AppColors.textGrey)),
                              ),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              physics:
                                  const NeverScrollableScrollPhysics(),
                              itemCount: _commissionHistory.length,
                              itemBuilder: (context, index) {
                                final item =
                                    _commissionHistory[index];
                                return Container(
                                  margin: const EdgeInsets.only(
                                      bottom: 10),
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: AppColors.white,
                                    borderRadius:
                                        BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                          color: Colors.grey
                                              .withOpacity(0.07),
                                          blurRadius: 8,
                                          offset:
                                              const Offset(0, 2))
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding:
                                            const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: AppColors
                                              .superAdminColor
                                              .withOpacity(0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                            Icons.percent,
                                            color: AppColors
                                                .superAdminColor,
                                            size: 18),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment
                                                  .start,
                                          children: [
                                            Text(
                                              item['sender_name']
                                                      ?.toString() ??
                                                  'N/A',
                                              style: const TextStyle(
                                                  fontWeight:
                                                      FontWeight.w600,
                                                  fontSize: 14,
                                                  color: AppColors
                                                      .textDark),
                                            ),
                                            Text(
                                              "${item['transaction_type']?.toString() ?? ''} • ${item['created_at']?.toString().substring(0, 10) ?? ''}",
                                              style: const TextStyle(
                                                  color: AppColors
                                                      .textGrey,
                                                  fontSize: 11),
                                            ),
                                            Text(
                                              "Amount: Rs.${item['transaction_amount']?.toString() ?? 'N/A'}",
                                              style: const TextStyle(
                                                  color: AppColors
                                                      .textGrey,
                                                  fontSize: 11),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            "Rs. ${item['commission_earned']?.toString() ?? 'N/A'}",
                                            style: const TextStyle(
                                                fontWeight:
                                                    FontWeight.bold,
                                                fontSize: 14,
                                                color:
                                                    AppColors.success),
                                          ),
                                          Container(
                                            padding: const EdgeInsets
                                                .symmetric(
                                                    horizontal: 8,
                                                    vertical: 2),
                                            decoration: BoxDecoration(
                                              color:
                                                  AppColors.successLight,
                                              borderRadius:
                                                  BorderRadius.circular(
                                                      20),
                                            ),
                                            child: const Text("Earned",
                                                style: TextStyle(
                                                    color: AppColors
                                                        .success,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight
                                                        .w600)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                ],
              ),
            ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}