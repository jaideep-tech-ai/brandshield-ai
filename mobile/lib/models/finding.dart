enum FindingSeverity {
  critical,
  warning,
  minor;

  static FindingSeverity fromString(String? val) {
    switch (val?.toLowerCase()) {
      case 'critical':
        return FindingSeverity.critical;
      case 'warning':
        return FindingSeverity.warning;
      case 'minor':
      default:
        return FindingSeverity.minor;
    }
  }

  String get label {
    switch (this) {
      case FindingSeverity.critical:
        return 'CRITICAL';
      case FindingSeverity.warning:
        return 'WARNING';
      case FindingSeverity.minor:
        return 'STYLE';
    }
  }
}

class Finding {
  final String id;
  final String submissionId;
  final String category;
  final FindingSeverity severity;
  final String message;
  final String? verbatimCitation;
  final String? ruleTag;
  final String? sourceDoc;
  final String? recommendedFix;
  final String status; // open | resolved | overridden
  final double confidence;

  Finding({
    required this.id,
    required this.submissionId,
    required this.category,
    required this.severity,
    required this.message,
    this.verbatimCitation,
    this.ruleTag,
    this.sourceDoc,
    this.recommendedFix,
    required this.status,
    required this.confidence,
  });

  bool get isOpen => status == 'open';
  String get ruleCitation => verbatimCitation ?? ruleTag ?? '';

  factory Finding.fromJson(Map<String, dynamic> json) {
    return Finding(
      id: json['id'] ?? '',
      submissionId: json['submissionId'] ?? '',
      category: json['category'] ?? 'Claim',
      severity: FindingSeverity.fromString(json['severity']),
      message: json['message'] ?? json['flaggedText'] ?? json['rationale'] ?? '',
      verbatimCitation: json['verbatimCitation'] ?? json['ruleCitation'],
      ruleTag: json['ruleTag'] ?? json['category'],
      sourceDoc: json['sourceDoc'] ?? json['documentTitle'],
      recommendedFix: json['recommendedFix'] ?? json['suggestion'] ?? json['suggestedReplacement'],
      status: json['status'] ?? 'open',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.95,
    );
  }
}
