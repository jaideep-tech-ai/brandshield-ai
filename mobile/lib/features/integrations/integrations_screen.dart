import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';

class IntegrationsScreen extends StatelessWidget {
  const IntegrationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(t.translate('integrationsTitle')),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            t.translate('integrationsSubtitle'),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: BrandColors.slate600,
                ),
          ),
          const SizedBox(height: 20),

          // GitLab CI/CD Card
          _IntegrationCard(
            title: t.translate('gitlabTitle'),
            description: t.translate('gitlabDesc'),
            icon: Icons.code,
            iconBg: const Color(0xFFFEE2E2),
            iconColor: const Color(0xFFDC2626),
            badgeText: t.translate('statusConnected'),
            badgeColor: BrandColors.primaryGreen,
            details: [
              'Self-Service OAuth 2.0 flow verified',
              'HMAC-SHA256 signature verification active',
              'Organization tenant isolation: nimbus-labs',
              'Non-blocking MR governance audit checks',
            ],
          ),
          const SizedBox(height: 16),

          // Google Docs Add-on Card
          _IntegrationCard(
            title: t.translate('googleDocsTitle'),
            description: t.translate('googleDocsDesc'),
            icon: Icons.description_outlined,
            iconBg: const Color(0xFFE0E7FF),
            iconColor: const Color(0xFF4338CA),
            badgeText: t.translate('statusActive'),
            badgeColor: BrandColors.primaryGreen,
            details: [
              'Real-time sidebar audit in Google Docs',
              'One-click policy fixes and rewrite injection',
              'Zero data retention compliance mode active',
            ],
          ),
          const SizedBox(height: 16),

          // Figma Design Linter Card
          _IntegrationCard(
            title: t.translate('figmaTitle'),
            description: t.translate('figmaDesc'),
            icon: Icons.palette_outlined,
            iconBg: const Color(0xFFF3E8FF),
            iconColor: const Color(0xFF7E22CE),
            badgeText: t.translate('statusActive'),
            badgeColor: BrandColors.primaryGreen,
            details: [
              'WCAG 2.1 AA/AAA contrast calculation',
              'Automatic color hex discovery in frames',
              'Restricted color palette warning triggers',
            ],
          ),
        ],
      ),
    );
  }
}

class _IntegrationCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String badgeText;
  final Color badgeColor;
  final List<String> details;

  const _IntegrationCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.badgeText,
    required this.badgeColor,
    required this.details,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: iconColor, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.check_circle, size: 12, color: badgeColor),
                          const SizedBox(width: 4),
                          Text(
                            badgeText,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: badgeColor,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: const TextStyle(
                fontSize: 13,
                color: BrandColors.slate600,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: BrandColors.surfaceLight,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: BrandColors.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: details.map((detail) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 4, right: 6),
                          child: Icon(Icons.circle, size: 5, color: BrandColors.primaryGreen),
                        ),
                        Expanded(
                          child: Text(
                            detail,
                            style: const TextStyle(
                              fontSize: 12,
                              color: BrandColors.slate700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
