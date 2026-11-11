import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../models/finding.dart';
import '../../models/user.dart';

class RoleBadge extends StatelessWidget {
  final UserRole role;

  const RoleBadge({super.key, required this.role});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color border;
    Color text;

    switch (role) {
      case UserRole.admin:
        bg = const Color(0xFFECFDF5);
        border = const Color(0xFFA7F3D0);
        text = BrandColors.adminEmerald;
        break;
      case UserRole.reviewer:
        bg = const Color(0xFFFFFBEB);
        border = const Color(0xFFFDE68A);
        text = BrandColors.reviewerAmber;
        break;
      case UserRole.creator:
        bg = const Color(0xFFF0FDFA);
        border = const Color(0xFF99F6E4);
        text = BrandColors.creatorTeal;
        break;
      case UserRole.contractor:
        bg = const Color(0xFFFFF7ED);
        border = const Color(0xFFFED7AA);
        text = BrandColors.contractorOrange;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1),
      ),
      child: Text(
        role.name.toUpperCase(),
        style: TextStyle(
          color: text,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class SeverityBadge extends StatelessWidget {
  final FindingSeverity severity;

  const SeverityBadge({super.key, required this.severity});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color border;
    Color text;

    switch (severity) {
      case FindingSeverity.critical:
        bg = const Color(0xFFFEF2F2);
        border = const Color(0xFFFECACA);
        text = BrandColors.criticalRed;
        break;
      case FindingSeverity.warning:
        bg = const Color(0xFFFFFBEB);
        border = const Color(0xFFFDE68A);
        text = BrandColors.warningAmber;
        break;
      case FindingSeverity.minor:
        bg = const Color(0xFFEFF6FF);
        border = const Color(0xFFBFDBFE);
        text = BrandColors.minorBlue;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(5),
        border: Border.all(color: border, width: 1),
      ),
      child: Text(
        severity.label,
        style: TextStyle(
          color: text,
          fontSize: 9.5,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.4,
        ),
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  final String status;

  const StatusPill({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg = const Color(0xFFF1F5F9);
    Color text = const Color(0xFF475569);

    final clean = status.toLowerCase();
    if (clean == 'approved') {
      bg = const Color(0xFFECFDF5);
      text = BrandColors.successGreen;
    } else if (clean == 'in_review') {
      bg = const Color(0xFFFFFBEB);
      text = BrandColors.warningAmber;
    } else if (clean == 'changes_requested') {
      bg = const Color(0xFFFEF2F2);
      text = BrandColors.criticalRed;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status.replaceAll('_', ' ').toUpperCase(),
        style: TextStyle(
          color: text,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

