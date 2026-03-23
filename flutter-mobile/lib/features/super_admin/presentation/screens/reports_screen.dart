// ============================================================
// lib/features/super_admin/presentation/screens/reports_screen.dart
// ============================================================

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../../core/constants/app_session.dart';

// ════════════════════════════════════════════════════════════
//  MODELS
// ════════════════════════════════════════════════════════════

enum _Period { daily, weekly, monthly }

extension _PeriodX on _Period {
  String get label {
    switch (this) {
      case _Period.daily:   return 'Daily';
      case _Period.weekly:  return 'Weekly';
      case _Period.monthly: return 'Monthly';
    }
  }

  String get param {
    switch (this) {
      case _Period.daily:   return 'daily';
      case _Period.weekly:  return 'weekly';
      case _Period.monthly: return 'monthly';
    }
  }
}

class _Summary {
  final double revenue, commission;
  final int transactions, totalUsers, activeUsers, totalAdmins, activeAdmins, failedTxns;
  final double revenueGrowth, txnGrowth;

  _Summary({
    required this.revenue,
    required this.commission,
    required this.transactions,
    required this.totalUsers,
    required this.activeUsers,
    required this.totalAdmins,
    required this.activeAdmins,
    required this.revenueGrowth,
    required this.txnGrowth,
    required this.failedTxns,
  });

  factory _Summary.fromJson(Map<String, dynamic> j) => _Summary(
        revenue:      (j['total_revenue']       ?? 0).toDouble(),
        commission:   (j['total_commission']    ?? 0).toDouble(),
        transactions:  j['total_transactions']  ?? 0,
        totalUsers:    j['total_users']         ?? 0,
        activeUsers:   j['active_users']        ?? 0,
        totalAdmins:   j['total_admins']        ?? 0,
        activeAdmins:  j['active_admins']       ?? 0,
        revenueGrowth: (j['revenue_growth']     ?? 0).toDouble(),
        txnGrowth:     (j['transaction_growth'] ?? 0).toDouble(),
        failedTxns:    j['failed_transactions'] ?? 0,
      );

  factory _Summary.mock() => _Summary(
        revenue: 984500.75, commission: 49225.04,
        transactions: 12840, totalUsers: 342, activeUsers: 298,
        totalAdmins: 8,     activeAdmins: 7,
        revenueGrowth: 12.4, txnGrowth: 8.1, failedTxns: 24,
      );
}

class _ChartPt {
  final String label;
  final double revenue, commission;
  final int transactions;

  _ChartPt({
    required this.label,
    required this.revenue,
    required this.commission,
    required this.transactions,
  });

  factory _ChartPt.fromJson(Map<String, dynamic> j) => _ChartPt(
        label:        j['label']        ?? '',
        revenue:      (j['revenue']     ?? 0).toDouble(),
        commission:   (j['commission']  ?? 0).toDouble(),
        transactions:  j['transactions']?? 0,
      );
}

class _Txn {
  final String id, userName, adminName, type, status, createdAt;
  final double amount, commission;

  _Txn({
    required this.id,
    required this.userName,
    required this.adminName,
    required this.type,
    required this.status,
    required this.createdAt,
    required this.amount,
    required this.commission,
  });

  factory _Txn.fromJson(Map<String, dynamic> j) => _Txn(
        id:         j['id']?.toString()   ?? '',
        userName:   j['user_name']        ?? 'Unknown',
        adminName:  j['admin_name']       ?? '-',
        type:       j['type']             ?? 'transfer',
        status:     j['status']          ?? 'pending',
        createdAt:  j['created_at']       ?? '',
        amount:     (j['amount']          ?? 0).toDouble(),
        commission: (j['commission']      ?? 0).toDouble(),
      );
}

class _Log {
  final String actorName, actorRole, action, target, createdAt;
  final bool isWarning;

  _Log({
    required this.actorName,
    required this.actorRole,
    required this.action,
    required this.target,
    required this.createdAt,
    required this.isWarning,
  });

  factory _Log.fromJson(Map<String, dynamic> j) => _Log(
        actorName: j['actor_name'] ?? '',
        actorRole: j['actor_role'] ?? 'user',
        action:    j['action']     ?? '',
        target:    j['target']     ?? '',
        createdAt: j['created_at'] ?? '',
        isWarning: j['is_warning'] ?? false,
      );
}

