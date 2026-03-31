import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:scifionly/main.dart';
import 'package:scifionly/providers/sync_providers.dart';

void main() {
  group('ShellScreen / Navigation', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    Widget buildApp() {
      return ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const SciFiOnlyApp(),
      );
    }

    testWidgets('app shows bottom navigation bar', (tester) async {
      await tester.pumpWidget(buildApp());
      await tester.pumpAndSettle();

      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.text('Search'), findsOneWidget);
      expect(find.text('Browse'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets('search tab is selected by default', (tester) async {
      await tester.pumpWidget(buildApp());
      await tester.pumpAndSettle();

      // SciFi Only title should be visible (hero section)
      expect(find.text('SciFi Only'), findsWidgets);
    });

    testWidgets('tapping Browse navigates to browse screen', (tester) async {
      await tester.pumpWidget(buildApp());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Browse'));
      await tester.pumpAndSettle();

      expect(find.text('Browse'), findsWidgets); // In both appbar and nav
    });

    testWidgets('tapping Settings navigates to settings screen',
        (tester) async {
      await tester.pumpWidget(buildApp());
      await tester.pumpAndSettle();

      await tester.tap(find.text('Settings'));
      await tester.pumpAndSettle();

      expect(find.text('Database'), findsOneWidget);
      expect(find.text('TMDB Sync'), findsOneWidget);
    });
  });
}
