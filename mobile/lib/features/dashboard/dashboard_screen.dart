import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';
import '../../services/auth_service.dart';
import '../../services/workflow_service.dart';
import '../../shared/widgets/metric_card.dart';
import '../../shared/widgets/status_badge.dart';
import '../../shared/widgets/workflow_stage_tile.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int) onNavigateTab;
  final String currentLang;

  const DashboardScreen({
    super.key,
    required this.onNavigateTab,
    required this.currentLang,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WorkflowService>().refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations(widget.currentLang);
    final auth = context.watch<AuthService>();
    final workflowService = context.watch<WorkflowService>();
    final user = auth.currentUser;
    final kpis = workflowService.kpis;
    final workflowData = workflowService.workflowData;
    final isHindi = widget.currentLang == 'hi';

    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: BrandColors.primaryTeal.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.shield_outlined, size: 18, color: BrandColors.primaryTeal),
            ),
            const SizedBox(width: 8),
            Text(
              user.orgName,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: RoleBadge(role: user.role),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<WorkflowService>().refresh(),
        color: BrandColors.primaryTeal,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Hero Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F766E), Color(0xFF115E59)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: BrandColors.primaryTeal.withValues(alpha: 0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${t.t('dash_welcome')} ${user.name.split(' ')[0]}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.verified_user_outlined, size: 12, color: Colors.white),
                              const SizedBox(width: 4),
                              Text(
                                isHindi ? user.role.displayNameHi : user.role.displayName,
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      t.t('dash_health_sub'),
                      style: const TextStyle(
                        color: Color(0xFFCCFBF1),
                        fontSize: 12,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Governance Index Meter
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.15),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                          ),
                          child: Center(
                            child: Text(
                              '${kpis.complianceScore}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                t.t('dash_health'),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: kpis.complianceScore / 100.0,
                                  backgroundColor: Colors.white.withValues(alpha: 0.2),
                                  valueColor: const AlwaysStoppedAnimation<Color>(BrandColors.accentMint),
                                  minHeight: 6,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // KPI Stats Grid (2x2 on Mobile)
              Row(
                children: [
                  Expanded(
                    child: MetricCard(
                      title: t.t('dash_kpi_score'),
                      value: '${kpis.complianceScore}%',
                      icon: Icons.speed,
                      iconColor: BrandColors.primaryTeal,
                      subtitle: 'Target: >= 85%',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: MetricCard(
                      title: t.t('dash_kpi_critical'),
                      value: '${kpis.criticalFindings}',
                      icon: Icons.shield_outlined,
                      iconColor: BrandColors.criticalRed,
                      subtitle: 'Requires sign-off',
                      onTap: () => widget.onNavigateTab(3), // Navigate to Findings
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: MetricCard(
                      title: t.t('dash_kpi_scanned'),
                      value: '${kpis.totalScanned}',
                      icon: Icons.document_scanner_outlined,
                      iconColor: const Color(0xFF0284C7),
                      subtitle: 'Assets in repo',
                      onTap: () => widget.onNavigateTab(2), // Navigate to Scanner
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: MetricCard(
                      title: t.t('dash_kpi_pending'),
                      value: '${kpis.pendingApprovals}',
                      icon: Icons.checklist_outlined,
                      iconColor: BrandColors.warningAmber,
                      subtitle: 'Queue duration < 24h',
                      onTap: () => widget.onNavigateTab(4), // Navigate to Approvals
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // 7-Stage Brand Governance Journey Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t.t('dash_workflow_title'),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: BrandColors.darkSlate,
                    ),
                  ),
                  if (workflowData != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDFA),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFF99F6E4)),
                      ),
                      child: Text(
                        '${workflowData.completedCount}/${workflowData.totalStages} (${workflowData.percentage}%)',
                        style: const TextStyle(
                          color: BrandColors.primaryTeal,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                t.t('dash_workflow_sub'),
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const SizedBox(height: 12),

              if (workflowData != null && workflowData.stages.isNotEmpty)
                ...workflowData.stages.map(
                  (stage) => WorkflowStageTile(
                    stage: stage,
                    isHindi: isHindi,
                    onTap: () {
                      switch (stage.targetView) {
                        case 'scanner':
                          widget.onNavigateTab(2);
                          break;
                        case 'findings':
                          widget.onNavigateTab(3);
                          break;
                        case 'approvals':
                          widget.onNavigateTab(4);
                          break;
                        case 'copilot':
                          widget.onNavigateTab(1);
                          break;
                        default:
                          widget.onNavigateTab(0);
                      }
                    },
                  ),
                )
              else
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: CircularProgressIndicator(),
                  ),
                ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
