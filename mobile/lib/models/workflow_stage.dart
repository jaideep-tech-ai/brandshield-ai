class WorkflowStage {
  final int id;
  final String key;
  final String name;
  final String nameHi;
  final String description;
  final String descriptionHi;
  final bool completed;
  final bool current;
  final int count;
  final String detail;
  final String detailHi;
  final String targetView;

  WorkflowStage({
    required this.id,
    required this.key,
    required this.name,
    required this.nameHi,
    required this.description,
    required this.descriptionHi,
    required this.completed,
    required this.current,
    required this.count,
    required this.detail,
    required this.detailHi,
    required this.targetView,
  });

  factory WorkflowStage.fromJson(Map<String, dynamic> json) {
    return WorkflowStage(
      id: json['id'] ?? 1,
      key: json['key'] ?? '',
      name: json['name'] ?? '',
      nameHi: json['nameHi'] ?? json['name'] ?? '',
      description: json['description'] ?? '',
      descriptionHi: json['descriptionHi'] ?? json['description'] ?? '',
      completed: json['completed'] ?? false,
      current: json['current'] ?? false,
      count: json['count'] ?? 0,
      detail: json['detail'] ?? '',
      detailHi: json['detailHi'] ?? json['detail'] ?? '',
      targetView: json['targetView'] ?? 'dashboard',
    );
  }
}

class WorkflowData {
  final int totalStages;
  final int completedCount;
  final int percentage;
  final List<WorkflowStage> stages;

  WorkflowData({
    required this.totalStages,
    required this.completedCount,
    required this.percentage,
    required this.stages,
  });

  factory WorkflowData.fromJson(Map<String, dynamic> json) {
    final list = (json['stages'] as List<dynamic>?)
            ?.map((s) => WorkflowStage.fromJson(s as Map<String, dynamic>))
            .toList() ??
        [];

    return WorkflowData(
      totalStages: json['totalStages'] ?? list.length,
      completedCount: json['completedCount'] ?? 0,
      percentage: json['percentage'] ?? 0,
      stages: list,
    );
  }
}

