import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:scifionly/main.dart';

void main() {
  group('Navigation integration', () {
    testWidgets('can navigate between all tabs', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SciFiOnlyApp()));
      await tester.pumpAndSettle();

      // Start on Search
      expect(find.text('SciFi Only'), findsWidgets);

      // Go to Browse
      await tester.tap(find.text('Browse'));
      await tester.pumpAndSettle();

      // Go to Settings
      await tester.tap(find.text('Settings'));
      await tester.pumpAndSettle();
      expect(find.text('Database'), findsOneWidget);

      // Back to Search
      await tester.tap(find.text('Search'));
      await tester.pumpAndSettle();
      expect(find.text('SciFi Only'), findsWidgets);
    });

    testWidgets('search screen shows no database state initially',
        (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SciFiOnlyApp()));
      await tester.pumpAndSettle();

      // Should show the search bar
      expect(find.byType(TextField), findsOneWidget);
      // Should show no database state
      expect(find.text('No database loaded'), findsOneWidget);
    });

    testWidgets('search bar accepts input', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SciFiOnlyApp()));
      await tester.pumpAndSettle();

      final searchField = find.byType(TextField);
      await tester.enterText(searchField, 'matrix');
      await tester.pumpAndSettle();

      expect(find.text('matrix'), findsOneWidget);
    });
  });
}