class _Report {
  final _Summary      summary;
  final List<_ChartPt> chart;
  final List<_Txn>    transactions;
  final List<_Log>    adminLogs, userLogs;

  _Report({
    required this.summary,
    required this.chart,
    required this.transactions,
    required this.adminLogs,
    required this.userLogs,
  });

  factory _Report.fromJson(Map<String, dynamic> j) => _Report(
        summary:      _Summary.fromJson(j['summary']        ?? {}),
        chart:        (j['chart_data']     as List? ?? []).map((e) => _ChartPt.fromJson(e)).toList(),
        transactions: (j['transactions']   as List? ?? []).map((e) => _Txn.fromJson(e)).toList(),
        adminLogs:    (j['admin_activity'] as List? ?? []).map((e) => _Log.fromJson(e)).toList(),
        userLogs:     (j['user_activity']  as List? ?? []).map((e) => _Log.fromJson(e)).toList(),
      );

  factory _Report.mock(_Period p) => _Report(
        summary:      _Summary.mock(),
        chart:        _mockChart(p),
        transactions: _mockTxns(),
        adminLogs:    _mockAdminLogs(),
        userLogs:     _mockUserLogs(),
      );

  static List<_ChartPt> _mockChart(_Period p) {
    if (p == _Period.daily) {
      return [
        _ChartPt(label: 'Mon', revenue: 14200, commission: 710,  transactions: 182),
        _ChartPt(label: 'Tue', revenue: 18500, commission: 925,  transactions: 241),
        _ChartPt(label: 'Wed', revenue: 12900, commission: 645,  transactions: 167),
        _ChartPt(label: 'Thu', revenue: 21400, commission: 1070, transactions: 290),
        _ChartPt(label: 'Fri', revenue: 19800, commission: 990,  transactions: 258),
        _ChartPt(label: 'Sat', revenue: 16300, commission: 815,  transactions: 209),
        _ChartPt(label: 'Sun', revenue: 11200, commission: 560,  transactions: 144),
      ];
    }
    if (p == _Period.weekly) {
      return [
        _ChartPt(label: 'Wk 1', revenue: 98400,  commission: 4920, transactions: 1240),
        _ChartPt(label: 'Wk 2', revenue: 112000, commission: 5600, transactions: 1450),
        _ChartPt(label: 'Wk 3', revenue: 87600,  commission: 4380, transactions: 1100),
        _ChartPt(label: 'Wk 4', revenue: 134200, commission: 6710, transactions: 1720),
      ];
    }
    return [
      _ChartPt(label: 'Aug', revenue: 124000, commission: 6200,  transactions: 1580),
      _ChartPt(label: 'Sep', revenue: 152000, commission: 7600,  transactions: 1930),
      _ChartPt(label: 'Oct', revenue: 189000, commission: 9450,  transactions: 2410),
      _ChartPt(label: 'Nov', revenue: 143000, commission: 7150,  transactions: 1820),
      _ChartPt(label: 'Dec', revenue: 216000, commission: 10800, transactions: 2750),
      _ChartPt(label: 'Jan', revenue: 160500, commission: 8025,  transactions: 2040),
    ];
  }

  static List<_Txn> _mockTxns() => [
    _Txn(id: 'TXN-8821', userName: 'Rahul Sharma',  adminName: 'Admin A', amount: 15000, commission: 750,  type: 'credit',   status: 'success', createdAt: 'Today, 10:24 AM'),
    _Txn(id: 'TXN-8820', userName: 'Priya Singh',   adminName: 'Admin B', amount: 8500,  commission: 425,  type: 'debit',    status: 'success', createdAt: 'Today, 09:15 AM'),
    _Txn(id: 'TXN-8819', userName: 'Amit Verma',    adminName: 'Admin A', amount: 3200,  commission: 160,  type: 'transfer', status: 'pending', createdAt: 'Yesterday, 06:40 PM'),
    _Txn(id: 'TXN-8818', userName: 'Sneha Patel',   adminName: 'Admin C', amount: 22000, commission: 1100, type: 'credit',   status: 'failed',  createdAt: 'Yesterday, 03:10 PM'),
    _Txn(id: 'TXN-8817', userName: 'Karan Mehta',   adminName: 'Admin B', amount: 5750,  commission: 288,  type: 'debit',    status: 'success', createdAt: 'Mar 16, 11:05 AM'),
    _Txn(id: 'TXN-8816', userName: 'Divya Joshi',   adminName: 'Admin A', amount: 12400, commission: 620,  type: 'transfer', status: 'success', createdAt: 'Mar 16, 08:30 AM'),
    _Txn(id: 'TXN-8815', userName: 'Vikram Nair',   adminName: 'Admin C', amount: 9800,  commission: 490,  type: 'credit',   status: 'success', createdAt: 'Mar 15, 04:20 PM'),
    _Txn(id: 'TXN-8814', userName: 'Meena Reddy',   adminName: 'Admin B', amount: 4300,  commission: 215,  type: 'debit',    status: 'failed',  createdAt: 'Mar 15, 01:10 PM'),
  ];

