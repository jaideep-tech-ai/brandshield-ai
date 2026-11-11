import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';
import '../../models/finding.dart';
import '../../services/findings_service.dart';
import '../../services/scanner_service.dart';
import '../../shared/widgets/brand_button.dart';
import '../../shared/widgets/citation_chip.dart';
import '../../shared/widgets/status_badge.dart';

class FindingsScreen extends StatefulWidget {
  final String currentLang;

  const FindingsScreen({super.key, required this.currentLang});

  @override
  State<FindingsScreen> createState() => _FindingsScreenState();
}

class _FindingsScreenState extends State<FindingsScreen> {
  FindingSeverity? _selectedSeverity;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ScannerService>().loadSubmissions();
    });
  }

  void _showOverrideDialog(Finding finding) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Record Compliance Override', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter legal or business justification for audit ledger:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(hintText: 'e.g. Authorized under special enterprise co-marketing agreement'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final justification = controller.text.trim();
              if (justification.isNotEmpty) {
                Navigator.pop(ctx);
                final success = await context.read<FindingsService>().overrideFinding(finding.id, justification);
                if (success && mounted) {
                  context.read<ScannerService>().loadSubmissions();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Override recorded in immutable audit log')),
                  );
                }
              }
            },
            child: const Text('Confirm Override'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations(widget.currentLang);
    final scanner = context.watch<ScannerService>();
    final findingsService = context.watch<FindingsService>();

    // Extract all findings across all submissions
    final allFindings = <Finding>[];
    for (final s in scanner.submissions) {
      allFindings.addAll(s.findings);
    }

    final filtered = _selectedSeverity == null
        ? allFindings
        : allFindings.where((f) => f.severity == _selectedSeverity).toList();

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
              child: const Icon(Icons.rule_folder_outlined, size: 18, color: BrandColors.primaryTeal),
            ),
            const SizedBox(width: 8),
            Text(t.t('findings_title')),
          ],
        ),
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: BrandColors.border)),
            ),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildFilterChip(t.t('findings_filter_all'), null),
                const SizedBox(width: 8),
                _buildFilterChip(t.t('findings_filter_critical'), FindingSeverity.critical),
                const SizedBox(width: 8),
                _buildFilterChip(t.t('findings_filter_warning'), FindingSeverity.warning),
                const SizedBox(width: 8),
                _buildFilterChip(t.t('findings_filter_minor'), FindingSeverity.minor),
              ],
            ),
          ),

          // Findings List
          Expanded(
            child: scanner.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.check_circle_outline, size: 48, color: BrandColors.successGreen),
                            const SizedBox(height: 12),
                            Text(
                              t.t('findings_empty'),
                              style: const TextStyle(fontSize: 13, color: BrandColors.mutedText),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => scanner.loadSubmissions(),
                        child: ListView.builder(
                          padding: const EdgeInsets.all(14),
                          itemCount: filtered.length,
                          itemBuilder: (context, idx) {
                            final finding = filtered[idx];
                            return _buildFindingCard(finding, t, findingsService);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, FindingSeverity? severity) {
    final isSelected = _selectedSeverity == severity;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: isSelected ? Colors.white : BrandColors.darkSlate,
        ),
      ),
      selected: isSelected,
      selectedColor: BrandColors.primaryTeal,
      backgroundColor: const Color(0xFFF1F5F9),
      side: BorderSide.none,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      onSelected: (_) => setState(() => _selectedSeverity = severity),
    );
  }

  Widget _buildFindingCard(Finding finding, AppLocalizations t, FindingsService service) {
    final isResolved = finding.status == 'resolved' || finding.status == 'overridden';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isResolved
              ? const Color(0xFFA7F3D0)
              : finding.severity == FindingSeverity.critical
                  ? const Color(0xFFFECACA)
                  : BrandColors.border,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  SeverityBadge(severity: finding.severity),
                  const SizedBox(width: 8),
                  Text(
                    finding.category,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
                  ),
                ],
              ),
              StatusPill(status: finding.status),
            ],
          ),
          const SizedBox(height: 10),

          // Message
          Text(
            finding.message,
            style: const TextStyle(fontSize: 13, height: 1.4, fontWeight: FontWeight.w500, color: BrandColors.darkSlate),
          ),

          // Evidence Citation
          if (finding.verbatimCitation != null || finding.sourceDoc != null) ...[
            const SizedBox(height: 10),
            CitationChip(
              documentTitle: finding.sourceDoc ?? 'Brand Voice Policy',
              pageNumber: 1,
              ruleTag: finding.ruleTag,
            ),
          ],

          // Recommended Fix
          if (finding.recommendedFix != null && !isResolved) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.auto_fix_high, size: 14, color: BrandColors.successGreen),
                      SizedBox(width: 6),
                      Text(
                        'AI RECOMMENDED REWRITE:',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF166534),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '"${finding.recommendedFix}"',
                    style: const TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                      color: Color(0xFF14532D),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Action Buttons
          if (!isResolved) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: BrandButton(
                    text: t.t('findings_apply_fix'),
                    height: 40,
                    icon: Icons.check,
                    isLoading: service.isLoading,
                    onPressed: () async {
                      final ok = await service.applyFix(finding.id);
                      if (ok && mounted) {
                        context.read<ScannerService>().loadSubmissions();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('AI rewrite applied to draft')),
                        );
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.more_vert, size: 20),
                  onPressed: () => _showOverrideDialog(finding),
                  tooltip: 'Override with justification',
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
