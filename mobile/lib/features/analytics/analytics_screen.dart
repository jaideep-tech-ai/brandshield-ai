import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';
import '../../services/workflow_service.dart';
import '../../shared/widgets/metric_card.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final workflowService = context.watch<WorkflowService>();
    final kpis = workflowService.kpis;

    return Scaffold(
      appBar: AppBar(
        title: Text(t.translate('analyticsTitle')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => workflowService.refresh(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => workflowService.refresh(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Top overview metrics
            Row(
              children: [
                Expanded(
                  child: MetricCard(
                    title: t.translate('metricHealth'),
                    value: '${kpis.complianceScore}%',
                    subtitle: '+3.2% vs last week',
                    icon: Icons.health_and_safety_outlined,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricCard(
                    title: t.translate('metricAvgScore'),
                    value: '${kpis.complianceScore}%',
                    subtitle: 'Target: >90%',
                    icon: Icons.speed_outlined,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: MetricCard(
                    title: t.translate('metricViolations'),
                    value: '${kpis.openFindings}',
                    icon: Icons.shield_outlined,
                    iconColor: BrandColors.warning,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricCard(
                    title: t.translate('metricProtected'),
                    value: '${kpis.approvedAssets}',
                    icon: Icons.verified_user_outlined,
                    iconColor: BrandColors.primaryGreen,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Department Compliance Breakdown
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t.translate('deptBreakdownTitle'),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      t.translate('deptBreakdownSubtitle'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 16),
                    const _DepartmentBar(name: 'Content Studio', score: 96, count: 12),
                    const _DepartmentBar(name: 'Product Marketing', score: 92, count: 8),
                    const _DepartmentBar(name: 'Agency Sandbox', score: 78, count: 5),
                    const _DepartmentBar(name: 'Legal & Executive', score: 100, count: 3),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Top Friction Rules
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t.translate('frictionRulesTitle'),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      t.translate('frictionRulesSubtitle'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 16),
                    const _RuleItem(
                      rule: 'RULE TM-01: Trademark glyphs (§3.1)',
                      category: 'Trademark',
                      frequency: '18 triggers',
                      severity: 'Warning',
                      color: BrandColors.warning,
                    ),
                    const _RuleItem(
                      rule: 'FACT PD-05: 14 regional banking partners',
                      category: 'Fact Claims',
                      frequency: '11 triggers',
                      severity: 'Critical',
                      color: BrandColors.critical,
                    ),
                    const _RuleItem(
                      rule: 'WCAG 2.1: Minimum 4.5:1 text contrast',
                      category: 'Visual Design',
                      frequency: '7 triggers',
                      severity: 'Warning',
                      color: BrandColors.warning,
                    ),
                    const _RuleItem(
                      rule: 'Banned terms: "guaranteed", "risk-free"',
                      category: 'Style & Legal',
                      frequency: '5 triggers',
                      severity: 'Minor',
                      color: BrandColors.slate500,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // SHA-256 Audit Trail Card
            Card(
              color: BrandColors.surfaceLight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.lock_clock_outlined, size: 20, color: BrandColors.primaryGreen),
                        const SizedBox(width: 8),
                        Text(
                          t.translate('immutableLedgerTitle'),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t.translate('immutableLedgerSubtitle'),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: BrandColors.pureWhite,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: BrandColors.borderSubtle),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'LATEST BLOCK SHA-256:',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.1,
                              color: BrandColors.slate500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const SelectableText(
                            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                            style: TextStyle(
                              fontSize: 11,
                              fontFamily: 'monospace',
                              color: BrandColors.primaryDark,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Row(
                            children: [
                              Icon(Icons.verified, size: 14, color: BrandColors.primaryGreen),
                              SizedBox(width: 4),
                              Text(
                                'Chain Verified · Zero Data Retention (ZDR) Active',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: BrandColors.primaryGreen,
                                  fontWeight: FontWeight.bold,
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
          ],
        ),
      ),
    );
  }
}

class _DepartmentBar extends StatelessWidget {
  final String name;
  final int score;
  final int count;

  const _DepartmentBar({
    required this.name,
    required this.score,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    final color = score >= 90
        ? BrandColors.primaryGreen
        : score >= 75
            ? BrandColors.warning
            : BrandColors.critical;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: BrandColors.primaryDark,
                ),
              ),
              Text(
                '$score% ($count scans)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: score / 100,
              minHeight: 8,
              backgroundColor: BrandColors.slate200,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}

class _RuleItem extends StatelessWidget {
  final String rule;
  final String category;
  final String frequency;
  final String severity;
  final Color color;

  const _RuleItem({
    required this.rule,
    required this.category,
    required this.frequency,
    required this.severity,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 2),
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(Icons.rule, size: 16, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  rule,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: BrandColors.primaryDark,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      category,
                      style: const TextStyle(
                        fontSize: 11,
                        color: BrandColors.slate500,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 3,
                      height: 3,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: BrandColors.slate400,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      frequency,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
