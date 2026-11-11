import 'package:flutter/foundation.dart';
import '../../core/network/api_client.dart';

class FindingsService extends ChangeNotifier {
  final ApiClient apiClient;
  bool _isLoading = false;

  FindingsService({required this.apiClient});

  bool get isLoading => _isLoading;

  Future<bool> applyFix(String findingId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.post(
        '/api/findings/$findingId/resolve',
        body: {'resolutionType': 'ai_rewrite'},
      );
      _isLoading = false;
      notifyListeners();
      return res is Map;
    } catch (e) {
      debugPrint('Apply fix error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> overrideFinding(String findingId, String justification) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.post(
        '/api/findings/$findingId/override',
        body: {'justification': justification},
      );
      _isLoading = false;
      notifyListeners();
      return res is Map;
    } catch (e) {
      debugPrint('Override finding error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> uploadFixedImage(String findingId, String imageUrl) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.post(
        '/api/findings/$findingId/image',
        body: {'imageUrl': imageUrl},
      );
      _isLoading = false;
      notifyListeners();
      return res is Map;
    } catch (e) {
      debugPrint('Upload image error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
