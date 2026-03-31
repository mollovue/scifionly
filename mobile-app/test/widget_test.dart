import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:scifionly/main.dart';

void main() {
  testWidgets('App starts and shows SciFi Only title',
      (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: SciFiOnlyApp()));
    await tester.pumpAndSettle();
    expect(find.text('SciFi Only'), findsWidgets);
  });
}
