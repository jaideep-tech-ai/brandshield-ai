import 'finding.dart';

class Submission {
  final String id;
  final String title;
  final String assetType;
  final String department;
  final String status; // draft | in_review | approved | changes_requested
  final int? complianceScore;
  final String? copyText;
  final String? imageUrl;
  final String createdAt;
  final String updatedAt;
  final List<Finding> findings;

  Submission({
    required this.id,
    required this.title,
    required this.assetType,
    required this.department,
    required this.status,
    this.complianceScore,
    this.copyText,
    this.imageUrl,
    required this.createdAt,
    required this.updatedAt,
    required this.findings,
  });

  factory Submission.fromJson(Map<String, dynamic> json) {
    final findingsList = (json['findings'] as List<dynamic>?)
            ?.map((f) => Finding.fromJson(f as Map<String, dynamic>))
            .toList() ??
        [];

    return Submission(
      id: json['id'] ?? '',
      title: json['title'] ?? 'Untitled Draft',
      assetType: json['assetType'] ?? 'copy',
      department: json['department'] ?? 'Marketing',
      status: json['status'] ?? 'draft',
      complianceScore: json['complianceScore'],
      copyText: json['copyText'],
      imageUrl: json['imageUrl'],
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
      findings: findingsList,
    );
  }

  int get criticalCount =>
      findings.where((f) => f.severity == FindingSeverity.critical && f.status == 'open').length;

  int get openCount => findings.where((f) => f.status == 'open').length;
}