  static List<_Log> _mockAdminLogs() => [
    _Log(actorName: 'Admin A', actorRole: 'admin', action: 'Created new user',     target: 'user@example.com',    createdAt: 'Today, 11:02 AM',     isWarning: false),
    _Log(actorName: 'Admin B', actorRole: 'admin', action: 'Deactivated user',     target: 'inactive@gmail.com',  createdAt: 'Today, 09:45 AM',     isWarning: true),
    _Log(actorName: 'Admin C', actorRole: 'admin', action: 'Updated commission',   target: 'Commission settings', createdAt: 'Yesterday, 04:20 PM', isWarning: false),
    _Log(actorName: 'Admin A', actorRole: 'admin', action: 'Approved transaction', target: 'TXN-8810',            createdAt: 'Yesterday, 02:15 PM', isWarning: false),
    _Log(actorName: 'Admin B', actorRole: 'admin', action: 'Reset user password',  target: 'rahul@gmail.com',     createdAt: 'Mar 16, 10:00 AM',    isWarning: false),
  ];

  static List<_Log> _mockUserLogs() => [
    _Log(actorName: 'Rahul Sharma', actorRole: 'user', action: 'Login',              target: 'Mobile app',        createdAt: 'Today, 10:20 AM',     isWarning: false),
    _Log(actorName: 'Sneha Patel',  actorRole: 'user', action: 'Failed transaction', target: 'TXN-8818',          createdAt: 'Yesterday, 03:10 PM', isWarning: true),
    _Log(actorName: 'Priya Singh',  actorRole: 'user', action: 'Profile updated',    target: 'Mobile number',     createdAt: 'Yesterday, 01:30 PM', isWarning: false),
    _Log(actorName: 'Amit Verma',   actorRole: 'user', action: 'OTP requested',      target: 'Login attempt',     createdAt: 'Mar 16, 09:00 AM',    isWarning: false),
    _Log(actorName: 'Meena Reddy',  actorRole: 'user', action: 'Multiple failures',  target: '3 failed attempts', createdAt: 'Mar 15, 01:15 PM',    isWarning: true),
  ];
}

// ════════════════════════════════════════════════════════════
//  SERVICE
// ════════════════════════════════════════════════════════════

class _ReportService {
  static const _base = 'http://192.168.29.167:3000/api';

  static Map<String, String> _hdrs(String token) => {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer $token',
      };

  static Future<_Report> fetch({
    required String token,
    required _Period period,
  }) async {
    try {
      final res = await http
          .get(
            Uri.parse('$_base/reports/super-admin?period=${period.param}'),
            headers: _hdrs(token),
          )
          .timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        return _Report.fromJson(body['data'] ?? body);
      }
      return _Report.mock(period);
    } catch (_) {
      return _Report.mock(period);
    }
  }
}

// ════════════════════════════════════════════════════════════
//  DESIGN TOKENS — LIGHT THEME
// ════════════════════════════════════════════════════════════

const _kBg     = Color(0xFFF5F6FA);
const _kCard   = Color(0xFFFFFFFF);
const _kBorder = Color(0xFFE0E0E0);
const _kPurple = Color(0xFF6A1B9A);
const _kGold   = Color(0xFFF57F17);
const _kCyan   = Color(0xFF00838F);
const _kGreen  = Color(0xFF2E7D32);
const _kRed    = Color(0xFFC62828);
const _kText   = Color(0xFF212121);
const _kSubText = Color(0xFF757575);

// ════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ════════════════════════════════════════════════════════════

