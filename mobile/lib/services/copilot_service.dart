import 'package:flutter/foundation.dart';
import '../../app/constants.dart';
import '../../core/network/api_client.dart';
import '../../models/chat_message.dart';
import '../../models/chat_session.dart';

class CopilotService extends ChangeNotifier {
  final ApiClient apiClient;
  final List<ChatMessage> _messages = [];
  final List<ChatSession> _sessions = [];
  String? _activeSessionId;
  String _activeSessionTitle = 'New Conversation';
  bool _isLoading = false;
  bool _isFetchingSessions = false;
  String? _errorMessage;

  CopilotService({required this.apiClient}) {
    _initWelcome();
    fetchSessions();
  }

  List<ChatMessage> get messages => List.unmodifiable(_messages);
  List<ChatSession> get sessions => List.unmodifiable(_sessions);
  String? get activeSessionId => _activeSessionId;
  String get activeSessionTitle => _activeSessionTitle;
  bool get isLoading => _isLoading;
  bool get isFetchingSessions => _isFetchingSessions;
  String? get errorMessage => _errorMessage;

  void _initWelcome() {
    _messages.clear();
    _activeSessionId = null;
    _activeSessionTitle = 'New Conversation';
    _errorMessage = null;
    _messages.add(
      ChatMessage(
        id: 'welcome',
        role: 'assistant',
        text: '👋 Welcome to **BrandShield AI Copilot**.\n\nI am your enterprise governance assistant connected to your organization\'s verified brand guidelines, approved product claims, and WCAG 2.1 accessibility tokens.\n\nAsk me anything or select a prompt below to get started.',
        timestamp: DateTime.now(),
      ),
    );
  }

  void startNewSession() {
    _initWelcome();
    notifyListeners();
  }

  void reset() {
    startNewSession();
  }

  /// Fetches all past conversations for the authenticated user
  Future<void> fetchSessions() async {
    _isFetchingSessions = true;
    notifyListeners();

    try {
      final res = await apiClient.get(ApiConstants.copilotChat);
      if (res is List) {
        _sessions.clear();
        for (final item in res) {
          if (item is Map<String, dynamic>) {
            _sessions.add(ChatSession.fromJson(item));
          }
        }
      }
    } catch (e) {
      debugPrint('[CopilotService] Failed to fetch sessions: $e');
    } finally {
      _isFetchingSessions = false;
      notifyListeners();
    }
  }

  /// Loads an existing conversation with full chronological history
  Future<void> loadSession(String id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await apiClient.get('${ApiConstants.copilotChat}?sessionId=$id');
      if (res is Map<String, dynamic>) {
        _activeSessionId = res['id'] as String? ?? id;
        _activeSessionTitle = res['title'] as String? ?? 'Conversation';

        _messages.clear();
        if (res['messages'] is List) {
          final list = res['messages'] as List;
          for (final m in list) {
            if (m is Map<String, dynamic>) {
              List<Citation> citations = [];
              if (m['citations'] is List) {
                citations = (m['citations'] as List)
                    .map((c) => Citation.fromJson(c as Map<String, dynamic>))
                    .toList();
              }
              _messages.add(
                ChatMessage(
                  id: m['id'] as String? ?? UniqueKey().toString(),
                  role: m['role'] as String? ?? 'user',
                  text: m['content'] as String? ?? '',
                  citations: citations,
                  timestamp: m['createdAt'] != null
                      ? DateTime.tryParse(m['createdAt'] as String) ?? DateTime.now()
                      : DateTime.now(),
                ),
              );
            }
          }
        }
      }
    } catch (e) {
      _errorMessage = 'Failed to load conversation: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Deletes an existing chat session with backend authorization
  Future<void> deleteSession(String id) async {
    try {
      await apiClient.delete('${ApiConstants.copilotChat}?sessionId=$id');
      _sessions.removeWhere((s) => s.id == id);
      if (_activeSessionId == id) {
        startNewSession();
      } else {
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[CopilotService] Failed to delete session: $e');
      rethrow;
    }
  }

  /// Renames an existing chat session
  Future<void> renameSession(String id, String newTitle) async {
    final title = newTitle.trim();
    if (title.isEmpty) return;

    try {
      await apiClient.patch(
        ApiConstants.copilotChat,
        body: {'sessionId': id, 'title': title},
      );
      final idx = _sessions.indexWhere((s) => s.id == id);
      if (idx != -1) {
        final old = _sessions[idx];
        _sessions[idx] = ChatSession(
          id: old.id,
          title: title,
          createdAt: old.createdAt,
          updatedAt: DateTime.now(),
          messageCount: old.messageCount,
        );
      }
      if (_activeSessionId == id) {
        _activeSessionTitle = title;
      }
      notifyListeners();
    } catch (e) {
      debugPrint('[CopilotService] Failed to rename session: $e');
      rethrow;
    }
  }

  /// Sends a message, maintaining active session continuity and memory
  Future<void> sendMessage(String text, {String lang = 'en'}) async {
    final cleanText = text.trim();
    if (cleanText.isEmpty) return;

    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'user',
      text: cleanText,
      timestamp: DateTime.now(),
    );

    _messages.add(userMsg);
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final Map<String, dynamic> payload = {
        'message': cleanText,
        'lang': lang,
      };
      if (_activeSessionId != null && _activeSessionId!.isNotEmpty) {
        payload['sessionId'] = _activeSessionId;
      }

      final res = await apiClient.post(
        ApiConstants.copilotChat,
        body: payload,
      );

      String replyText = '';
      List<Citation> citations = [];
      String? returnedSessionId;

      if (res is Map<String, dynamic>) {
        replyText = res['reply'] ?? res['response'] ?? res['message'] ?? '';
        returnedSessionId = res['sessionId'] as String?;
        if (res['citations'] is List) {
          citations = (res['citations'] as List)
              .map((c) => Citation.fromJson(c as Map<String, dynamic>))
              .toList();
        }
      } else if (res is String) {
        replyText = res;
      }

      if (returnedSessionId != null && returnedSessionId.isNotEmpty) {
        _activeSessionId = returnedSessionId;
        if (_activeSessionTitle == 'New Conversation') {
          _activeSessionTitle = cleanText.length > 32 ? '${cleanText.substring(0, 32)}...' : cleanText;
        }
        // Refresh session list in background
        fetchSessions();
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
      _errorMessage = 'Unable to reach Gemini AI service: $e';
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
