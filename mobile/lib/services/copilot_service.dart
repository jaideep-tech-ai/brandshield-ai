import 'package:flutter/foundation.dart';
import '../../app/constants.dart';
import '../../core/network/api_client.dart';
import '../../models/chat_message.dart';

class CopilotService extends ChangeNotifier {
  final ApiClient apiClient;
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;

  CopilotService({required this.apiClient}) {
    _initWelcome();
  }

  List<ChatMessage> get messages => List.unmodifiable(_messages);
  bool get isLoading => _isLoading;

  void _initWelcome() {
    _messages.clear();
    _messages.add(
      ChatMessage(
        id: 'welcome',
        role: 'assistant',
        text: '👋 Welcome to **BrandShield AI Copilot**.\n\nI am your enterprise governance assistant connected to your organization\'s verified brand guidelines, approved product claims, and WCAG 2.1 accessibility tokens.\n\nAsk me anything or select a prompt below to get started.',
        timestamp: DateTime.now(),
      ),
    );
  }

  void reset() {
    _initWelcome();
    notifyListeners();
  }

  Future<void> sendMessage(String text, {String lang = 'en'}) async {
    if (text.trim().isEmpty) return;

    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'user',
      text: text.trim(),
      timestamp: DateTime.now(),
    );

    _messages.add(userMsg);
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.post(
        ApiConstants.copilotChat,
        body: {
          'message': text.trim(),
          'lang': lang,
        },
      );

      String replyText = '';
      List<Citation> citations = [];

      if (res is Map<String, dynamic>) {
        replyText = res['reply'] ?? res['response'] ?? res['message'] ?? '';
        if (res['citations'] is List) {
          citations = (res['citations'] as List)
              .map((c) => Citation.fromJson(c as Map<String, dynamic>))
              .toList();
        }
      } else if (res is String) {
        replyText = res;
      }

      if (replyText.isEmpty) {
        replyText = 'No response received. Please check connection.';
      }

      final assistantMsg = ChatMessage(
        id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
        role: 'assistant',
        text: replyText,
        citations: citations,
        timestamp: DateTime.now(),
      );

      _messages.add(assistantMsg);
    } catch (e) {
      _messages.add(
        ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          role: 'assistant',
          text: '⚠️ **Error**: Unable to reach Gemini AI service. $e',
          timestamp: DateTime.now(),
        ),
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

