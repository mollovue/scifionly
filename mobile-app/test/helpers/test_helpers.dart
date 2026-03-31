import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:scifionly/ui/theme/app_theme.dart';
import 'package:scifionly/ui/theme/scifi_colors.dart';

/// Wraps a widget in a MaterialApp with proper theme and Riverpod scope.
Widget createTestableWidget(
  Widget child, {
  List<Override> overrides = const [],
  bool dark = true,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      theme: dark ? AppTheme.darkTheme() : AppTheme.lightTheme(),
      home: Scaffold(body: child),
    ),
  );
}

/// Wraps a widget in MaterialApp with dark theme for component testing.
Widget wrapWithTheme(Widget child) {
  return MaterialApp(
    theme: AppTheme.darkTheme(),
    home: Scaffold(body: child),
  );
}

/// Extension to make finding SciFiColors easier in tests.
extension SciFiColorsExtension on BuildContext {
  SciFiColors get sciFiColors => Theme.of(this).extension<SciFiColors>()!;
}
