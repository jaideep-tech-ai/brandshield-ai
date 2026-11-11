import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../localization/app_localizations.dart';
import '../../models/user.dart';
import '../../shared/widgets/brand_button.dart';

class TourStepData {
  final String title;
  final String description;
  final IconData icon;

  const TourStepData({
    required this.title,
    required this.description,
    required this.icon,
  });
}

class MobileTourDialog extends StatefulWidget {
  final UserRole role;

  const MobileTourDialog({super.key, required this.role});

  @override
  State<MobileTourDialog> createState() => _MobileTourDialogState();
}

class _MobileTourDialogState extends State<MobileTourDialog> {
  int _currentIndex = 0;

  List<TourStepData> _getSteps(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return const [
          TourStepData(
            title: 'Governance Health & KPIs',
            description: 'Monitor real-time compliance health across all marketing campaigns and agency sandboxes.',
            icon: Icons.speed_outlined,
          ),
          TourStepData(
            title: 'Knowledge Base & Rules',
            description: 'Ingest company guidelines, product facts, and WCAG design tokens into the ground-truth repository.',
            icon: Icons.library_books_outlined,
          ),
          TourStepData(
            title: 'Multi-Modal Asset Scanner',
            description: 'Test promotional copy and visual banner images with sub-100ms deterministic rules and vision AI.',
            icon: Icons.document_scanner_outlined,
          ),
          TourStepData(
            title: 'Explainable Findings Desk',
            description: 'Review policy violations with verbatim citations and apply instant AI-generated rewrites.',
            icon: Icons.rule_folder_outlined,
          ),
          TourStepData(
            title: 'Immutable SHA-256 Approvals',
            description: 'Inspect cryptographic sign-offs and verify the tamper-evident audit ledger before publishing.',
            icon: Icons.verified_user_outlined,
          ),
        ];

      case UserRole.reviewer:
        return const [
          TourStepData(
            title: 'Priority Review Queue',
            description: 'Longest-waiting submissions rise to the top so critical marketing campaigns never stall.',
            icon: Icons.format_list_bulleted,
          ),
          TourStepData(
            title: 'Ground-Truth Citations',
            description: 'Verify flagged text against verbatim quotes from your company fact sheets and trademark guidelines.',
            icon: Icons.menu_book_outlined,
          ),
          TourStepData(
            title: 'Side-by-Side Diff & Inspection',
            description: 'Compare original draft copy with suggested fixes and inspect WCAG color contrast ratios.',
            icon: Icons.compare_arrows_outlined,
          ),
          TourStepData(
            title: 'One-Click AI Rewrites',
            description: 'Accept automated policy fixes that resolve violations while strictly preserving creator voice.',
            icon: Icons.auto_awesome,
          ),
          TourStepData(
            title: 'Sign-Off or Request Changes',
            description: 'Authorize campaign launch with SHA-256 cryptographic signature or send back with feedback.',
            icon: Icons.approval_outlined,
          ),
        ];

      case UserRole.creator:
        return const [
          TourStepData(
            title: 'Content Studio & Composer',
            description: 'Draft marketing copy, headlines, and upload banner creative directly in your creator workspace.',
            icon: Icons.edit_note,
          ),
          TourStepData(
            title: 'Instant Pre-Flight Audit',
            description: 'Run automated scans before submitting. Detect banned terms and unsupported claims in milliseconds.',
            icon: Icons.flash_on_outlined,
          ),
          TourStepData(
            title: 'One-Click Policy Fixes',
            description: 'Apply AI rewrites with one tap. Every suggestion fixes the rule without altering your creative tone.',
            icon: Icons.auto_fix_high,
          ),
          TourStepData(
            title: 'Track Pipeline Progress',
            description: 'Watch your draft move from pre-flight scan through reviewer approval to final verified sign-off.',
            icon: Icons.timeline,
          ),
          TourStepData(
            title: 'Consult AI Copilot Anytime',
            description: 'Ask questions about tone, claim rules, or color contrast directly to your Gemini-powered Copilot.',
            icon: Icons.chat_bubble_outline,
          ),
        ];

      case UserRole.contractor:
        return const [
          TourStepData(
            title: 'Isolated Client Sandbox',
            description: 'Work securely in a zero-data-retention sandbox. Pre-check client deliverables without risking live policies.',
            icon: Icons.security_outlined,
          ),
          TourStepData(
            title: 'Client Guidelines & Standards',
            description: 'Inspect ground-truth product facts, approved naming rules, and brand color palette requirements.',
            icon: Icons.folder_shared_outlined,
          ),
          TourStepData(
            title: 'Asset Pre-Flight Testing',
            description: 'Test all agency copy and visual banner creative against client rules before official handover.',
            icon: Icons.fact_check_outlined,
          ),
          TourStepData(
            title: 'Self-Remediation & Fixes',
            description: 'Resolve high-impact violations with automated AI rewrites to guarantee zero-friction handoff.',
            icon: Icons.build_circle_outlined,
          ),
          TourStepData(
            title: 'Compliance Reports & Handover',
            description: 'View objective compliance metrics and submit verified work directly to client review desks.',
            icon: Icons.cloud_done_outlined,
          ),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final steps = _getSteps(widget.role);
    final isLast = _currentIndex == steps.length - 1;
    final currentStep = steps[_currentIndex];

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with role tag & step counter
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: BrandColors.surfaceLight,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: BrandColors.borderSubtle),
                  ),
                  child: Text(
                    '${widget.role.displayName.toUpperCase()} TOUR',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                      color: BrandColors.slate600,
                    ),
                  ),
                ),
                Text(
                  'Step ${_currentIndex + 1} of ${steps.length}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: BrandColors.primaryGreen,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Step Progress Bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (_currentIndex + 1) / steps.length,
                minHeight: 6,
                backgroundColor: BrandColors.slate200,
                valueColor: const AlwaysStoppedAnimation<Color>(BrandColors.primaryGreen),
              ),
            ),
            const SizedBox(height: 20),

            // Step Icon & Title
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: BrandColors.primaryGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    currentStep.icon,
                    size: 26,
                    color: BrandColors.primaryGreen,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    currentStep.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: BrandColors.primaryDark,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Step Description
            Text(
              currentStep.description,
              style: const TextStyle(
                fontSize: 13,
                height: 1.5,
                color: BrandColors.slate600,
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            Row(
              children: [
                if (_currentIndex > 0)
                  Expanded(
                    child: BrandButton(
                      label: t.translate('tour_btn_back'),
                      variant: BrandButtonVariant.outline,
                      onPressed: () {
                        setState(() => _currentIndex -= 1);
                      },
                    ),
                  )
                else
                  Expanded(
                    child: BrandButton(
                      label: t.translate('tour_btn_skip'),
                      variant: BrandButtonVariant.ghost,
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: BrandButton(
                    label: isLast ? t.translate('tour_btn_finish') : t.translate('tour_btn_next'),
                    icon: isLast ? Icons.check_circle : Icons.arrow_forward,
                    variant: BrandButtonVariant.primary,
                    onPressed: () {
                      if (isLast) {
                        Navigator.pop(context);
                      } else {
                        setState(() => _currentIndex += 1);
                      }
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
