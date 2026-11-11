import 'package:flutter/material.dart';
import '../../app/constants.dart';

class CitationChip extends StatelessWidget {
  final String documentTitle;
  final int pageNumber;
  final String? ruleTag;
  final VoidCallback? onTap;

  const CitationChip({
    super.key,
    required this.documentTitle,
    required this.pageNumber,
    this.ruleTag,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDFA),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFCCFBF1), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.verified_outlined, size: 13, color: BrandColors.primaryTeal),
            const SizedBox(width: 5),
            Flexible(
              child: Text(
                '$documentTitle · p.$pageNumber${ruleTag != null ? ' · $ruleTag' : ''}',
                style: const TextStyle(
                  color: BrandColors.primaryDark,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