class SuperAdminReportsScreen extends StatefulWidget {
  const SuperAdminReportsScreen({super.key});

  @override
  State<SuperAdminReportsScreen> createState() =>
      _SuperAdminReportsScreenState();
}

class _SuperAdminReportsScreenState extends State<SuperAdminReportsScreen>
    with SingleTickerProviderStateMixin {
  _Report?        _report;
  bool            _loading = true;
  String?         _error;
  _Period         _period  = _Period.monthly;
  late TabController _tabCtrl;
  String          _txnFilter = 'all';

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _tabCtrl.addListener(() => setState(() {}));
    _fetch();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetch() async {
    setState(() { _loading = true; _error = null; });
    try {
      final report = await _ReportService.fetch(
        token:  AppSession.token,
        period: _period,
      );
      if (mounted) setState(() { _report = report; _loading = false; });
    } catch (e) {
      if (mounted) {
        setState(() {
          _error   = 'Could not load report. Pull down to retry.';
          _loading = false;
        });
      }
    }
  }

  String _fc(double v) {
    if (v >= 10000000) return 'Rs.${(v / 10000000).toStringAsFixed(2)}Cr';
    if (v >= 100000)   return 'Rs.${(v / 100000).toStringAsFixed(2)}L';
    if (v >= 1000)     return 'Rs.${(v / 1000).toStringAsFixed(1)}K';
    return 'Rs.${v.toStringAsFixed(0)}';
  }

  String _fg(double v) =>
      v >= 0 ? '+${v.toStringAsFixed(1)}%' : '${v.toStringAsFixed(1)}%';

  String _initials(String name) {
    final p = name.trim().split(' ');
    if (p.length >= 2) return '${p[0][0]}${p[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(),
            Expanded(
              child: _loading
                  ? _buildLoader()
                  : _error != null
                      ? _buildError()
                      : RefreshIndicator(
                          onRefresh: _fetch,
                          color: _kPurple,
                          backgroundColor: _kCard,
                          child: _buildBody(),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  // ── App bar ──────────────────────────────────────────────
  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: _kPurple,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: Colors.white,
                size: 16,
              ),
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Platform Reports',
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: -0.3)),
                Text('Super Admin  •  Full access',
                    style: TextStyle(fontSize: 11, color: Colors.white70)),
              ],
            ),
          ),
          GestureDetector(
            onTap: _showExportSheet,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withOpacity(0.4)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.download_rounded, color: Colors.white, size: 15),
                  SizedBox(width: 5),
                  Text('Export',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Scrollable body ──────────────────────────────────────
  Widget _buildBody() {
    final r = _report!;
    return CustomScrollView(
      physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics()),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 18),
                _buildPeriodToggle(),
                const SizedBox(height: 22),
                _buildStatGrid(r.summary),
                const SizedBox(height: 24),
                _buildChartCard(r.chart),
                const SizedBox(height: 24),
                _buildTabBar(),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _buildTabContent(r),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 40)),
      ],
    );
  }

  // ── Period toggle ────────────────────────────────────────
  Widget _buildPeriodToggle() {
    return Container(
      height: 42,
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: _kBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          )
        ],
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: _Period.values.map((p) {
          final sel = _period == p;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                if (_period == p) return;
                setState(() => _period = p);
                _fetch();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeInOut,
                decoration: BoxDecoration(
                  color: sel ? _kPurple : Colors.transparent,
                  borderRadius: BorderRadius.circular(9),
                ),
                alignment: Alignment.center,
                child: Text(
                  p.label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: sel ? Colors.white : _kSubText,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── Stat cards grid ──────────────────────────────────────
  Widget _buildStatGrid(_Summary s) {
    final items = [
      _SC('Total Revenue',  _fc(s.revenue),     _fg(s.revenueGrowth), true,  Icons.account_balance_wallet_rounded, _kPurple),
      _SC('Commission',     _fc(s.commission),  '+5.2%',              true,  Icons.percent_rounded,                _kGold),
      _SC('Transactions',   '${s.transactions}',_fg(s.txnGrowth),     true,  Icons.swap_horiz_rounded,             _kCyan),
      _SC('Active Users',   '${s.activeUsers}', '${s.totalUsers} total',  false, Icons.people_alt_rounded,         _kGreen),
      _SC('Active Admins',  '${s.activeAdmins}','${s.totalAdmins} total', false, Icons.admin_panel_settings_rounded,_kPurple),
      _SC('Failed Txns',    '${s.failedTxns}',  '-3.1%',              true,  Icons.error_outline_rounded,          _kRed),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.25,
      ),
      itemBuilder: (context, i) {
        final c = items[i];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _kCard,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: c.color.withOpacity(0.15)),
            boxShadow: [
              BoxShadow(
                color: c.color.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 3),
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(9),
                    decoration: BoxDecoration(
                      color: c.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Icon(c.icon, color: c.color, size: 17),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: (c.growthPos ? _kGreen : _kSubText)
                          .withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(c.growth,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: c.growthPos ? _kGreen : _kSubText,
                        )),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(c.value,
                      style: const TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.bold,
                          color: _kText,
                          letterSpacing: -0.5)),
                  const SizedBox(height: 3),
                  Text(c.title,
                      style: const TextStyle(
                          fontSize: 11, color: _kSubText)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // ── Chart card ───────────────────────────────────────────
  Widget _buildChartCard(List<_ChartPt> data) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _kBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 3),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Revenue & Commission',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: _kText)),
                  const SizedBox(height: 2),
                  Text(_period.label,
                      style: const TextStyle(
                          fontSize: 11, color: _kSubText)),
                ],
              ),
              Row(
                children: [
                  _LegendDot(color: _kPurple, label: 'Revenue'),
                  const SizedBox(width: 14),
                  _LegendDot(color: _kGold, label: 'Commission'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          _RevenueChart(data: data),
        ],
      ),
    );
  }

  // ── Tab bar ──────────────────────────────────────────────
  Widget _buildTabBar() {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: _kCard,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: _kBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.06),
            blurRadius: 6,
            offset: const Offset(0, 2),
          )
        ],
      ),
      padding: const EdgeInsets.all(4),
      child: TabBar(
        controller: _tabCtrl,
        indicator: BoxDecoration(
          color: _kPurple,
          borderRadius: BorderRadius.circular(10),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        labelColor: Colors.white,
        unselectedLabelColor: _kSubText,
        labelStyle:
            const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle:
            const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        tabs: const [
          Tab(text: 'Overview'),
          Tab(text: 'Transactions'),
          Tab(text: 'Activity'),
        ],
      ),
    );
  }

  // ── Tab content switch ───────────────────────────────────
  Widget _buildTabContent(_Report r) {
    switch (_tabCtrl.index) {
      case 0:  return _buildOverviewTab(r);
      case 1:  return _buildTransactionsTab(r.transactions);
      case 2:  return _buildActivityTab(r.adminLogs, r.userLogs);
      default: return const SizedBox.shrink();
    }
  }

  // ════════════════════════════════════════════════════════
  //  TAB 0 — OVERVIEW
  // ════════════════════════════════════════════════════════
  Widget _buildOverviewTab(_Report r) {
    final s         = r.summary;
    final userRate  = s.totalUsers  > 0 ? s.activeUsers  / s.totalUsers  : 0.0;
    final adminRate = s.totalAdmins > 0 ? s.activeAdmins / s.totalAdmins : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Platform Health',
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: _kText)),
        const SizedBox(height: 14),
        _HealthBar(
            label: 'User activation rate',
            value: '${(userRate * 100).toStringAsFixed(0)}%',
            ratio: userRate,
            color: _kGreen),
        const SizedBox(height: 10),
        _HealthBar(
            label: 'Admin activation rate',
            value: '${(adminRate * 100).toStringAsFixed(0)}%',
            ratio: adminRate,
            color: _kPurple),
        const SizedBox(height: 10),
        _HealthBar(
            label: 'Transaction success rate',
            value: '94.8%',
            ratio: 0.948,
            color: _kCyan),
        const SizedBox(height: 26),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Recent Highlights',
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: _kText)),
            Text('${r.transactions.take(4).length} of ${r.transactions.length}',
                style: const TextStyle(fontSize: 11, color: _kSubText)),
          ],
        ),
        const SizedBox(height: 12),
        ...r.transactions.take(4).map((t) {
          final sc = t.status == 'success'
              ? _kGreen
              : t.status == 'failed'
                  ? _kRed
                  : _kGold;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
            decoration: BoxDecoration(
              color: _kCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _kBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.06),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: _kPurple.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(_initials(t.userName),
                      style: const TextStyle(
                          color: _kPurple,
                          fontSize: 11,
                          fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.userName,
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: _kText)),
                      Text(t.createdAt,
                          style: const TextStyle(
                              fontSize: 10, color: _kSubText)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(_fc(t.amount),
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _kText)),
                    const SizedBox(height: 3),
                    Container(
                        width: 7, height: 7,
                        decoration: BoxDecoration(
                            color: sc, shape: BoxShape.circle)),
                  ],
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  // ════════════════════════════════════════════════════════
  //  TAB 1 — TRANSACTIONS
  // ════════════════════════════════════════════════════════
  Widget _buildTransactionsTab(List<_Txn> all) {
    const statuses = ['all', 'success', 'pending', 'failed'];
    final filtered = _txnFilter == 'all'
        ? all
        : all.where((t) => t.status == _txnFilter).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: statuses.map((s) {
              final sel = _txnFilter == s;
              final sc  = s == 'success'
                  ? _kGreen
                  : s == 'failed'
                      ? _kRed
                      : s == 'pending'
                          ? _kGold
                          : _kPurple;
              return GestureDetector(
                onTap: () => setState(() => _txnFilter = s),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: sel ? sc.withOpacity(0.1) : _kCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: sel ? sc : _kBorder),
                  ),
                  child: Text(
                    s[0].toUpperCase() + s.substring(1),
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: sel ? sc : _kSubText),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 14),
        Text('${filtered.length} transactions',
            style: const TextStyle(fontSize: 11, color: _kSubText)),
        const SizedBox(height: 10),
        ...filtered.map((t) {
          final sc = t.status == 'success'
              ? _kGreen
              : t.status == 'failed'
                  ? _kRed
                  : _kGold;
          final tc = t.type == 'credit'
              ? _kGreen
              : t.type == 'debit'
                  ? _kRed
                  : _kCyan;
          final ti = t.type == 'credit'
              ? Icons.arrow_downward_rounded
              : t.type == 'debit'
                  ? Icons.arrow_upward_rounded
                  : Icons.swap_horiz_rounded;

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _kCard,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: _kBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.06),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              children: [
                Stack(
                  children: [
                    Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        color: _kPurple.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(_initials(t.userName),
                          style: const TextStyle(
                              color: _kPurple,
                              fontWeight: FontWeight.bold,
                              fontSize: 12)),
                    ),
                    Positioned(
                      right: 0, bottom: 0,
                      child: Container(
                        width: 16, height: 16,
                        decoration: BoxDecoration(
                          color: tc.withOpacity(0.15),
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: Colors.white, width: 1.5),
                        ),
                        child: Icon(ti, size: 9, color: tc),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.userName,
                          style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: _kText)),
                      const SizedBox(height: 1),
                      Text('${t.id}  •  ${t.adminName}',
                          style: const TextStyle(
                              fontSize: 10, color: _kSubText)),
                      Text(t.createdAt,
                          style: const TextStyle(
                              fontSize: 10, color: _kSubText)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Rs.${t.amount.toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: _kText)),
                    const SizedBox(height: 3),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: sc.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(t.status.toUpperCase(),
                          style: TextStyle(
                              fontSize: 9,
                              color: sc,
                              fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 2),
                    Text('Comm Rs.${t.commission.toStringAsFixed(0)}',
                        style: TextStyle(fontSize: 9, color: _kGold)),
                  ],
                ),
              ],
            ),
          );
        }),
        if (filtered.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 40),
            child: Center(
              child: Text('No transactions found',
                  style: TextStyle(color: _kSubText)),
            ),
          ),
      ],
    );
  }

  // ════════════════════════════════════════════════════════
  //  TAB 2 — ACTIVITY
  // ════════════════════════════════════════════════════════
  Widget _buildActivityTab(List<_Log> adminLogs, List<_Log> userLogs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _ActivitySection(
            icon: Icons.admin_panel_settings_rounded,
            title: 'Admin Activity',
            color: _kPurple,
            logs: adminLogs,
            initials: _initials),
        const SizedBox(height: 24),
        _ActivitySection(
            icon: Icons.person_rounded,
            title: 'User Activity',
            color: _kCyan,
            logs: userLogs,
            initials: _initials),
      ],
    );
  }

  // ── Export sheet ─────────────────────────────────────────
  void _showExportSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: _kCard,
      shape: const RoundedRectangleBorder(
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(24))),
      builder: (BuildContext ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Export Report',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _kText)),
              const SizedBox(height: 4),
              Text('Period: ${_period.label}',
                  style:
                      const TextStyle(fontSize: 12, color: _kSubText)),
              const SizedBox(height: 20),
              _ExportTile(
                icon: Icons.picture_as_pdf_rounded,
                label: 'Export as PDF',
                sub: 'Full report with charts',
                color: _kRed,
                onTap: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text(
                              'PDF export — wire to your backend')));
                },
              ),
              const SizedBox(height: 10),
              _ExportTile(
                icon: Icons.table_chart_rounded,
                label: 'Export as CSV',
                sub: 'Transactions & activity data',
                color: _kGreen,
                onTap: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text(
                              'CSV export — wire to your backend')));
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // ── Loading ──────────────────────────────────────────────
  Widget _buildLoader() => const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: _kPurple),
            SizedBox(height: 16),
            Text('Loading platform report...',
                style: TextStyle(color: _kSubText, fontSize: 14)),
          ],
        ),
      );

  // ── Error ────────────────────────────────────────────────
  Widget _buildError() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.bar_chart_rounded,
                  color: _kSubText.withOpacity(0.3), size: 64),
              const SizedBox(height: 16),
              Text(_error!,
                  textAlign: TextAlign.center,
                  style:
                      const TextStyle(color: _kSubText, fontSize: 14)),
              const SizedBox(height: 24),
              GestureDetector(
                onTap: _fetch,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 28, vertical: 12),
                  decoration: BoxDecoration(
                      color: _kPurple,
                      borderRadius: BorderRadius.circular(12)),
                  child: const Text('Retry',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      );
}

