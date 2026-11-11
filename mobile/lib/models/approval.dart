class ApprovalRecord {
  final String id;
  final String submissionId;
  final String submissionTitle;
  final String reviewerName;
  final String decision; // APPROVED | CHANGES_REQUESTED
  final String sha256Signature;
  final String createdAt;
  final String? justification;

  ApprovalRecord({
    required this.id,
    required this.submissionId,
    required this.submissionTitle,
    required this.reviewerName,
    required this.decision,
    required this.sha256Signature,
    required this.createdAt,
    this.justification,
  });

  factory ApprovalRecord.fromJson(Map<String, dynamic> json) {
    return ApprovalRecord(
      id: json['id'] ?? '',
      submissionId: json['submissionId'] ?? '',
      submissionTitle: json['submissionTitle'] ?? json['submission']?['title'] ?? 'Asset Submission',
      reviewerName: json['reviewerName'] ?? json['user']?['name'] ?? 'Authorized Reviewer',
      decision: json['decision'] ?? json['action'] ?? 'APPROVED',
      sha256Signature: json['sha256Signature'] ?? json['sha256'] ?? 'a3b8c9d1...f89e2',
      createdAt: json['createdAt'] ?? '',
      justification: json['justification'] ?? json['notes'],
    );
  }
}
