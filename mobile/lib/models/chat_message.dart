class Citation {
  final String documentTitle;
  final int pageNumber;
  final String? ruleTag;
  final String textSnippet;

  Citation({
    required this.documentTitle,
    required this.pageNumber,
    this.ruleTag,
    required this.textSnippet,
  });

  factory Citation.fromJson(Map<String, dynamic> json) {
    return Citation(
      documentTitle: json['documentTitle'] ?? 'Brand Guideline',
      pageNumber: json['pageNumber'] ?? 1,
      ruleTag: json['ruleTag'],
      textSnippet: json['textSnippet'] ?? '',
    );
  }
}

class ChatMessage {
  final String id;
  final String role; // 'user' | 'assistant'
  final String text;
  final List<Citation> citations;
  final DateTime timestamp;
  final bool isStreaming;

  ChatMessage({
    required this.id,
    required this.role,
    required this.text,
    this.citations = const [],
    required this.timestamp,
    this.isStreaming = false,
  });

  bool get isUser => role == 'user';
}
