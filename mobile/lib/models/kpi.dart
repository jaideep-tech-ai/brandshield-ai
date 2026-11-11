class GovernanceKpis {
  final int complianceScore;
  final int totalScanned;
  final int openFindings;
  final int criticalFindings;
  final int approvedAssets;
  final int pendingApprovals;
  final double averageScanTimeSec;

  GovernanceKpis({
    required this.complianceScore,
    required this.totalScanned,
    required this.openFindings,
    required this.criticalFindings,
    required this.approvedAssets,
    required this.pendingApprovals,
    required this.averageScanTimeSec,
  });

  factory GovernanceKpis.initial() {
    return GovernanceKpis(
      complianceScore: 88,
      totalScanned: 14,
      openFindings: 3,
      criticalFindings: 1,
      approvedAssets: 11,
      pendingApprovals: 2,
      averageScanTimeSec: 0.8,
    );
  }

  factory GovernanceKpis.fromJson(Map<String, dynamic> json) {
    return GovernanceKpis(
      complianceScore: json['complianceScore'] ?? 85,
      totalScanned: json['totalScanned'] ?? 0,
      openFindings: json['openFindings'] ?? 0,
      criticalFindings: json['criticalFindings'] ?? 0,
      approvedAssets: json['approvedAssets'] ?? 0,
      pendingApprovals: json['pendingApprovals'] ?? 0,
      averageScanTimeSec: (json['averageScanTimeSec'] as num?)?.toDouble() ?? 0.8,
    );
  }
}