// ════════════════════════════════════════════════════════════
//  PRIVATE WIDGETS
// ════════════════════════════════════════════════════════════

class _RevenueChart extends StatefulWidget {
  final List<_ChartPt> data;
  const _RevenueChart({required this.data});

  @override
  State<_RevenueChart> createState() => _RevenueChartState();
}

class _RevenueChartState extends State<_RevenueChart>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double>   _anim;
  int? _hovered;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 750));
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic);
    _ctrl.forward();
  }

  @override
  void didUpdateWidget(covariant _RevenueChart old) {
    super.didUpdateWidget(old);
    if (old.data != widget.data) {
      _ctrl.reset();
      _ctrl.forward();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  String _fmt(double v) {
    if (v >= 100000) return 'Rs.${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000)   return 'Rs.${(v / 1000).toStringAsFixed(0)}K';
    return 'Rs.${v.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    if (widget.data.isEmpty) return const SizedBox.shrink();
    final maxV = widget.data
        .map((e) => e.revenue)
        .reduce((a, b) => a > b ? a : b);

    return AnimatedBuilder(
      animation: _anim,
      builder: (BuildContext context, Widget? child) {
        return Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_fmt(maxV),
                    style: const TextStyle(
                        fontSize: 10, color: _kSubText)),
                Text(_fmt(maxV / 2),
                    style: const TextStyle(
                        fontSize: 10, color: _kSubText)),
                const Text('Rs.0',
                    style: TextStyle(
                        fontSize: 10, color: _kSubText)),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 140,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: List.generate(widget.data.length, (i) {
                  final pt   = widget.data[i];
                  final revR = maxV > 0 ? pt.revenue    / maxV : 0.0;
                  final comR = maxV > 0 ? pt.commission / maxV : 0.0;
                  final isH  = _hovered == i;

                  return Expanded(
                    child: GestureDetector(
                      onTapDown:   (_) => setState(() => _hovered = i),
                      onTapUp:     (_) => setState(() => _hovered = null),
                      onTapCancel: ()  => setState(() => _hovered = null),
                      child: Padding(
                        padding:
                            const EdgeInsets.symmetric(horizontal: 3),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (isH)
                              Container(
                                margin:
                                    const EdgeInsets.only(bottom: 4),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 3),
                                decoration: BoxDecoration(
                                  color: _kPurple.withOpacity(0.1),
                                  borderRadius:
                                      BorderRadius.circular(6),
                                  border: Border.all(
                                      color: _kPurple.withOpacity(0.3)),
                                ),
                                child: Text(_fmt(pt.revenue),
                                    style: const TextStyle(
                                        fontSize: 9,
                                        color: _kPurple)),
                              ),
                            AnimatedContainer(
                              duration:
                                  const Duration(milliseconds: 200),
                              width: double.infinity,
                              height: 120 * revR * _anim.value,
                              decoration: BoxDecoration(
                                color: isH
                                    ? _kPurple.withOpacity(0.7)
                                    : _kPurple,
                                borderRadius:
                                    const BorderRadius.vertical(
                                        top: Radius.circular(5)),
                              ),
                            ),
                            const SizedBox(height: 2),
                            AnimatedContainer(
                              duration:
                                  const Duration(milliseconds: 200),
                              width: double.infinity,
                              height: (120 * comR * _anim.value)
                                  .clamp(0.0, 28.0),
                              decoration: BoxDecoration(
                                color: _kGold.withOpacity(0.6),
                                borderRadius:
                                    const BorderRadius.vertical(
                                        top: Radius.circular(3)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: widget.data
                  .map((pt) => Expanded(
                        child: Text(pt.label,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 10, color: _kSubText)),
                      ))
                  .toList(),
            ),
          ],
        );
      },
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                  color: color, shape: BoxShape.circle)),
          const SizedBox(width: 5),
          Text(label,
              style: const TextStyle(
                  fontSize: 11, color: _kSubText)),
        ],
      );
}

class _HealthBar extends StatelessWidget {
  final String label, value;
  final double ratio;
  final Color color;

  const _HealthBar({
    required this.label,
    required this.value,
    required this.ratio,
    required this.color,
  });

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: _kSubText)),
              Text(value,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: color)),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: ratio.clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: Colors.grey.withOpacity(0.15),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      );
}

