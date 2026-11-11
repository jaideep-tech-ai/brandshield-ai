import 'package:flutter/foundation.dart';
import '../../app/constants.dart';
import '../../core/network/api_client.dart';
import '../../models/submission.dart';

class ScannerService extends ChangeNotifier {
  final ApiClient apiClient;
  List<Submission> _submissions = [];
  bool _isLoading = false;
  bool _isScanning = false;
  double _scanProgress = 0.0;

  ScannerService({required this.apiClient});

  List<Submission> get submissions => List.unmodifiable(_submissions);
  bool get isLoading => _isLoading;
  bool get isScanning => _isScanning;
  double get scanProgress => _scanProgress;

  Future<void> loadSubmissions() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.get(ApiConstants.submissions);
      if (res is List) {
        _submissions = res
            .map((s) => Submission.fromJson(s as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('Load submissions error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Submission?> runScan({
    required String title,
    String? copyText,
    String? imageUrl,
  }) async {
    _isScanning = true;
    _scanProgress = 0.15;
    notifyListeners();

    try {
      // Step 1: Create submission draft
      _scanProgress = 0.40;
      notifyListeners();

      final createRes = await apiClient.post(
        ApiConstants.submissions,
        body: {
          'title': title,
          'assetType': imageUrl != null ? 'banner' : 'copy',
          'copyText': copyText,
          'imageUrl': imageUrl,
          'department': 'Marketing',
        },
      );

      if (createRes is! Map<String, dynamic> || createRes['id'] == null) {
        throw ApiException('Failed to create scan draft');
      }

      final submissionId = createRes['id'];

      // Step 2: Trigger audit scan
      _scanProgress = 0.75;
      notifyListeners();

      final scanRes = await apiClient.post(
        '${ApiConstants.submissions}/$submissionId/scan',
        body: {},
      );

      _scanProgress = 1.0;
      notifyListeners();

      Submission? result;
      if (scanRes is Map<String, dynamic>) {
        result = Submission.fromJson(scanRes);
        _submissions.insert(0, result);
      } else {
        await loadSubmissions();
        result = _submissions.firstWhere(
          (s) => s.id == submissionId,
          orElse: () => Submission.fromJson(createRes),
        );
      }

      return result;
    } catch (e) {
      debugPrint('Run scan error: $e');
      rethrow;
    } finally {
      _isScanning = false;
      _scanProgress = 0.0;
      notifyListeners();
    }
  }
}

