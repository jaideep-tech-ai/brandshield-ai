import 'package:flutter/foundation.dart';
import '../../app/constants.dart';
import '../../core/network/api_client.dart';
import '../../models/approval.dart';

class ApprovalsService extends ChangeNotifier {
  final ApiClient apiClient;
  List<ApprovalRecord> _auditHistory = [];
  bool _isLoading = false;

  ApprovalsService({required this.apiClient});

  List<ApprovalRecord> get auditHistory => List.unmodifiable(_auditHistory);
  bool get isLoading => _isLoading;

  Future<void> loadAuditHistory() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.get('/api/audit');
      if (res is List) {
        _auditHistory = res
            .map((a) => ApprovalRecord.fromJson(a as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('Load audit history error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> approveSubmission(String submissionId, {String? notes}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.post(
        '${ApiConstants.submissions}/$submissionId/transition',
        body: {
          'action': 'APPROVED',
          'notes': notes ?? 'Approved through BrandShield AI mobile application.',
        },
      );
      await loadAuditHistory();
      return res is Map;
    } catch (e) {
      debugPrint('Approve error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> requestChanges(String submissionId, {required String feedback}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.post(
        '${ApiConstants.submissions}/$submissionId/transition',
        body: {
          'action': 'CHANGES_REQUESTED',
          'notes': feedback,
        },
      );
      await loadAuditHistory();
      return res is Map;
    } catch (e) {
      debugPrint('Request changes error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
