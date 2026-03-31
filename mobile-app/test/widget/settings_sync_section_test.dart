import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:scifionly/ui/screens/settings_screen.dart';
import 'package:scifionly/ui/theme/app_theme.dart';
import 'package:scifionly/providers/sync_providers.dart';

void main() {
  group('SettingsScreen TMDB Sync Section', () {
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

    testWidgets('shows TMDB Sync section header', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      expect(find.text('TMDB Sync'), findsOneWidget);
    });

    testWidgets('shows API token text field', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      expect(find.text('API Read Access Token'), findsOneWidget);
    });

    testWidgets('shows Validate & Save button', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      expect(find.text('Validate & Save'), findsOneWidget);
    });

    testWidgets('shows Enable Daily Sync toggle', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      expect(find.text('Enable Daily Sync'), findsOneWidget);
    });

    testWidgets('shows Sync Now button', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      expect(find.text('Sync Now'), findsOneWidget);
    });

    testWidgets('shows how-to expansion tile', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      expect(find.text('How to get your API token'), findsOneWidget);
    });

    testWidgets('how-to section expands with steps', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      await tester.tap(find.text('How to get your API token'));
      await tester.pumpAndSettle();

      await scrollDown(tester);
      expect(find.text('Open TMDB API Settings'), findsOneWidget);
    });

    testWidgets('shows Never synced when no sync has occurred', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      expect(find.text('Never synced'), findsWidgets);
    });

    testWidgets('still shows all original sections', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      expect(find.text('Database'), findsOneWidget);
      expect(find.text('TMDB Sync'), findsOneWidget);

      await scrollDown(tester);
      await scrollDown(tester);
      expect(find.text('Appearance'), findsOneWidget);

      await scrollDown(tester);
      expect(find.text('About'), findsOneWidget);
    });

    testWidgets('Sync Now button is shown', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      expect(find.text('Sync Now'), findsOneWidget);
    });

    testWidgets('Enable Daily Sync switch is disabled when no token',
        (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await scrollDown(tester);
      final switchTile = tester.widget<SwitchListTile>(
        find.widgetWithText(SwitchListTile, 'Enable Daily Sync'),
      );
      expect(switchTile.onChanged, isNull);
    });

    testWidgets('token field is obscured by default', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      final textField = tester.widget<TextField>(
        find.byType(TextField).first,
      );
      expect(textField.obscureText, isTrue);
    });

    testWidgets('visibility toggle toggles obscureText', (tester) async {
      await tester.pumpWidget(buildSettings());
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.visibility));
      await tester.pumpAndSettle();

      final textField = tester.widget<TextField>(
        find.byType(TextField).first,
      );
      expect(textField.obscureText, isFalse);
    });
  });
}
