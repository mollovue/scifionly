import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:scifionly/main.dart';
import 'package:scifionly/providers/sync_providers.dart';

void main() {
  testWidgets('App starts and shows SciFi Only title',
      (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    await tester.pumpWidget(ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const SciFiOnlyApp(),
    ));
    await tester.pumpAndSettle();
    expect(find.text('SciFi Only'), findsWidgets);
  });
}
