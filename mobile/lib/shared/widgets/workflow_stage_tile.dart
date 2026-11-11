import 'package:flutter/material.dart';
import '../../app/constants.dart';
import '../../models/workflow_stage.dart';

class WorkflowStageTile extends StatelessWidget {
  final WorkflowStage stage;
  final bool isHindi;
  final VoidCallback onTap;

  const WorkflowStageTile({
    super.key,
    required this.stage,
    required this.isHindi,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color borderColor = BrandColors.border;
    Color bgColor = Colors.white;

    if (stage.completed) {
      borderColor = const Color(0xFFA7F3D0);
      bgColor = const Color(0xFFF0FDF4);
    } else if (stage.current) {
      borderColor = const Color(0xFF5EEAD4);
      bgColor = const Color(0xFFF0FDFA);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: borderColor,
          width: stage.current ? 1.5 : 1.0,
        ),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        leading: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: stage.completed
                ? BrandColors.successGreen
                : stage.current
                    ? BrandColors.primaryTeal
                    : const Color(0xFFE2E8F0),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: stage.completed
                ? const Icon(Icons.check, size: 18, color: Colors.white)
                : Text(
                    '${stage.id}',
                    style: TextStyle(
                      color: stage.current ? Colors.white : const Color(0xFF64748B),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
          ),
        ),
        title: Text(
          isHindi ? stage.nameHi : stage.name,
          style: const TextStyle(
            color: BrandColors.darkSlate,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(
              isHindi ? stage.descriptionHi : stage.description,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 11,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                isHindi ? stage.detailHi : stage.detail,
                style: const TextStyle(
                  color: Color(0xFF475569),
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ],
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          size: 14,
          color: Color(0xFF94A3B8),
        ),
      ),
    );
  }
}

