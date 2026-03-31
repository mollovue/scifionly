import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:scifionly/ui/screens/settings_screen.dart';
import 'package:scifionly/ui/theme/app_theme.dart';
import 'package:scifionly/providers/sync_providers.dart';

void main() {
  group('SettingsScreen', () {
    late SharedPreferences prefs;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    Widget buildSettings() {
      return ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: MaterialApp(
          theme: AppTheme.darkTheme(),
          home: const SettingsScreen(),
        ),
      );
    }

    Future<void> scrollDown(WidgetTester tester, {double dy = -300}) async {
      await tester.drag(find.byType(ListView), Offset(0, dy));
      await tester.pumpAndSettle();
    }

    testWidgets('shows section headers', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      expect(find.text('Database'), findsOneWidget);
      expect(find.text('TMDB Sync'), findsOneWidget);

      // Scroll down to find the sections that are below the fold
      await scrollDown(tester);
      await scrollDown(tester);
      expect(find.text('Appearance'), findsOneWidget);

      await scrollDown(tester);
      expect(find.text('About'), findsOneWidget);
    });

    testWidgets('shows dark mode toggle', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      await scrollDown(tester);
      expect(find.text('Dark Mode'), findsOneWidget);
      expect(find.byType(SwitchListTile), findsAtLeast(1));
    });

    testWidgets('shows TMDB attribution', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      await scrollDown(tester);
      await scrollDown(tester);
      expect(
        find.textContaining('not endorsed or certified by TMDB'),
        findsOneWidget,
      );
    });

    testWidgets('shows import database button', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      expect(find.text('Import Database'), findsOneWidget);
    });

    testWidgets('shows demo data option when no database', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      expect(find.text('Load Demo Data'), findsOneWidget);
    });

    testWidgets('shows version info', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      await scrollDown(tester);
      await scrollDown(tester);
      expect(find.text('Version 1.0.0'), findsOneWidget);
    });
  });
}
