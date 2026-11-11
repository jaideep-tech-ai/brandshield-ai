import 'package:flutter/widgets.dart';

class AppLocalizations {
  final String locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ?? AppLocalizations('en');
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static final Map<String, Map<String, String>> _localizedValues = {
    'en': {
      // General
      'app_title': 'BrandShield AI',
      'tagline': 'Autonomous Brand Governance & Pre-Publishing Audit',
      'loading': 'Loading...',
      'error': 'Error occurred',
      'retry': 'Retry',
      'save': 'Save',
      'cancel': 'Cancel',
      'close': 'Close',

      // Navigation
      'nav_dashboard': 'Overview',
      'nav_copilot': 'AI Copilot',
      'nav_scanner': 'Scanner',
      'nav_findings': 'Findings',
      'nav_approvals': 'Approvals',
      'nav_more': 'More',
      'nav_settings': 'Settings',
      'nav_knowledge': 'Knowledge Base',
      'nav_analytics': 'Analytics',
      'nav_integrations': 'Integrations',

      // Dashboard
      'dash_welcome': 'Welcome back,',
      'dash_health': 'Governance Health',
      'dash_health_sub': 'Real-time compliance index across all active digital assets',
      'dash_workflow_title': '7-Stage Brand Governance Journey',
      'dash_workflow_sub': 'Live database progression from guideline ingestion to immutable audit trail',
      'dash_kpi_score': 'Avg Compliance',
      'dash_kpi_scanned': 'Total Scanned',
      'dash_kpi_findings': 'Open Findings',
      'dash_kpi_critical': 'Critical Violations',
      'dash_kpi_approved': 'Approved Assets',
      'dash_kpi_pending': 'Pending Review',
      'dash_priority_queue': 'Priority Review Queue',
      'dash_risk_radar': 'High-Impact Risk Radar',
      'dash_quick_actions': 'Quick Actions',
      'dash_start_scan': 'Start Pre-Flight Scan',
      'dash_ask_copilot': 'Consult AI Copilot',

      // Scanner
      'scanner_title': 'Pre-Flight Asset Scanner',
      'scanner_sub': 'Sub-100ms deterministic checks + multimodal AI vision contrast inspection',
      'scanner_copy_label': 'Marketing Copy / Headline Draft',
      'scanner_copy_hint': 'Enter or paste promotional text to test for claims and trademark compliance...',
      'scanner_image_label': 'Visual Banner Creative',
      'scanner_image_upload': 'Upload Banner Image',
      'scanner_camera': 'Take Photo',
      'scanner_gallery': 'Choose from Gallery',
      'scanner_run_audit': 'Run Brand Pre-Flight Audit',
      'scanner_scanning': 'Running deterministic rules & computer vision...',
      'scanner_score': 'Compliance Score',

      // Findings
      'findings_title': 'Findings & Remediation Desk',
      'findings_sub': 'Explainable brand violations with verbatim policy evidence and 1-click AI fixes',
      'findings_filter_all': 'All Findings',
      'findings_filter_critical': 'Critical Only',
      'findings_filter_warning': 'Warnings',
      'findings_filter_minor': 'Style Polish',
      'findings_apply_fix': 'Apply AI Rewrite',
      'findings_override': 'Override Flag',
      'findings_override_reason': 'Enter justification for compliance audit trail...',
      'findings_replace_image': 'Upload Fixed Image',
      'findings_evidence': 'Policy Source & Evidence',
      'findings_empty': 'Zero policy violations found. Assets are 100% compliant!',

      // Approvals
      'approvals_title': 'Approval Board & Decision Ledger',
      'approvals_sub': 'Tamper-evident decisions cryptographically signed into SHA-256 audit log',
      'approvals_queue': 'Awaiting Sign-Off',
      'approvals_sign_off': 'Sign-Off with SHA-256',
      'approvals_request_changes': 'Request Changes',
      'approvals_sha_proof': 'SHA-256 Proof',

      // Copilot
      'copilot_title': 'AI Brand Governance Copilot',
      'copilot_sub': 'Powered by Google Gemini 2.5 with live RAG and WCAG contrast math',
      'copilot_placeholder': 'Ask anything about tone, claims, WCAG contrast, or policy rules...',
      'copilot_suggestions_title': 'Suggested Prompts:',
      'copilot_prompt_1': 'Can we use "100% safe" in our marketing headline?',
      'copilot_prompt_2': 'Calculate WCAG contrast between #0F766E and #FFFFFF',
      'copilot_prompt_3': 'What are the approved trademark rules for product names?',
      'copilot_citations': 'Source Citations',

      // Analytics
      'analyticsTitle': 'Governance Analytics & Metrics',
      'metricHealth': 'Governance Health',
      'metricAvgScore': 'Avg Compliance',
      'metricViolations': 'Open Violations',
      'metricProtected': 'Protected Assets',
      'deptBreakdownTitle': 'Department Compliance Benchmark',
      'deptBreakdownSubtitle': 'Historical adherence across creative, marketing and partner sandboxes',
      'frictionRulesTitle': 'High-Friction Brand Policies',
      'frictionRulesSubtitle': 'Policies triggering the most frequent pre-flight warnings',
      'immutableLedgerTitle': 'Cryptographic Audit Trail (SHA-256)',
      'immutableLedgerSubtitle': 'Tamper-evident block verification across all approved deliverables',

      // Integrations
      'integrationsTitle': 'Connected Tools & CI/CD Extensions',
      'integrationsSubtitle': 'Continuous brand policy enforcement across your design and code stacks',
      'googleDocsTitle': 'Google Docs Add-on',
      'googleDocsDesc': 'Audit brand guidelines in real-time as marketing teams write in Google Workspace.',
      'figmaTitle': 'Figma Design Linter',
      'figmaDesc': 'Scan Figma frames for WCAG 2.1 color contrast and approved brand tokens.',
      'gitlabTitle': 'GitLab CI/CD Self-Service Webhook',
      'gitlabDesc': 'Block non-compliant copy and assets on Merge Requests before deployment.',
      'statusConnected': 'Connected & Verified',
      'statusActive': 'Active Integration',
      'statusSetup': 'Setup Instructions',

      // Tour
      'tour_step': 'Step {x} of {y}',
      'tour_btn_next': 'Next',
      'tour_btn_back': 'Back',
      'tour_btn_finish': 'Finish Tour',
      'tour_btn_skip': 'Skip Tour',
      'tour_all_set': 'You\'re All Set!',

      // Settings & Profile
      'settings_title': 'Profile & Preferences',
      'settings_role': 'Evaluation Role',
      'settings_switch_role': 'Switch Role Persona',
      'settings_language': 'Application Language',
      'settings_api_endpoint': 'Backend API Endpoint',
      'settings_restart_tour': 'Restart Guided Product Tour',
      'settings_logout': 'Sign Out',
    },
    'hi': {
      // General
      'app_title': 'ब्रांडशील्ड AI',
      'tagline': 'स्वायत्त ब्रांड शासन और प्रकाशन-पूर्व ऑडिट',
      'loading': 'लोड हो रहा है...',
      'error': 'त्रुटि उत्पन्न हुई',
      'retry': 'पुनः प्रयास करें',
      'save': 'सहेजें',
      'cancel': 'रद्द करें',
      'close': 'बंद करें',

      // Navigation
      'nav_dashboard': 'अवलोकन',
      'nav_copilot': 'AI कोपायलट',
      'nav_scanner': 'स्कैनर',
      'nav_findings': 'निष्कर्ष',
      'nav_approvals': 'अनुमोदन',
      'nav_more': 'अन्य',
      'nav_settings': 'सेटिंग्स',
      'nav_knowledge': 'ज्ञानकोष',
      'nav_analytics': 'एनालिटिक्स',
      'nav_integrations': 'एकीकरण',

      // Dashboard
      'dash_welcome': 'स्वागत है,',
      'dash_health': 'शासन स्वास्थ्य सूचकांक',
      'dash_health_sub': 'सभी सक्रिय डिजिटल संपत्तियों में वास्तविक समय अनुपालन स्कोर',
      'dash_workflow_title': '7-चरणीय ब्रांड शासन जीवनचक्र',
      'dash_workflow_sub': 'दिशानिर्देश अंतर्ग्रहण से अपरिवर्तनीय ऑडिट ट्रेल तक डेटाबेस-संचालित प्रगति',
      'dash_kpi_score': 'औसत अनुपालन',
      'dash_kpi_scanned': 'कुल स्कैन',
      'dash_kpi_findings': 'खुले निष्कर्ष',
      'dash_kpi_critical': 'गंभीर उल्लंघन',
      'dash_kpi_approved': 'स्वीकृत संपत्तियां',
      'dash_kpi_pending': 'लंबित समीक्षा',
      'dash_priority_queue': 'प्राथमिकता समीक्षा कतार',
      'dash_risk_radar': 'उच्च-प्रभाव जोखिम रडार',
      'dash_quick_actions': 'त्वरित कार्रवाइयां',
      'dash_start_scan': 'प्री-फ़्लाइट स्कैन शुरू करें',
      'dash_ask_copilot': 'AI कोपायलट से पूछें',

      // Scanner
      'scanner_title': 'प्री-फ़्लाइट एसेट स्कैनर',
      'scanner_sub': 'सब-100ms नियम जांच + मल्टीमॉडल AI दृष्टि कंट्रास्ट विश्लेषण',
      'scanner_copy_label': 'मार्केटिंग कॉपी / हेडलाइन ड्राफ्ट',
      'scanner_copy_hint': 'दावों और ट्रेडमार्क अनुपालन की जांच के लिए टेक्स्ट दर्ज करें...',
      'scanner_image_label': 'प्रचार बैनर चित्र',
      'scanner_image_upload': 'बैनर चित्र अपलोड करें',
      'scanner_camera': 'फोटो खींचें',
      'scanner_gallery': 'गैलरी से चुनें',
      'scanner_run_audit': 'ब्रांड प्री-फ़्लाइट ऑडिट चलाएं',
      'scanner_scanning': 'नियम और विज़न विश्लेषण चल रहा है...',
      'scanner_score': 'अनुपालन स्कोर',

      // Findings
      'findings_title': 'निष्कर्ष और सुधार डेस्क',
      'findings_sub': 'सटीक नीति संदर्भों और 1-क्लिक AI सुधारों के साथ स्पष्ट उल्लंघन',
      'findings_filter_all': 'सभी निष्कर्ष',
      'findings_filter_critical': 'केवल गंभीर',
      'findings_filter_warning': 'चेतावनियां',
      'findings_filter_minor': 'शैली सुधार',
      'findings_apply_fix': 'AI सुधार लागू करें',
      'findings_override': 'ओवरराइड करें',
      'findings_override_reason': 'ऑडिट ट्रेल हेतु औचित्य दर्ज करें...',
      'findings_replace_image': 'सुधारा गया चित्र अपलोड करें',
      'findings_evidence': 'नीति स्रोत और साक्ष्य',
      'findings_empty': 'कोई नीति उल्लंघन नहीं मिला। सभी सामग्रियां 100% अनुपालक हैं!',

      // Approvals
      'approvals_title': 'अनुमोदन बोर्ड और निर्णय खाता बही',
      'approvals_sub': 'SHA-256 ऑडिट लॉग में क्रिप्टोग्राफ़िक रूप से रिकॉर्ड किए गए निर्णय',
      'approvals_queue': 'हस्ताक्षर हेतु लंबित',
      'approvals_sign_off': 'SHA-256 से अनुमोदन दें',
      'approvals_request_changes': 'बदलाव का अनुरोध करें',
      'approvals_sha_proof': 'SHA-256 प्रमाण',

      // Copilot
      'copilot_title': 'AI ब्रांड शासन कोपायलट',
      'copilot_sub': 'Google Gemini 2.5, लाइव RAG और WCAG गणित द्वारा संचालित',
      'copilot_placeholder': 'ब्रांड टोन, दावों, रंगों या नियमों के बारे में पूछें...',
      'copilot_suggestions_title': 'सुझाए गए प्रश्न:',
      'copilot_prompt_1': 'क्या हम अपनी हेडलाइन में "100% सुरक्षित" लिख सकते हैं?',
      'copilot_prompt_2': '#0F766E और #FFFFFF के बीच WCAG कंट्रास्ट निकालें',
      'copilot_prompt_3': 'उत्पाद नामों के लिए अनुमोदित ट्रेडमार्क नियम क्या हैं?',
      'copilot_citations': 'स्रोत उद्धरण',

      // Analytics
      'analyticsTitle': 'शासन एनालिटिक्स और मीट्रिक्स',
      'metricHealth': 'शासन स्वास्थ्य सूचकांक',
      'metricAvgScore': 'औसत अनुपालन',
      'metricViolations': 'खुले उल्लंघन',
      'metricProtected': 'सुरक्षित संपत्तियां',
      'deptBreakdownTitle': 'विभाग अनुपालन बेंचमार्क',
      'deptBreakdownSubtitle': 'रचनात्मक, विपणन और एजेंसी सैंडबॉक्स में ऐतिहासिक अनुपालन',
      'frictionRulesTitle': 'उच्च-घर्षण ब्रांड नीतियां',
      'frictionRulesSubtitle': 'सबसे अधिक बार चेतावनी ट्रिगर करने वाले नियम',
      'immutableLedgerTitle': 'क्रिप्टोग्राफ़िक ऑडिट ट्रेल (SHA-256)',
      'immutableLedgerSubtitle': 'सभी अनुमोदित डिलिवरेबल्स में छेड़छाड़-मुक्त ब्लॉक सत्यापन',

      // Integrations
      'integrationsTitle': 'कनेक्टेड टूल्स और CI/CD एक्सटेंशन',
      'integrationsSubtitle': 'डिज़ाइन और कोड पाइपलाइनों में निरंतर ब्रांड नीति प्रवर्तन',
      'googleDocsTitle': 'Google डॉक्स ऐड-ऑन',
      'googleDocsDesc': 'Google कार्यस्थान में लिखते समय वास्तविक समय में ब्रांड दिशानिर्देशों का ऑडिट करें।',
      'figmaTitle': 'Figma डिज़ाइन लिंटर',
      'figmaDesc': 'WCAG 2.1 रंग कंट्रास्ट और स्वीकृत ब्रांड टोकन के लिए फिग्मा फ्रेम स्कैन करें।',
      'gitlabTitle': 'GitLab CI/CD सेल्फ-सर्विस वेबहुक',
      'gitlabDesc': 'तैनाती से पहले मर्ज अनुरोधों पर गैर-अनुपालक कॉपी और संपत्तियों को रोकें।',
      'statusConnected': 'कनेक्टेड और सत्यापित',
      'statusActive': 'सक्रिय एकीकरण',
      'statusSetup': 'सेटअप निर्देश',

      // Tour
      'tour_step': 'स्टेप {x} / {y}',
      'tour_btn_next': 'आगे',
      'tour_btn_back': 'वापस',
      'tour_btn_finish': 'टूर समाप्त',
      'tour_btn_skip': 'टूर छोड़ें',
      'tour_all_set': 'आप पूरी तरह तैयार हैं!',

      // Settings & Profile
      'settings_title': 'प्रोफाइल और प्राथमिकताएं',
      'settings_role': 'मूल्यांकन भूमिका',
      'settings_switch_role': 'भूमिका बदलें',
      'settings_language': 'एप्लिकेशन भाषा',
      'settings_api_endpoint': 'बैकएंड API एंडपॉइंट',
      'settings_restart_tour': 'गाइडेड टूर दोबारा शुरू करें',
      'settings_logout': 'लॉग आउट',
    },
  };

  String t(String key, {Map<String, dynamic>? params}) {
    final dict = _localizedValues[locale] ?? _localizedValues['en']!;
    var str = dict[key] ?? _localizedValues['en']![key] ?? key;
    if (params != null) {
      params.forEach((k, v) {
        str = str.replaceAll('{$k}', v.toString());
      });
    }
    return str;
  }

  String translate(String key, {Map<String, dynamic>? params}) => t(key, params: params);
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['en', 'hi'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale.languageCode);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
