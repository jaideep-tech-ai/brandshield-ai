import 'package:flutter_test/flutter_test.dart';
import 'package:brandshield_mobile/models/user.dart';
import 'package:brandshield_mobile/models/finding.dart';
import 'package:brandshield_mobile/models/submission.dart';
import 'package:brandshield_mobile/models/chat_session.dart';

void main() {
  group('Data Model Deserialization Tests', () {
    test('ChatSession.fromJson deserializes id, title, and count correctly', () {
      final json = {
        'id': 'sess_123',
        'title': 'WCAG Contrast Inquiry',
        'createdAt': '2026-11-11T12:00:00.000Z',
        'updatedAt': '2026-11-11T12:05:00.000Z',
        '_count': {'messages': 4},
      };

      final session = ChatSession.fromJson(json);
      expect(session.id, equals('sess_123'));
      expect(session.title, equals('WCAG Contrast Inquiry'));
      expect(session.messageCount, equals(4));
    });
    test('User.fromJson deserializes correctly', () {
      final json = {
        'id': 'usr_123',
        'email': 'ava@nimbus.demo',
        'name': 'Ava Chen',
        'role': 'creator',
        'department': 'Content Studio',
        'avatarColor': '#0F766E',
        'orgId': 'org_456',
        'orgName': 'Nimbus Labs',
        'orgSlug': 'nimbus-labs',
        'zeroDataRetention': true,
        'token': 'mock_jwt_token',
      };

      final user = User.fromJson(json);
      expect(user.id, equals('usr_123'));
      expect(user.email, equals('ava@nimbus.demo'));
      expect(user.role, equals(UserRole.creator));
      expect(user.zeroDataRetention, isTrue);
      expect(user.token, equals('mock_jwt_token'));
    });

    test('Finding.fromJson deserializes severity and citations', () {
      final json = {
        'id': 'f_001',
        'submissionId': 'sub_001',
        'severity': 'critical',
        'category': 'claim',
        'flaggedText': '10x ROI in 7 days guaranteed',
        'ruleCitation': 'Fact PD-09: No guaranteed ROI claims permitted.',
        'sourceDoc': 'Product Facts Datasheet Q3 2025',
        'rationale': 'Guaranteed metrics violate fair marketing rules.',
        'suggestion': 'Merchants average significant ROI improvements.',
        'stage': 'ai',
        'status': 'open',
      };

      final finding = Finding.fromJson(json);
      expect(finding.id, equals('f_001'));
      expect(finding.severity, equals(FindingSeverity.critical));
      expect(finding.category, equals('claim'));
      expect(finding.ruleCitation, contains('Fact PD-09'));
      expect(finding.isOpen, isTrue);
    });

    test('Submission.fromJson deserializes nested findings', () {
      final json = {
        'id': 'sub_001',
        'orgId': 'org_456',
        'authorId': 'usr_123',
        'title': 'Summer Promo Campaign',
        'contentType': 'text',
        'content': 'Test promotional content',
        'status': 'in_review',
        'complianceScore': 85,
        'scanCount': 1,
        'currentVersion': 1,
        'department': 'Content Studio',
        'findings': [
          {
            'id': 'f_001',
            'submissionId': 'sub_001',
            'severity': 'warning',
            'category': 'trademark',
            'flaggedText': 'NimbusPay',
            'ruleCitation': 'RULE TM-01: Must include registered mark',
            'sourceDoc': 'Trademark Guide',
            'status': 'open',
          }
        ],
      };

      final submission = Submission.fromJson(json);
      expect(submission.id, equals('sub_001'));
      expect(submission.title, equals('Summer Promo Campaign'));
      expect(submission.complianceScore, equals(85));
      expect(submission.findings.length, equals(1));
      expect(submission.findings.first.severity, equals(FindingSeverity.warning));
    });
  });
}

