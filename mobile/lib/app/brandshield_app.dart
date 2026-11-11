import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'constants.dart';
import '../core/network/api_client.dart';
import '../core/storage/token_storage.dart';
import '../core/theme/brand_theme.dart';
import '../features/analytics/analytics_screen.dart';
import '../features/approvals/approvals_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/copilot/copilot_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/findings/findings_screen.dart';
import '../features/integrations/integrations_screen.dart';
import '../features/knowledge_base/knowledge_screen.dart';
import '../features/onboarding/mobile_tour_dialog.dart';
import '../features/scanner/scanner_screen.dart';
import '../features/settings/settings_screen.dart';
import '../localization/app_localizations.dart';
import '../models/user.dart';
import '../services/approvals_service.dart';
import '../services/auth_service.dart';
import '../services/copilot_service.dart';
import '../services/findings_service.dart';
import '../services/scanner_service.dart';
import '../services/workflow_service.dart';

class BrandShieldApp extends StatefulWidget {
  const BrandShieldApp({super.key});

  @override
  State<BrandShieldApp> createState() => _BrandShieldAppState();
}

class _BrandShieldAppState extends State<BrandShieldApp> {
  String _currentLocale = 'en';
  final _apiClient = ApiClient();

  @override
  void initState() {
    super.initState();
    _loadSavedLanguage();
  }

  Future<void> _loadSavedLanguage() async {
    final lang = await TokenStorage.getLanguage();
    setState(() => _currentLocale = lang);
  }

  void _changeLanguage(String lang) {
    setState(() => _currentLocale = lang);
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService(apiClient: _apiClient)),
        ChangeNotifierProvider(create: (_) => WorkflowService(apiClient: _apiClient)),
        ChangeNotifierProvider(create: (_) => CopilotService(apiClient: _apiClient)),
        ChangeNotifierProvider(create: (_) => ScannerService(apiClient: _apiClient)),
        ChangeNotifierProvider(create: (_) => FindingsService(apiClient: _apiClient)),
        ChangeNotifierProvider(create: (_) => ApprovalsService(apiClient: _apiClient)),
      ],
      child: MaterialApp(
        title: 'BrandShield AI',
        debugShowCheckedModeBanner: false,
        theme: BrandTheme.lightTheme,
        locale: Locale(_currentLocale),
        localizationsDelegates: const [
          AppLocalizations.delegate,
          DefaultWidgetsLocalizations.delegate,
          DefaultMaterialLocalizations.delegate,
        ],
        supportedLocales: const [
          Locale('en'),
          Locale('hi'),
        ],
        home: _RootGate(
          currentLocale: _currentLocale,
          onLanguageChanged: _changeLanguage,
        ),
      ),
    );
  }
}

class _RootGate extends StatefulWidget {
  final String currentLocale;
  final Function(String lang) onLanguageChanged;

  const _RootGate({
    required this.currentLocale,
    required this.onLanguageChanged,
  });

  @override
  State<_RootGate> createState() => _RootGateState();
}

class _RootGateState extends State<_RootGate> {
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _initAuth();
  }

  Future<void> _initAuth() async {
    final authService = context.read<AuthService>();
    await authService.init();
    if (mounted) {
      setState(() => _initialized = true);
      if (authService.isAuthenticated) {
        context.read<WorkflowService>().refresh();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: BrandColors.primaryDark),
        ),
      );
    }

    final authService = context.watch<AuthService>();

    if (!authService.isAuthenticated) {
      return LoginScreen(
        onLoginSuccess: () => setState(() {}),
        onLanguageChanged: widget.onLanguageChanged,
        currentLang: widget.currentLocale,
      );
    }

    return MainShellScreen(
      currentLang: widget.currentLocale,
      onLanguageChanged: widget.onLanguageChanged,
    );
  }
}

class MainShellScreen extends StatefulWidget {
  final String currentLang;
  final Function(String lang) onLanguageChanged;

  const MainShellScreen({
    super.key,
    required this.currentLang,
    required this.onLanguageChanged,
  });

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _selectedTabIndex = 0;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final authService = context.watch<AuthService>();
    final user = authService.currentUser;

    final screens = [
      DashboardScreen(
        onNavigateTab: (idx) => setState(() => _selectedTabIndex = idx),
        currentLang: widget.currentLang,
      ),
      ScannerScreen(
        onNavigateTab: (idx) => setState(() => _selectedTabIndex = idx),
        currentLang: widget.currentLang,
      ),
      FindingsScreen(currentLang: widget.currentLang),
      ApprovalsScreen(currentLang: widget.currentLang),
      CopilotScreen(currentLang: widget.currentLang),
    ];

    return Scaffold(
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(color: BrandColors.primaryDark),
              accountName: Text(
                user?.name ?? 'BrandShield User',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              accountEmail: Text(user?.email ?? 'user@brandshield.ai'),
              currentAccountPicture: CircleAvatar(
                backgroundColor: BrandColors.primaryGreen,
                child: Text(
                  user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'B',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.school_outlined, color: BrandColors.primaryGreen),
              title: const Text('Take the Tour', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('5 crisp role-tailored steps'),
              onTap: () {
                Navigator.pop(context);
                showDialog(
                  context: context,
                  builder: (ctx) => MobileTourDialog(
                    role: user?.role ?? UserRole.creator,
                  ),
                );
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.library_books_outlined),
              title: Text(t.translate('nav_knowledge')),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => KnowledgeScreen(currentLang: widget.currentLang)),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.bar_chart_outlined),
              title: Text(t.translate('nav_analytics')),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AnalyticsScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.integration_instructions_outlined),
              title: Text(t.translate('nav_integrations')),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const IntegrationsScreen()),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: Text(t.translate('nav_settings')),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => SettingsScreen(
                      onLanguageChanged: widget.onLanguageChanged,
                    ),
                  ),
                );
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: BrandColors.critical),
              title: Text(
                t.translate('settings_logout'),
                style: const TextStyle(color: BrandColors.critical),
              ),
              onTap: () {
                Navigator.pop(context);
                authService.logout();
              },
            ),
          ],
        ),
      ),
      body: IndexedStack(
        index: _selectedTabIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedTabIndex,
        onTap: (index) => setState(() => _selectedTabIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: BrandColors.primaryDark,
        unselectedItemColor: BrandColors.slate400,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.dashboard_outlined),
            activeIcon: const Icon(Icons.dashboard),
            label: t.translate('nav_dashboard'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.document_scanner_outlined),
            activeIcon: const Icon(Icons.document_scanner),
            label: t.translate('nav_scanner'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.rule_folder_outlined),
            activeIcon: const Icon(Icons.rule_folder),
            label: t.translate('nav_findings'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.verified_user_outlined),
            activeIcon: const Icon(Icons.verified_user),
            label: t.translate('nav_approvals'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.chat_bubble_outline),
            activeIcon: const Icon(Icons.chat_bubble),
            label: t.translate('nav_copilot'),
          ),
        ],
      ),
    );
  }
}
