import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../../app/constants.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/token_storage.dart';
import '../../models/user.dart';

class AuthService extends ChangeNotifier {
  final ApiClient apiClient;
  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  AuthService({required this.apiClient});

  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<bool> init() async {
    _isLoading = true;
    notifyListeners();
    try {
      final savedUserJson = await TokenStorage.getUserJson();
      final token = await TokenStorage.getToken();

      if (savedUserJson != null && token != null) {
        _currentUser = User.fromJson(jsonDecode(savedUserJson));
        // Verify token with backend
        try {
          final res = await apiClient.get(ApiConstants.me);
          if (res is Map<String, dynamic> && res['id'] != null) {
            _currentUser = User.fromJson(res);
            await TokenStorage.saveUserJson(jsonEncode(_currentUser!.toJson()));
          }
        } catch (_) {
          // Keep offline cached user if network fails temporarily
        }
      }
    } catch (e) {
      debugPrint('AuthService init error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return isAuthenticated;
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await apiClient.post(
        ApiConstants.login,
        body: {'email': email, 'password': password},
        requiresAuth: false,
      );

      if (res is Map<String, dynamic>) {
        _currentUser = User.fromJson(res);
        if (_currentUser!.token != null) {
          await TokenStorage.saveToken(_currentUser!.token!);
        }
        await TokenStorage.saveUserJson(jsonEncode(_currentUser!.toJson()));
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw ApiException('Unexpected response format');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> autoLogin(String role) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await apiClient.post(
        ApiConstants.autoLogin,
        body: {'role': role},
        requiresAuth: false,
      );

      if (res is Map<String, dynamic>) {
        _currentUser = User.fromJson(res);
        if (_currentUser!.token != null) {
          await TokenStorage.saveToken(_currentUser!.token!);
        }
        await TokenStorage.saveUserJson(jsonEncode(_currentUser!.toJson()));
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw ApiException('Auto-login failed');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> switchRole(UserRole targetRole) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await apiClient.post(
        ApiConstants.switchRole,
        body: {'targetRole': targetRole.name},
        requiresAuth: true,
      );

      if (res is Map<String, dynamic>) {
        _currentUser = User.fromJson(res);
        if (_currentUser!.token != null) {
          await TokenStorage.saveToken(_currentUser!.token!);
        }
        await TokenStorage.saveUserJson(jsonEncode(_currentUser!.toJson()));
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw ApiException('Role switch failed');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> firebaseSync(String idToken) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await apiClient.post(
        ApiConstants.firebaseSync,
        body: {'idToken': idToken},
        requiresAuth: false,
      );

      if (res is Map<String, dynamic>) {
        _currentUser = User.fromJson(res);
        if (_currentUser!.token != null) {
          await TokenStorage.saveToken(_currentUser!.token!);
        }
        await TokenStorage.saveUserJson(jsonEncode(_currentUser!.toJson()));
        _isLoading = false;
        notifyListeners();
        return true;
      }
      throw ApiException('Firebase sync failed');
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await apiClient.post(ApiConstants.logout, requiresAuth: true);
    } catch (_) {}
    _currentUser = null;
    await TokenStorage.clear();
    notifyListeners();
  }
}
