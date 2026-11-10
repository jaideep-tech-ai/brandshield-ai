"use client";

import { registerDict } from "@/lib/brandshield/i18n";

// ─── App shell: sidebar / header / footer / mobile nav ───────────────────────

const dict = {
  en: {
    "nav.dashboard": "Overview",
    "nav.copilot": "AI Copilot",
    "nav.knowledge": "Knowledge Base",
    "nav.scanner": "Pre-Flight Scanner",
    "nav.findings": "Findings & Remediation",
    "nav.approvals": "Approval Board",
    "nav.analytics": "Analytics",
    "nav.integrations": "Integrations & Extensions",
    "nav.billing": "Billing",
    "nav.settings": "Settings",

    "navShort.dashboard": "Home",
    "navShort.copilot": "Copilot",
    "navShort.knowledge": "Knowledge",
    "navShort.scanner": "Scanner",
    "navShort.findings": "Findings",
    "navShort.approvals": "Approvals",
    "navShort.analytics": "Analytics",
    "navShort.integrations": "Extensions",
    "navShort.billing": "Billing",
    "navShort.settings": "Settings",

    "sidebar.collapse": "Collapse",
    "sidebar.collapseTitle": "Collapse sidebar",
    "sidebar.expandTitle": "Expand sidebar",

    "header.tour": "Take the tour",
    "header.tourAria": "Take the guided product tour",
    "header.zdr": "ZDR On",
    "header.zdrTitle": "Zero-Data-Retention: your drafts are never used for model training",
    "header.accountAria": "Account menu",

    "account.tour": "Take the guided tour",
    "account.signOut": "Sign out",

    "mobile.navAria": "Open navigation",
    "mobile.sheetDesc": "Application navigation",
    "mobile.more": "More",
    "mobile.moreAria": "More navigation",
    "mobile.moreDesc": "Remaining tools for your role",

    "footer.line1": "BrandShield AI — Explainable pre-publishing governance",
    "footer.line2": "SHA-256 audit trail",
    "footer.line3": "WCAG 2.1 visual checks",

    "aria.goOverview": "Go to overview",
    "aria.primary": "Primary",
  },

  hi: {
    "nav.dashboard": "अवलोकन",
    "nav.copilot": "AI कोपायलट",
    "nav.knowledge": "नॉलेज बेस",
    "nav.scanner": "प्री-फ़्लाइट स्कैनर",
    "nav.findings": "फाइंडिंग्स और सुधार",
    "nav.approvals": "स्वीकृति बोर्ड",
    "nav.analytics": "एनालिटिक्स",
    "nav.integrations": "इंटीग्रेशन और एक्सटेंशन",
    "nav.billing": "बिलिंग",
    "nav.settings": "सेटिंग्स",

    "navShort.dashboard": "होम",
    "navShort.copilot": "कोपायलट",
    "navShort.knowledge": "नॉलेज",
    "navShort.scanner": "स्कैनर",
    "navShort.findings": "फाइंडिंग्स",
    "navShort.approvals": "स्वीकृति",
    "navShort.analytics": "एनालिटिक्स",
    "navShort.integrations": "इंटीग्रेशन",
    "navShort.billing": "बिलिंग",
    "navShort.settings": "सेटिंग्स",

    "sidebar.collapse": "सिकोड़ें",
    "sidebar.collapseTitle": "साइडबार सिकोड़ें",
    "sidebar.expandTitle": "साइडबार फैलाएँ",

    "header.tour": "टूर लें",
    "header.tourAria": "गाइडेड प्रोडक्ट टूर लें",
    "header.zdr": "ZDR चालू",
    "header.zdrTitle": "Zero-Data-Retention: आपके ड्राफ़्ट कभी भी मॉडल ट्रेनिंग के लिए इस्तेमाल नहीं होते",
    "header.accountAria": "अकाउंट मेन्यू",

    "account.tour": "गाइडेड टूर लें",
    "account.signOut": "साइन आउट",

    "mobile.navAria": "नेविगेशन खोलें",
    "mobile.sheetDesc": "ऐप नेविगेशन",
    "mobile.more": "और",
    "mobile.moreAria": "अधिक नेविगेशन",
    "mobile.moreDesc": "आपकी भूमिका के बाकी टूल",

    "footer.line1": "BrandShield AI — व्याख्या-योग्य प्रकाशन-पूर्व गवर्नेंस",
    "footer.line2": "SHA-256 ऑडिट ट्रेल",
    "footer.line3": "WCAG 2.1 विज़ुअल जाँच",

    "aria.goOverview": "अवलोकन पर जाएँ",
    "aria.primary": "प्राथमिक",
  },
} as const;

registerDict("shell", dict);
