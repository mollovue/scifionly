import 'package:flutter/material.dart';

class SciFiColors extends ThemeExtension<SciFiColors> {
  final Color background;
  final Color surface;
  final Color surfaceSecondary;
  final Color border;
  final Color textPrimary;
  final Color textMuted;
  final Color primaryCyan;
  final Color primaryCyanHover;
  final Color accentPurple;

  const SciFiColors({
    required this.background,
    required this.surface,
    required this.surfaceSecondary,
    required this.border,
    required this.textPrimary,
    required this.textMuted,
    required this.primaryCyan,
    required this.primaryCyanHover,
    required this.accentPurple,
  });

  static const dark = SciFiColors(
    background: Color(0xFF0D1117),
    surface: Color(0xFF151B23),
    surfaceSecondary: Color(0xFF1C2333),
    border: Color(0xFF2A3444),
    textPrimary: Color(0xFFD8DEE9),
    textMuted: Color(0xFF7E8A9A),
    primaryCyan: Color(0xFF1AB8C4),
    primaryCyanHover: Color(0xFF128A93),
    accentPurple: Color(0xFF8B5CF6),
  );

  static const light = SciFiColors(
    background: Color(0xFFF4F6F9),
    surface: Color(0xFFFFFFFF),
    surfaceSecondary: Color(0xFFF0F2F5),
    border: Color(0xFFD1D5DB),
    textPrimary: Color(0xFF171E2A),
    textMuted: Color(0xFF6B7280),
    primaryCyan: Color(0xFF0F8A94),
    primaryCyanHover: Color(0xFF0A6B73),
    accentPurple: Color(0xFF7C4DDB),
  );

  @override
  SciFiColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceSecondary,
    Color? border,
    Color? textPrimary,
    Color? textMuted,
    Color? primaryCyan,
    Color? primaryCyanHover,
    Color? accentPurple,
  }) {
    return SciFiColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceSecondary: surfaceSecondary ?? this.surfaceSecondary,
      border: border ?? this.border,
      textPrimary: textPrimary ?? this.textPrimary,
      textMuted: textMuted ?? this.textMuted,
      primaryCyan: primaryCyan ?? this.primaryCyan,
      primaryCyanHover: primaryCyanHover ?? this.primaryCyanHover,
      accentPurple: accentPurple ?? this.accentPurple,
    );
  }

  @override
  SciFiColors lerp(ThemeExtension<SciFiColors>? other, double t) {
    if (other is! SciFiColors) return this;
    return SciFiColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceSecondary:
          Color.lerp(surfaceSecondary, other.surfaceSecondary, t)!,
      border: Color.lerp(border, other.border, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      primaryCyan: Color.lerp(primaryCyan, other.primaryCyan, t)!,
      primaryCyanHover:
          Color.lerp(primaryCyanHover, other.primaryCyanHover, t)!,
      accentPurple: Color.lerp(accentPurple, other.accentPurple, t)!,
    );
  }
}
