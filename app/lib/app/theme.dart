import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  // Tarifa-inspired color palette
  static const Color _oceanBlue = Color(0xFF1B6B93);
  static const Color _deepOcean = Color(0xFF0F4C75);
  static const Color _sandBeige = Color(0xFFF5E6CA);
  static const Color _warmSand = Color(0xFFFAF0E4);
  static const Color _sunsetCoral = Color(0xFFE8725A);
  static const Color _sunsetOrange = Color(0xFFF4A261);
  static const Color _driftwood = Color(0xFF6B5B4E);

  static ThemeData get lightTheme {
    final colorScheme = ColorScheme(
      brightness: Brightness.light,
      primary: _oceanBlue,
      onPrimary: Colors.white,
      primaryContainer: _oceanBlue.withValues(alpha: 0.12),
      onPrimaryContainer: _deepOcean,
      secondary: _sunsetCoral,
      onSecondary: Colors.white,
      secondaryContainer: _sunsetCoral.withValues(alpha: 0.12),
      onSecondaryContainer: _sunsetCoral,
      tertiary: _sunsetOrange,
      onTertiary: Colors.white,
      tertiaryContainer: _sunsetOrange.withValues(alpha: 0.12),
      onTertiaryContainer: _sunsetOrange,
      error: const Color(0xFFBA1A1A),
      onError: Colors.white,
      errorContainer: const Color(0xFFFFDAD6),
      onErrorContainer: const Color(0xFF410002),
      surface: _warmSand,
      onSurface: _driftwood,
      surfaceContainerHighest: _sandBeige,
      onSurfaceVariant: _driftwood.withValues(alpha: 0.7),
      outline: _driftwood.withValues(alpha: 0.3),
      outlineVariant: _driftwood.withValues(alpha: 0.12),
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: _driftwood,
      onInverseSurface: _warmSand,
      inversePrimary: const Color(0xFF7CC8E8),
    );

    final textTheme = GoogleFonts.interTextTheme();

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: textTheme,
      scaffoldBackgroundColor: _warmSand,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: _driftwood,
        elevation: 0,
        scrolledUnderElevation: 1,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: _driftwood,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: _oceanBlue,
        unselectedItemColor: _driftwood.withValues(alpha: 0.5),
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _sunsetCoral,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        ),
      ),
    );
  }
}
