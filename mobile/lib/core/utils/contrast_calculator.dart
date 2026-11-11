import 'dart:math';
import 'package:flutter/material.dart';

class ContrastCalculator {
  /// Calculates sRGB relative luminance per WCAG 2.1 specs:
  /// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
  static double relativeLuminance(int r, int g, int b) {
    double transform(double c) {
      final s = c / 255.0;
      return s <= 0.04045 ? s / 12.92 : pow((s + 0.055) / 1.055, 2.4).toDouble();
    }

    final rLin = transform(r.toDouble());
    final gLin = transform(g.toDouble());
    final bLin = transform(b.toDouble());

    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  }

  /// Parses hex color `#RRGGBB` or `#RGB` and returns (r, g, b).
  static List<int> hexToRgb(String hex) {
    String clean = hex.replaceAll('#', '').trim();
    if (clean.length == 3) {
      clean = clean.split('').map((c) => '$c$c').join();
    }
    if (clean.length != 6) {
      return [0, 0, 0];
    }
    final int val = int.tryParse(clean, radix: 16) ?? 0;
    final r = (val >> 16) & 0xFF;
    final g = (val >> 8) & 0xFF;
    final b = val & 0xFF;
    return [r, g, b];
  }

  /// Calculates WCAG 2.1 contrast ratio between two hex colors:
  /// (L1 + 0.05) / (L2 + 0.05) where L1 is lighter than L2.
  static double contrastRatio(String hex1, String hex2) {
    final rgb1 = hexToRgb(hex1);
    final rgb2 = hexToRgb(hex2);

    final l1 = relativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
    final l2 = relativeLuminance(rgb2[0], rgb2[1], rgb2[2]);

    final lighter = max(l1, l2);
    final darker = min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  static double calculateHexRatio(String hex1, String hex2) => contrastRatio(hex1, hex2);

  static double calculateRatio(Color c1, Color c2) {
    final r1 = (c1.r * 255.0).round().clamp(0, 255);
    final g1 = (c1.g * 255.0).round().clamp(0, 255);
    final b1 = (c1.b * 255.0).round().clamp(0, 255);
    final r2 = (c2.r * 255.0).round().clamp(0, 255);
    final g2 = (c2.g * 255.0).round().clamp(0, 255);
    final b2 = (c2.b * 255.0).round().clamp(0, 255);

    final l1 = relativeLuminance(r1, g1, b1);
    final l2 = relativeLuminance(r2, g2, b2);
    final lighter = max(l1, l2);
    final darker = min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  static Color parseHex(String hex) {
    final rgb = hexToRgb(hex);
    return Color.fromARGB(255, rgb[0], rgb[1], rgb[2]);
  }

  static bool meetsAA(double ratio, {bool isLargeText = false}) {
    return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
  }

  static bool meetsAAA(double ratio, {bool isLargeText = false}) {
    return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
  }

  /// Level AA requires 4.5:1 for normal text and 3:1 for large text.
  static bool passesAA(String fg, String bg, {bool isLargeText = false}) {
    final ratio = contrastRatio(fg, bg);
    return meetsAA(ratio, isLargeText: isLargeText);
  }

  /// Level AAA requires 7.0:1 for normal text and 4.5:1 for large text.
  static bool passesAAA(String fg, String bg, {bool isLargeText = false}) {
    final ratio = contrastRatio(fg, bg);
    return meetsAAA(ratio, isLargeText: isLargeText);
  }
}