class _ActivitySection extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final List<_Log> logs;
  final String Function(String) initials;

  const _ActivitySection({
    required this.icon,
    required this.title,
    required this.color,
    required this.logs,
    required this.initials,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Icon(icon, color: color, size: 15),
            ),
            const SizedBox(width: 10),
            Text(title,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: _kText)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('${logs.length}',
                  style: TextStyle(
                      fontSize: 10,
                      color: color,
                      fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...logs.map((log) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: _kCard,
                borderRadius: BorderRadius.circular(13),
                border: Border.all(
                  color: log.isWarning
                      ? _kGold.withOpacity(0.3)
                      : _kBorder,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.05),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 38, height: 38,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(initials(log.actorName),
                        style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.bold,
                            fontSize: 12)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(log.actorName,
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: _kText)),
                            if (log.isWarning) ...[
                              const SizedBox(width: 5),
                              const Icon(
                                  Icons.warning_amber_rounded,
                                  color: _kGold,
                                  size: 13),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        RichText(
                          text: TextSpan(children: [
                            TextSpan(
                                text: log.action,
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: _kSubText)),
                            const TextSpan(
                                text: '  →  ',
                                style: TextStyle(
                                    fontSize: 11,
                                    color: _kSubText)),
                            TextSpan(
                                text: log.target,
                                style: TextStyle(
                                    fontSize: 11,
                                    color:
                                        color.withOpacity(0.8))),
                          ]),
                        ),
                      ],
                    ),
                  ),
                  Text(log.createdAt,
                      style: const TextStyle(
                          fontSize: 9, color: _kSubText)),
                ],
              ),
            )),
        if (logs.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(
              child: Text('No activity recorded',
                  style: TextStyle(
                      color: _kSubText, fontSize: 13)),
            ),
          ),
      ],
    );
  }
}

class _ExportTile extends StatelessWidget {
  final IconData icon;
  final String label, sub;
  final Color color;
  final VoidCallback onTap;

  const _ExportTile({
    required this.icon,
    required this.label,
    required this.sub,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.05),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Row(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: color)),
                    Text(sub,
                        style: TextStyle(
                            fontSize: 11,
                            color: color.withOpacity(0.6))),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded,
                  color: color.withOpacity(0.5)),
            ],
          ),
        ),
      );
}

class _SC {
  final String title, value, growth;
  final bool growthPos;
  final IconData icon;
  final Color color;

  _SC(this.title, this.value, this.growth, this.growthPos, this.icon,
      this.color);
}