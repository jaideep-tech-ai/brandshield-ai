import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';
import '../../models/submission.dart';
import '../../services/approvals_service.dart';
import '../../services/scanner_service.dart';
import '../../shared/widgets/brand_button.dart';
import '../../shared/widgets/status_badge.dart';

class ApprovalsScreen extends StatefulWidget {
  final String currentLang;

  const ApprovalsScreen({super.key, required this.currentLang});

  @override
  State<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends State<ApprovalsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ScannerService>().loadSubmissions();
      context.read<ApprovalsService>().loadAuditHistory();
    });
  }

  void _showRequestChangesDialog(Submission sub) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Request Creator Revisions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Specify changes required before brand sign-off:',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(hintText: 'e.g. Please replace absolute claim with verified FACT PD-09 language'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: BrandColors.criticalRed),
            onPressed: () async {
              final feedback = controller.text.trim();
              if (feedback.isNotEmpty) {
                Navigator.pop(ctx);
                final ok = await context.read<ApprovalsService>().requestChanges(sub.id, feedback: feedback);
                if (ok && mounted) {
                  context.read<ScannerService>().loadSubmissions();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Revision request submitted to creator')),
                  );
                }
              }
            },
            child: const Text('Submit Request'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations(widget.currentLang);
    final scanner = context.watch<ScannerService>();
    final approvals = context.watch<ApprovalsService>();

    final pending = scanner.submissions.where((s) => s.status == 'in_review' || s.status == 'draft').toList();

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
              child: const Icon(Icons.verified_outlined, size: 18, color: BrandColors.primaryTeal),
            ),
            const SizedBox(width: 8),
            Text(t.t('approvals_title')),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              t.t('approvals_sub'),
              style: const TextStyle(fontSize: 12, color: BrandColors.mutedText, height: 1.4),
            ),
            const SizedBox(height: 20),

            // Pending Queue Section
            Text(
              t.t('approvals_queue'),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
            ),
            const SizedBox(height: 10),

            if (pending.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: BrandColors.border),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.check_circle_outline, size: 36, color: BrandColors.successGreen),
                    SizedBox(height: 8),
                    Text(
                      'Approval queue is clear — all submitted assets have been decided!',
                      style: TextStyle(fontSize: 12, color: BrandColors.mutedText),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              )
            else
              ...pending.map((sub) => _buildApprovalCard(sub, t, approvals)),

            const SizedBox(height: 28),

            // Immutable SHA-256 Decision History
            const Text(
              'Cryptographic SHA-256 Decision Ledger',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
            ),
            const SizedBox(height: 10),

            if (approvals.auditHistory.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No decision records logged yet.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ),
              )
            else
              ...approvals.auditHistory.map(
                (rec) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: BrandColors.border),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: rec.decision.contains('APPROV')
                              ? const Color(0xFFECFDF5)
                              : const Color(0xFFFEF2F2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          rec.decision.contains('APPROV') ? Icons.check : Icons.close,
                          size: 16,
                          color: rec.decision.contains('APPROV') ? BrandColors.successGreen : BrandColors.criticalRed,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              rec.submissionTitle,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'By ${rec.reviewerName} · SHA-256: ${rec.sha256Signature.substring(0, 12)}...',
                              style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ),
                      StatusPill(status: rec.decision),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildApprovalCard(Submission sub, AppLocalizations t, ApprovalsService service) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: BrandColors.border),
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
              Expanded(
                child: Text(
                  sub.title,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: BrandColors.darkSlate),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              StatusPill(status: sub.status),
            ],
          ),
          if (sub.copyText != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                sub.copyText!,
                style: const TextStyle(fontSize: 12, color: BrandColors.darkSlate, height: 1.3),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                'Department: ${sub.department}',
                style: const TextStyle(fontSize: 11, color: BrandColors.mutedText),
              ),
              const Spacer(),
              Text(
                'Score: ${sub.complianceScore ?? 85}/100',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: BrandColors.primaryTeal),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: BrandButton(
                  text: t.t('approvals_sign_off'),
                  height: 42,
                  icon: Icons.verified_user,
                  isLoading: service.isLoading,
                  onPressed: () async {
                    final ok = await service.approveSubmission(sub.id);
                    if (ok && mounted) {
                      context.read<ScannerService>().loadSubmissions();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Cryptographic sign-off recorded in SHA-256 ledger')),
                      );
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              BrandButton(
                text: 'Reject',
                variant: BrandButtonVariant.outline,
                height: 42,
                onPressed: () => _showRequestChangesDialog(sub),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
