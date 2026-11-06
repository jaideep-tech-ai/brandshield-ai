"use client";

import { registerDict } from "@/lib/brandshield/i18n";

// ─── Settings view — EN ⇄ HI ─────────────────────────────────────────────────
// Role badges use `common.role.*`; member names, emails and departments are
// data and never translated.

const dict = {
  en: {
    // Header
    "title": "Settings",
    "subtitle": "Organization profile, access control and governance settings.",
    "subtitleNonAdmin": "Organization profile and governance controls.",

    // Non-admin gate
    "gate.title": "Settings are reserved for Brand Admins.",
    "gate.desc": "Organization profile, access control and governance settings are managed by your workspace administrators.",

    // Organization
    "org.title": "Organization",
    "org.desc": "Workspace identity and data-governance controls.",
    "org.name": "Organization name",
    "org.namePlaceholder": "Your organization name",
    "org.slug": "Workspace slug",
    "org.zdr": "Zero-Data-Retention",
    "org.zdrActive": "ZDR Active",
    "org.zdr.descOn": "When enabled, proprietary campaign drafts and documents are never used for external model training (enterprise LLM calls run with data-retention disabled).",
    "org.zdr.descOff": "When disabled, campaign drafts and documents may be retained by enterprise LLM providers under standard data-processing terms.",
    "org.zdrAria": "Toggle zero-data-retention",

    // Team & access control
    "team.title": "Team & Access Control",
    "team.descOne": "{n} member in {org}.",
    "team.descMany": "{n} members in {org}.",
    "team.noMembers": "No team members found.",
    "team.colName": "Member",
    "team.colRole": "Role",
    "team.colDepartment": "Department",

    // Role permission matrix
    "perm.title": "Role Permission Matrix",
    "perm.desc": "Capabilities granted to each role across the governance workflow.",
    "perm.colCapability": "Capability",
    "perm.row.scans": "Run pre-flight scans",
    "perm.row.submit": "Submit for review",
    "perm.row.approve": "Approve / request changes",
    "perm.row.kb": "Manage knowledge base",
    "perm.row.billing": "Billing & subscription",
    "perm.row.analytics": "Analytics & rule friction",
    "perm.row.override": "Override findings",
    "perm.allowed": "Allowed",
    "perm.notAllowed": "Not allowed",

    // Session
    "session.title": "Session",
    "session.desc": "Your current signed-in identity.",
    "session.noDept": "No department",

    // Preferences
    "prefs.title": "Preferences",
    "prefs.desc": "Display and accessibility choices for your account.",
    "prefs.lang": "Interface language / इंटरफ़ेस भाषा",
    "prefs.langHint": "Display only — switch languages anytime from the toggle in the header.",

    // Toasts
    "toast.zdrOn": "Zero-data-retention enabled",
    "toast.zdrOff": "Zero-data-retention disabled",
    "toast.orgError": "Could not update organization settings.",
  },

  hi: {
    // Header
    "title": "सेटिंग्स",
    "subtitle": "संगठन प्रोफ़ाइल, एक्सेस नियंत्रण और गवर्नेंस सेटिंग्स।",
    "subtitleNonAdmin": "संगठन प्रोफ़ाइल और गवर्नेंस नियंत्रण।",

    // Non-admin gate
    "gate.title": "सेटिंग्स केवल ब्रांड एडमिन के लिए आरक्षित हैं।",
    "gate.desc": "संगठन प्रोफ़ाइल, एक्सेस नियंत्रण और गवर्नेंस सेटिंग्स आपके वर्कस्पेस एडमिनिस्ट्रेटर प्रबंधित करते हैं।",

    // Organization
    "org.title": "संगठन",
    "org.desc": "वर्कस्पेस पहचान और डेटा-गवर्नेंस नियंत्रण।",
    "org.name": "संगठन का नाम",
    "org.namePlaceholder": "आपके संगठन का नाम",
    "org.slug": "वर्कस्पेस स्लैग",
    "org.zdr": "ज़ीरो-डेटा-रिटेंशन",
    "org.zdrActive": "ZDR सक्रिय",
    "org.zdr.descOn": "सक्रिय होने पर आपके मालिकाना कैंपेन ड्राफ़्ट और दस्तावेज़ कभी भी बाहरी मॉडल ट्रेनिंग के लिए उपयोग नहीं होते (एंटरप्राइज़ LLM कॉल डेटा-रिटेंशन बंद करके चलते हैं)।",
    "org.zdr.descOff": "निष्क्रिय होने पर कैंपेन ड्राफ़्ट और दस्तावेज़ मानक डेटा-प्रोसेसिंग शर्तों के तहत एंटरप्राइज़ LLM प्रोवाइडर के पास रखे जा सकते हैं।",
    "org.zdrAria": "ज़ीरो-डेटा-रिटेंशन टॉगल करें",

    // Team & access control
    "team.title": "टीम और एक्सेस नियंत्रण",
    "team.descOne": "{org} में {n} सदस्य।",
    "team.descMany": "{org} में {n} सदस्य।",
    "team.noMembers": "कोई टीम सदस्य नहीं मिला।",
    "team.colName": "सदस्य",
    "team.colRole": "भूमिका",
    "team.colDepartment": "विभाग",

    // Role permission matrix
    "perm.title": "भूमिका अनुमति मैट्रिक्स",
    "perm.desc": "गवर्नेंस वर्कफ़्लो में प्रत्येक भूमिका को दी गई क्षमताएँ।",
    "perm.colCapability": "क्षमता",
    "perm.row.scans": "प्री-फ़्लाइट स्कैन चलाएँ",
    "perm.row.submit": "समीक्षा के लिए भेजें",
    "perm.row.approve": "स्वीकृति दें / बदलाव माँगें",
    "perm.row.kb": "नॉलेज बेस प्रबंधित करें",
    "perm.row.billing": "बिलिंग और सब्सक्रिप्शन",
    "perm.row.analytics": "एनालिटिक्स और रूल फ्रिक्शन",
    "perm.row.override": "फ़ाइंडिंग्स ओवरराइड करें",
    "perm.allowed": "अनुमत",
    "perm.notAllowed": "अनुमत नहीं",

    // Session
    "session.title": "सेशन",
    "session.desc": "आपकी वर्तमान साइन-इन पहचान।",
    "session.noDept": "कोई विभाग नहीं",

    // Preferences
    "prefs.title": "प्राथमिकताएँ",
    "prefs.desc": "आपके खाते के लिए डिस्प्ले और एक्सेसिबिलिटी विकल्प।",
    "prefs.lang": "Interface language / इंटरफ़ेस भाषा",
    "prefs.langHint": "केवल दिखाने के लिए — भाषा कभी भी हेडर के टॉगल से बदलें।",

    // Toasts
    "toast.zdrOn": "ज़ीरो-डेटा-रिटेंशन सक्रिय किया गया",
    "toast.zdrOff": "ज़ीरो-डेटा-रिटेंशन निष्क्रिय किया गया",
    "toast.orgError": "संगठन सेटिंग्स अपडेट नहीं हो सकीं।",
  },
} as const;

registerDict("settings", dict);
