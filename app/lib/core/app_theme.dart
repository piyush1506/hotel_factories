import 'package:flutter/material.dart';

/// Hotel Factories mobile design tokens.
class AppColors {
  AppColors._();

  static const black = Color(0xFF09090B);
  static const ink = Color(0xFF0F172A);
  static const inkSoft = Color(0xFF161C29);
  static const slate = Color(0xFF334155);
  static const muted = Color(0xFF64748B);
  static const lightMuted = Color(0xFF94A3B8);
  static const background = Color(0xFFF8FAFC);
  static const white = Color(0xFFFFFFFF);
  static const border = Color(0xFFE2E8F0);
  static const borderLight = Color(0xFFF1F5F9);
  static const cardMuted = Color(0xFFF1F5F9);

  static const blue = Color(0xFF0B8FF0);
  static const blueDark = Color(0xFF0074D4);
  static const blueDeep = Color(0xFF003B95);
  static const blueSoft = Color(0xFFEFF6FF);
  static const blueTint = Color(0xFFDBEAFE);

  static const gold = Color(0xFFF59E0B);
  static const goldDeep = Color(0xFFD97706);
  static const goldSoft = Color(0xFFFEF3C7);

  static const green = Color(0xFF059669);
  static const greenSoft = Color(0xFFD1FAE5);
  static const greenText = Color(0xFF047857);

  static const red = Color(0xFFE11D48);
  static const redSoft = Color(0xFFFFE4E6);

  static const navy = Color(0xFF0D1728);
  static const navyLight = Color(0xFF1C2A42);
  static const amberSoft = Color(0xFFFFFBEB);

  static const gradientDark = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF101827), Color(0xFF080D16)],
  );

  static const gradientCoral = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF3B0A12), Color(0xFF9F1239)],
  );

  static const gradientBlue = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF003B95), Color(0xFF0077D9)],
  );
}

class AppShadows {
  AppShadows._();

  static const card = [
    BoxShadow(color: Color(0x0F0F172A), blurRadius: 18, offset: Offset(0, 6)),
  ];
  static const soft = [
    BoxShadow(color: Color(0x0A0F172A), blurRadius: 10, offset: Offset(0, 3)),
  ];
  static const floating = [
    BoxShadow(color: Color(0x290F172A), blurRadius: 30, offset: Offset(0, 12)),
  ];
}

class AppTheme {
  AppTheme._();

  static const String fontFamily = 'PlusJakartaSans';

  static TextStyle style({
    double size = 14,
    FontWeight weight = FontWeight.w500,
    Color color = AppColors.ink,
    double height = 1.35,
    double? letterSpacing,
    TextDecoration? decoration,
  }) {
    return TextStyle(
      fontFamily: fontFamily,
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
      letterSpacing: letterSpacing,
      decoration: decoration,
    );
  }

  static TextStyle h1 = style(size: 28, weight: FontWeight.w800, height: 1.15, letterSpacing: -0.7);
  static TextStyle h2 = style(size: 22, weight: FontWeight.w800, height: 1.2, letterSpacing: -0.4);
  static TextStyle h3 = style(size: 18, weight: FontWeight.w800, height: 1.25, letterSpacing: -0.2);
  static TextStyle title = style(size: 15, weight: FontWeight.w700);
  static TextStyle body = style(size: 13.5, weight: FontWeight.w500, height: 1.5);
  static TextStyle bodyStrong = style(size: 13.5, weight: FontWeight.w700, height: 1.45);
  static TextStyle small = style(size: 12, weight: FontWeight.w500, color: AppColors.muted);
  static TextStyle smallStrong = style(size: 12, weight: FontWeight.w700, color: AppColors.slate);
  static TextStyle tiny = style(size: 10.5, weight: FontWeight.w600, color: AppColors.muted);
  static TextStyle label = style(
    size: 10.5,
    weight: FontWeight.w800,
    color: AppColors.muted,
    letterSpacing: 0.9,
  );
  static TextStyle price = style(size: 22, weight: FontWeight.w800, height: 1.1, letterSpacing: -0.5);

  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      fontFamily: fontFamily,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.light(
        primary: AppColors.black,
        onPrimary: Colors.white,
        secondary: AppColors.blue,
        onSecondary: Colors.white,
        surface: Colors.white,
        onSurface: AppColors.ink,
        error: AppColors.red,
        outline: AppColors.border,
      ),
    );

    return base.copyWith(
      textTheme: base.textTheme.apply(
        fontFamily: fontFamily,
        bodyColor: AppColors.ink,
        displayColor: AppColors.ink,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
      ),
      dividerTheme: const DividerThemeData(color: AppColors.borderLight, thickness: 1, space: 1),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.background,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        hintStyle: style(size: 13, color: AppColors.lightMuted),
        labelStyle: style(size: 12, color: AppColors.muted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.ink, width: 1.4),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.red),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.navy,
        contentTextStyle: style(size: 13, color: Colors.white, weight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        insetPadding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: Colors.transparent,
        modalBarrierColor: Color(0x990F172A),
      ),
      splashFactory: InkSparkle.splashFactory,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: ZoomPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
          TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
        },
      ),
    );
  }
}

class AppSpacing {
  AppSpacing._();
  static const double page = 16;
  static const double gapXs = 4;
  static const double gapSm = 8;
  static const double gap = 12;
  static const double gapMd = 16;
  static const double gapLg = 20;
  static const double gapXl = 28;
  static const double navReserve = 112;
}
