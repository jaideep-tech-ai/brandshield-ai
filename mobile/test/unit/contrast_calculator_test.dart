import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:brandshield_mobile/core/utils/contrast_calculator.dart';

void main() {
  group('ContrastCalculator Unit Tests', () {
    test('Black on White produces maximum 21.0:1 ratio', () {
      final ratio = ContrastCalculator.calculateRatio(
        const Color(0xFF000000),
        const Color(0xFFFFFFFF),
      );
      expect(ratio, closeTo(21.0, 0.1));
    });

    test('White on White produces minimum 1.0:1 ratio', () {
      final ratio = ContrastCalculator.calculateRatio(
        const Color(0xFFFFFFFF),
        const Color(0xFFFFFFFF),
      );
      expect(ratio, closeTo(1.0, 0.05));
    });

    test('Brand Teal (#0F766E) on White exceeds WCAG AA requirement', () {
      final ratio = ContrastCalculator.calculateHexRatio('#0F766E', '#FFFFFF');
      expect(ratio, greaterThanOrEqualTo(4.5));
      expect(ContrastCalculator.meetsAA(ratio), isTrue);
    });

    test('Light gray (#E2E8F0) on White fails WCAG AA requirement', () {
      final ratio = ContrastCalculator.calculateHexRatio('#E2E8F0', '#FFFFFF');
      expect(ratio, lessThan(4.5));
      expect(ContrastCalculator.meetsAA(ratio), isFalse);
    });

    test('Parse valid hex codes correctly', () {
      final color = ContrastCalculator.parseHex('#16A34A');
      expect((color.a * 255).round(), equals(255));
      expect((color.r * 255).round(), equals(0x16));
      expect((color.g * 255).round(), equals(0xA3));
      expect((color.b * 255).round(), equals(0x4A));
    });
  });
}
