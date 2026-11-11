import 'package:flutter/material.dart';

class BrandColors {
  // Primary Palette
  static const Color primaryTeal = Color(0xFF0F766E);
  static const Color primaryDark = Color(0xFF115E59);
  static const Color accentMint = Color(0xFF14B8A6);
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);
  static const Color darkSlate = Color(0xFF0F172A);
  static const Color mutedText = Color(0xFF64748B);

  // Vibrant CTA Green (Matches Web Onboarding Next Button)
  static const Color vibrantGreen = Color(0xFF16A34A);
  static const Color vibrantGreenHover = Color(0xFF15803D);
  static const Color vibrantGreenRing = Color(0xFF22C55E);

  // Role Accent Colors
  static const Color adminEmerald = Color(0xFF059669);
  static const Color reviewerAmber = Color(0xFFD97706);
  static const Color creatorTeal = Color(0xFF0D9488);
  static const Color contractorOrange = Color(0xFFC2410C);

  // Severity Colors
  static const Color criticalRed = Color(0xFFDC2626);
  static const Color warningAmber = Color(0xFFD97706);
  static const Color minorBlue = Color(0xFF2563EB);
  static const Color successGreen = Color(0xFF16A34A);

  // Enterprise Color Aliases
  static const Color primaryGreen = vibrantGreen;
  static const Color critical = criticalRed;
  static const Color warning = warningAmber;
  static const Color pureWhite = surface;
  static const Color surfaceLight = background;
  static const Color borderSubtle = border;
  static const Color slate200 = border;
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = mutedText;
  static const Color slate600 = Color(0xFF475569);
  static const Color slate700 = Color(0xFF334155);
}

class ApiConstants {
  static const String defaultBaseUrl = 'https://brandshield-ai-five.vercel.app';
  static const String localBaseUrl = 'http://localhost:3000';

  // Auth Routes
  static const String login = '/api/auth/login';
  static const String autoLogin = '/api/auth/auto-login';
  static const String switchRole = '/api/auth/switch-role';
  static const String firebaseSync = '/api/auth/firebase-sync';
  static const String me = '/api/auth/me';
  static const String logout = '/api/auth/logout';

  // Feature Routes
  static const String copilotChat = '/api/copilot/chat';
  static const String workflow = '/api/system/workflow';
  static const String submissions = '/api/submissions';
  static const String guidelines = '/api/guidelines';
  static const String visualTokens = '/api/visual-tokens';
  static const String analytics = '/api/analytics';
  static const String tour = '/api/user/tour';
  static const String gitlabStatus = '/api/integrations/gitlab/status';
  static const String googleStatus = '/api/integrations/google/status';
  static const String figmaStatus = '/api/integrations/figma/status';
}
