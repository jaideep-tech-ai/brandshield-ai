import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../app/constants.dart';
import '../storage/token_storage.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;

  ApiException(this.message, {this.statusCode, this.code});

  @override
  String toString() => message;
}

class ApiClient {
  String _baseUrl = ApiConstants.defaultBaseUrl;

  ApiClient({String? baseUrl}) {
    if (baseUrl != null && baseUrl.isNotEmpty) {
      _baseUrl = baseUrl;
    }
  }

  Future<void> init() async {
    final customUrl = await TokenStorage.getBaseUrl();
    if (customUrl != null && customUrl.isNotEmpty) {
      _baseUrl = customUrl;
    }
  }

  String get baseUrl => _baseUrl;

  void setBaseUrl(String url) {
    _baseUrl = url.replaceAll(RegExp(r'/+$'), '');
    TokenStorage.saveBaseUrl(_baseUrl);
  }

  Future<Map<String, String>> _headers({bool requiresAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      final token = await TokenStorage.getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  Future<dynamic> get(String endpoint, {bool requiresAuth = true}) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      final headers = await _headers(requiresAuth: requiresAuth);

      final response = await http
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 25));

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network connection error: $e');
    }
  }

  Future<dynamic> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = true,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      final headers = await _headers(requiresAuth: requiresAuth);

      final response = await http
          .post(
            uri,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(seconds: 40));

      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network connection error: $e');
    }
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return response.body;
      }
    }

    String errorMsg = 'HTTP ${response.statusCode}';
    String? errorCode;
    try {
      final json = jsonDecode(response.body);
      if (json is Map) {
        errorMsg = json['error'] ?? json['message'] ?? errorMsg;
        errorCode = json['code'];
      }
    } catch (_) {
      errorMsg = response.body.isNotEmpty ? response.body : errorMsg;
    }

    throw ApiException(errorMsg, statusCode: response.statusCode, code: errorCode);
  }
}

