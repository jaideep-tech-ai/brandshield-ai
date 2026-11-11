class ChatSession {
  final String id;
  final String title;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int messageCount;

  const ChatSession({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.updatedAt,
    this.messageCount = 0,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    int count = 0;
    if (json['_count'] is Map && json['_count']['messages'] is int) {
      count = json['_count']['messages'] as int;
    } else if (json['messages'] is List) {
      count = (json['messages'] as List).length;
    }

    return ChatSession(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Conversation',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      messageCount: count,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
        'messageCount': messageCount,
      };
}
