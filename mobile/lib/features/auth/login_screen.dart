import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';
import '../../services/auth_service.dart';
import '../../shared/widgets/brand_button.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;
  final Function(String) onLanguageChanged;
  final String currentLang;

  const LoginScreen({
    super.key,
    required this.onLoginSuccess,
    required this.onLanguageChanged,
    required this.currentLang,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'marcus@nimbus.demo');
  final _passwordController = TextEditingController(text: 'NimbusBrand2026!');
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final auth = context.read<AuthService>();
    final success = await auth.login(
      _emailController.text.trim(),
      _passwordController.text.trim(),
    );
    if (success && mounted) {
      widget.onLoginSuccess();
    } else if (mounted && auth.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage!),
          backgroundColor: BrandColors.criticalRed,
        ),
      );
    }
  }

  Future<void> _handleQuickDemo(String role) async {
    final auth = context.read<AuthService>();
    final success = await auth.autoLogin(role);
    if (success && mounted) {
      widget.onLoginSuccess();
    }
  }

  void _showEndpointDialog() {
    final controller = TextEditingController(text: context.read<AuthService>().apiClient.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Backend API Endpoint', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Set BrandShield Next.js backend host:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              decoration: const InputDecoration(hintText: 'https://brandshield-ai-five.vercel.app'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<AuthService>().apiClient.setBaseUrl(controller.text.trim());
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('API base URL updated')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations(widget.currentLang);
    final auth = context.watch<AuthService>();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top bar: Language toggle & API endpoint icon
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.dns_outlined, size: 20, color: BrandColors.mutedText),
                        tooltip: 'Configure Backend URL',
                        onPressed: _showEndpointDialog,
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: BrandColors.border),
                        ),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: () => widget.onLanguageChanged('en'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: widget.currentLang == 'en' ? BrandColors.primaryTeal : Colors.transparent,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  'EN',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: widget.currentLang == 'en' ? Colors.white : BrandColors.mutedText,
                                  ),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () => widget.onLanguageChanged('hi'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: widget.currentLang == 'hi' ? BrandColors.primaryTeal : Colors.transparent,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  'हिंदी',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: widget.currentLang == 'hi' ? Colors.white : BrandColors.mutedText,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Brand Shield Logo Mark
                  Center(
                    child: Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [BrandColors.primaryTeal, Color(0xFF134E4A)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: BrandColors.primaryTeal.withValues(alpha: 0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(Icons.shield_outlined, size: 30, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Text(
                    t.t('app_title'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: BrandColors.darkSlate,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    t.t('tagline'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 12,
                      color: BrandColors.mutedText,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Email Input
                  Text(
                    'Corporate Email',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.mail_outline, size: 18),
                      hintText: 'name@company.com',
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Password Input
                  Text(
                    'Password',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.lock_outline, size: 18),
                      hintText: '••••••••••••',
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off : Icons.visibility,
                          size: 18,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Login CTA Button
                  BrandButton(
                    text: 'Sign In to Workspace',
                    onPressed: _handleLogin,
                    isLoading: auth.isLoading,
                    icon: Icons.login,
                  ),
                  const SizedBox(height: 28),

                  // Divider
                  Row(
                    children: [
                      Expanded(child: Divider(color: Colors.grey.shade300)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'OR TEST EVALUATION PERSONAS',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey.shade500,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      Expanded(child: Divider(color: Colors.grey.shade300)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // 4-Role Quick Evaluation Cards
                  _buildQuickPersona(
                    title: 'Marcus Reed',
                    role: 'Compliance Officer (Reviewer)',
                    color: BrandColors.reviewerAmber,
                    icon: Icons.fact_check_outlined,
                    onTap: () => _handleQuickDemo('reviewer'),
                  ),
                  const SizedBox(height: 8),
                  _buildQuickPersona(
                    title: 'Elena Rodriguez',
                    role: 'Brand Director (Super Admin)',
                    color: BrandColors.adminEmerald,
                    icon: Icons.admin_panel_settings_outlined,
                    onTap: () => _handleQuickDemo('admin'),
                  ),
                  const SizedBox(height: 8),
                  _buildQuickPersona(
                    title: 'Ava Chen',
                    role: 'Content Creator',
                    color: BrandColors.creatorTeal,
                    icon: Icons.brush_outlined,
                    onTap: () => _handleQuickDemo('creator'),
                  ),
                  const SizedBox(height: 8),
                  _buildQuickPersona(
                    title: 'Priya Sharma',
                    role: 'Auditor / Sandbox Viewer',
                    color: BrandColors.contractorOrange,
                    icon: Icons.shield_outlined,
                    onTap: () => _handleQuickDemo('contractor'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickPersona({
    required String title,
    required String role,
    required Color color,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 16, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: BrandColors.darkSlate),
                  ),
                  Text(
                    role,
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward, size: 14, color: Colors.grey.shade400),
          ],
        ),
      ),
    );
  }
}
