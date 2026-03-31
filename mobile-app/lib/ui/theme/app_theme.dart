import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'scifi_colors.dart';

class AppTheme {
  static TextTheme _textTheme(Color textColor) {
    return GoogleFonts.exo2TextTheme().apply(
      bodyColor: textColor,
      displayColor: textColor,
    );
  }

  static ThemeData darkTheme() {
    const colors = SciFiColors.dark;
    final textTheme = _textTheme(colors.textPrimary);
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: colors.background,
      colorScheme: ColorScheme.dark(
        surface: colors.surface,
        primary: colors.primaryCyan,
        secondary: colors.accentPurple,
        onSurface: colors.textPrimary,
        onPrimary: colors.background,
      ),
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: colors.background,
        foregroundColor: colors.textPrimary,
        elevation: 0,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: colors.textPrimary,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardTheme(
        color: colors.surface,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: colors.border, width: 0.5),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colors.surfaceSecondary,
        labelStyle: textTheme.bodySmall?.copyWith(color: colors.textPrimary),
        side: BorderSide(color: colors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surfaceSecondary,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.primaryCyan, width: 2),
        ),
        hintStyle: textTheme.bodyMedium?.copyWith(color: colors.textMuted),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: colors.surface,
        indicatorColor: colors.primaryCyan.withOpacity(0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return textTheme.labelSmall?.copyWith(color: colors.primaryCyan);
          }
          return textTheme.labelSmall?.copyWith(color: colors.textMuted);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return IconThemeData(color: colors.primaryCyan);
          }
          return IconThemeData(color: colors.textMuted);
        }),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: colors.primaryCyan,
        foregroundColor: colors.background,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colors.primaryCyan,
      ),
      dividerTheme: DividerThemeData(color: colors.border),
      extensions: const [colors],
    );
  }

  static ThemeData lightTheme() {
    const colors = SciFiColors.light;
    final textTheme = _textTheme(colors.textPrimary);
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: colors.background,
      colorScheme: ColorScheme.light(
        surface: colors.surface,
        primary: colors.primaryCyan,
        secondary: colors.accentPurple,
        onSurface: colors.textPrimary,
        onPrimary: Colors.white,
      ),
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: colors.background,
        foregroundColor: colors.textPrimary,
        elevation: 0,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          color: colors.textPrimary,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardTheme(
        color: colors.surface,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: colors.border, width: 0.5),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colors.surfaceSecondary,
        labelStyle: textTheme.bodySmall?.copyWith(color: colors.textPrimary),
        side: BorderSide(color: colors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surfaceSecondary,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.primaryCyan, width: 2),
        ),
        hintStyle: textTheme.bodyMedium?.copyWith(color: colors.textMuted),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: colors.surface,
        indicatorColor: colors.primaryCyan.withOpacity(0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return textTheme.labelSmall?.copyWith(color: colors.primaryCyan);
          }
          return textTheme.labelSmall?.copyWith(color: colors.textMuted);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return IconThemeData(color: colors.primaryCyan);
          }
          return IconThemeData(color: colors.textMuted);
        }),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: colors.primaryCyan,
        foregroundColor: Colors.white,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colors.primaryCyan,
      ),
      dividerTheme: DividerThemeData(color: colors.border),
      extensions: const [colors],
    );
  }
}
