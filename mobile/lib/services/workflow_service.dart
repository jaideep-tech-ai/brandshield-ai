import 'package:flutter/foundation.dart';
import '../../app/constants.dart';
import '../../core/network/api_client.dart';
import '../../models/kpi.dart';
import '../../models/workflow_stage.dart';

class WorkflowService extends ChangeNotifier {
  final ApiClient apiClient;
  WorkflowData? _workflowData;
  GovernanceKpis _kpis = GovernanceKpis.initial();
  bool _isLoading = false;

  WorkflowService({required this.apiClient});

  WorkflowData? get workflowData => _workflowData;
  GovernanceKpis get kpis => _kpis;
  bool get isLoading => _isLoading;

  Future<void> refresh() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.get(ApiConstants.workflow);
      if (res is Map<String, dynamic>) {
        _workflowData = WorkflowData.fromJson(res);
      }
    } catch (e) {
      debugPrint('Workflow fetch error: $e');
    }

    try {
      final res = await apiClient.get(ApiConstants.analytics);
      if (res is Map<String, dynamic>) {
        _kpis = GovernanceKpis.fromJson(res);
      }
    } catch (e) {
      debugPrint('Analytics fetch error: $e');
    }

    _isLoading = false;
    notifyListeners();
  }
}

