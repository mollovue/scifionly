import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:scifionly/ui/theme/app_theme.dart';
import 'package:scifionly/ui/theme/scifi_colors.dart';

void main() {
  setUp(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  group('AppTheme', () {
    testWidgets('dark theme has SciFiColors extension', (tester) async {
      final theme = AppTheme.darkTheme();
      final colors = theme.extension<SciFiColors>();
      expect(colors, isNotNull);
      expect(colors!.background, const Color(0xFF0D1117));
      expect(colors.primaryCyan, const Color(0xFF1AB8C4));
      expect(colors.accentPurple, const Color(0xFF8B5CF6));
    });

    testWidgets('light theme has SciFiColors extension', (tester) async {
      final theme = AppTheme.lightTheme();
      final colors = theme.extension<SciFiColors>();
      expect(colors, isNotNull);
      expect(colors!.background, const Color(0xFFF4F6F9));
      expect(colors.primaryCyan, const Color(0xFF0F8A94));
    });

    testWidgets('dark theme uses Material 3', (tester) async {
      final theme = AppTheme.darkTheme();
      expect(theme.useMaterial3, true);
    });

    testWidgets('dark theme brightness is dark', (tester) async {
      final theme = AppTheme.darkTheme();
      expect(theme.brightness, Brightness.dark);
    });

    testWidgets('light theme brightness is light', (tester) async {
      final theme = AppTheme.lightTheme();
      expect(theme.brightness, Brightness.light);
    });
  });

  group('SciFiColors', () {
    test('dark colors match spec hex values', () {
      const colors = SciFiColors.dark;
      expect(colors.background, const Color(0xFF0D1117));
      expect(colors.surface, const Color(0xFF151B23));
      expect(colors.surfaceSecondary, const Color(0xFF1C2333));
      expect(colors.border, const Color(0xFF2A3444));
      expect(colors.textPrimary, const Color(0xFFD8DEE9));
      expect(colors.textMuted, const Color(0xFF7E8A9A));
      expect(colors.primaryCyan, const Color(0xFF1AB8C4));
      expect(colors.primaryCyanHover, const Color(0xFF128A93));
      expect(colors.accentPurple, const Color(0xFF8B5CF6));
    });

    test('light colors match spec hex values', () {
      const colors = SciFiColors.light;
      expect(colors.background, const Color(0xFFF4F6F9));
      expect(colors.surface, const Color(0xFFFFFFFF));
      expect(colors.primaryCyan, const Color(0xFF0F8A94));
    });

    test('copyWith preserves unchanged values', () {
      const colors = SciFiColors.dark;
      final modified = colors.copyWith(background: Colors.red);
      expect(modified.background, Colors.red);
      expect(modified.primaryCyan, colors.primaryCyan);
    });

    test('lerp interpolates between themes', () {
      const dark = SciFiColors.dark;
      const light = SciFiColors.light;
      final mid = dark.lerp(light, 0.5);
      expect(mid.background, isNot(dark.background));
      expect(mid.background, isNot(light.background));
    });
  });
}
