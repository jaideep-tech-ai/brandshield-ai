import 'package:flutter_test/flutter_test.dart';
import 'package:brandshield_mobile/app/brandshield_app.dart';

void main() {
  testWidgets('BrandShieldApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const BrandShieldApp());
    expect(find.byType(BrandShieldApp), findsOneWidget);
  });
}
