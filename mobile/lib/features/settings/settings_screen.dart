import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app/constants.dart';
import '../../core/storage/token_storage.dart';
import '../../localization/app_localizations.dart';
import '../../models/user.dart';
import '../../services/auth_service.dart';
import '../../shared/widgets/brand_button.dart';
import '../../shared/widgets/status_badge.dart';
import '../onboarding/mobile_tour_dialog.dart';

class SettingsScreen extends StatefulWidget {
  final Function(String lang)? onLanguageChanged;

  const SettingsScreen({super.key, this.onLanguageChanged});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _endpointController = TextEditingController();
  bool _isSavingEndpoint = false;

  @override
  void initState() {
    super.initState();
    _loadEndpoint();
  }

  Future<void> _loadEndpoint() async {
    final base = await TokenStorage.getBaseUrl();
    _endpointController.text = base ?? ApiConstants.defaultBaseUrl;
  }

  @override
  void dispose() {
    _endpointController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final authService = context.watch<AuthService>();
    final user = authService.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: Text(t.translate('settings_title')),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: BrandColors.primaryDark,
                    child: Text(
                      user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'B',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: BrandColors.pureWhite,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'BrandShield User',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? 'demo@brandshield.ai',
                          style: const TextStyle(
                            fontSize: 12,
                            color: BrandColors.slate500,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            RoleBadge(role: user?.role ?? UserRole.creator),
                            const SizedBox(width: 8),
                            Text(
                              user?.orgName ?? 'Nimbus Labs',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: BrandColors.slate600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Role Switcher Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.translate('settings_switch_role'),
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Experience BrandShield AI from any stakeholder perspective without changing databases.',
                    style: TextStyle(fontSize: 12, color: BrandColors.slate500),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: UserRole.values.map((role) {
                      final isSelected = user?.role == role;
                      return ChoiceChip(
                        label: Text(
                          role.displayName,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? BrandColors.pureWhite : BrandColors.primaryDark,
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: BrandColors.primaryDark,
                        backgroundColor: BrandColors.surfaceLight,
                        onSelected: (selected) {
                          if (selected) {
                            authService.switchRole(role);
                          }
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Language Switcher
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.translate('settings_language'),
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            await TokenStorage.saveLanguage('en');
                            widget.onLanguageChanged?.call('en');
                          },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: t.locale == 'en' ? BrandColors.primaryGreen : BrandColors.borderSubtle,
                              width: t.locale == 'en' ? 2 : 1,
                            ),
                          ),
                          child: const Text('English (EN)'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            await TokenStorage.saveLanguage('hi');
                            widget.onLanguageChanged?.call('hi');
                          },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: t.locale == 'hi' ? BrandColors.primaryGreen : BrandColors.borderSubtle,
                              width: t.locale == 'hi' ? 2 : 1,
                            ),
                          ),
                          child: const Text('हिन्दी (HI)'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Tour & Backend URL
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Application Controls',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  BrandButton(
                    label: t.translate('settings_restart_tour'),
                    icon: Icons.school_outlined,
                    variant: BrandButtonVariant.outline,
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (ctx) => MobileTourDialog(
                          role: user?.role ?? UserRole.creator,
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  Text(
                    t.translate('settings_api_endpoint'),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: BrandColors.slate600),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _endpointController,
                          decoration: const InputDecoration(
                            isDense: true,
                            hintText: 'https://brandshield-ai-five.vercel.app',
                          ),
                          style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: _isSavingEndpoint
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.check, color: BrandColors.primaryGreen),
                        onPressed: () async {
                          final scaffoldMessenger = ScaffoldMessenger.of(context);
                          setState(() => _isSavingEndpoint = true);
                          await TokenStorage.saveBaseUrl(_endpointController.text.trim());
                          if (!mounted) return;
                          setState(() => _isSavingEndpoint = false);
                          scaffoldMessenger.showSnackBar(
                            const SnackBar(content: Text('API endpoint updated successfully')),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Logout Button
          BrandButton(
            label: t.translate('settings_logout'),
            icon: Icons.logout,
            variant: BrandButtonVariant.ghost,
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: Text(t.translate('settings_logout')),
                  content: const Text('Are you sure you want to sign out from BrandShield AI?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(t.translate('cancel'))),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: Text(t.translate('settings_logout'), style: const TextStyle(color: BrandColors.critical)),
                    ),
                  ],
                ),
              );

              if (confirm == true) {
                await authService.logout();
              }
            },
          ),
        ],
      ),
    );
  }
}
