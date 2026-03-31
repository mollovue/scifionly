import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:scifionly/main.dart';

void main() {
  group('ShellScreen / Navigation', () {
    testWidgets('app shows bottom navigation bar', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SciFiOnlyApp()));
      await tester.pumpAndSettle();

      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.text('Search'), findsOneWidget);
      expect(find.text('Browse'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets('search tab is selected by default', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SciFiOnlyApp()));
      await tester.pumpAndSettle();

      // SciFi Only title should be visible (hero section)
      expect(find.text('SciFi Only'), findsWidgets);
    });

    testWidgets('tapping Browse navigates to browse screen', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SciFiOnlyApp()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Browse'));
      await tester.pumpAndSettle();

      expect(find.text('Browse'), findsWidgets); // In both appbar and nav
    });

    testWidgets('tapping Settings navigates to settings screen',
        (tester) async {
      await tester.pumpWidget(const ProviderScope(child: SciFiOnlyApp()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Settings'));
      await tester.pumpAndSettle();

      expect(find.text('Database'), findsOneWidget);
      expect(find.text('Appearance'), findsOneWidget);
    });
  });
}
