"use client";

import { registerDict } from "./index";

// ─── Role dashboards B — Contractor "Client Sandbox" + Admin "Governance HQ" ──

const dictContractor = {
  en: {
    "hero.eyebrow": "Client Sandbox",
    "hero.badge.sandbox": "Sandbox mode",
    "hero.badge.zdr": "Zero-Data-Retention",
    welcome: "Welcome back, {name}",
    "hero.explainer": "Private sandbox — nothing reaches the client until you submit formally.",

    "precheck.title": "Run a risk-free pre-check",
    "precheck.desc": "Check copy or banners against your client's approved guidelines — before anything leaves your agency.",
    "precheck.cta": "Run a pre-check",

    "usage.label": "Scan usage",
    "usage.unlimited": "Unlimited scans",
    "usage.resets": "Resets {date}",
    "usage.exhausted": "Scan quota exhausted for this cycle.",
    "usage.exhaustedNote": "Ask your client contact to upgrade the plan.",

    "steps.title": "How it works",
    "step1.title": "Paste or upload",
    "step1.desc": "Drop in copy or a banner straight from your workspace.",
    "step2.title": "Instant pre-check",
    "step2.desc": "Deterministic checks land in under 100 ms, then AI verification adds context.",
    "step3.title": "Fix & share",
    "step3.desc": "Apply one-click rewrites, then submit formally when you're confident.",

    "history.title": "My pre-check history",
    "history.empty": "No pre-checks yet — your sandbox history will appear here.",
    "history.cta": "Run your first pre-check",

    "guidelines.title": "Client guidelines peek",
    "guidelines.empty": "No guideline documents shared with you yet.",
    "guidelines.chunks": "{n} chunks",
    "guidelines.browse": "Browse knowledge base",

    "upgrade.title": "Unlock the Growth plan",
    "upgrade.desc": "Unlimited scans, RAG claim verification, and rewrite tools for the whole agency.",
    "upgrade.note": "Managed by your client's admin",
  },

  hi: {
    "hero.eyebrow": "क्लाइंट सैंडबॉक्स",
    "hero.badge.sandbox": "सैंडबॉक्स मोड",
    "hero.badge.zdr": "ज़ीरो-डेटा-रिटेंशन",
    welcome: "वापसी पर स्वागत है, {name}",
    "hero.explainer": "निजी सैंडबॉक्स — औपचारिक सबमिशन तक कुछ भी क्लाइंट तक नहीं पहुँचता।",

    "precheck.title": "जोखिम-मुक्त प्री-चेक चलाएँ",
    "precheck.desc": "क्लाइंट की स्वीकृत गाइडलाइन के विरुद्ध कॉपी या बैनर जाँचें — कुछ भी आपकी एजेंसी से बाहर जाने से पहले।",
    "precheck.cta": "प्री-चेक चलाएँ",

    "usage.label": "स्कैन उपयोग",
    "usage.unlimited": "असीमित स्कैन",
    "usage.resets": "{date} को रीसेट",
    "usage.exhausted": "इस चक्र के लिए स्कैन कोटा समाप्त हो गया।",
    "usage.exhaustedNote": "प्लान अपग्रेड के लिए अपने क्लाइंट कॉन्टैक्ट से बात करें।",

    "steps.title": "यह कैसे काम करता है",
    "step1.title": "पेस्ट या अपलोड करें",
    "step1.desc": "अपने वर्कस्पेस से सीधे कॉपी या बैनर जोड़ें।",
    "step2.title": "इंस्टेंट प्री-चेक",
    "step2.desc": "डिटरमिनिस्टिक जाँच 100 ms से कम में, फिर AI सत्यापन संदर्भ जोड़ता है।",
    "step3.title": "सुधारें और साझा करें",
    "step3.desc": "एक-क्लिक रीराइट लागू करें, फिर पूरे भरोसे के साथ औपचारिक सबमिशन करें।",

    "history.title": "मेरा प्री-चेक इतिहास",
    "history.empty": "अभी कोई प्री-चेक नहीं — आपका सैंडबॉक्स इतिहास यहाँ दिखेगा।",
    "history.cta": "अपना पहला प्री-चेक चलाएँ",

    "guidelines.title": "क्लाइंट गाइडलाइन झलक",
    "guidelines.empty": "अभी आपके साथ कोई गाइडलाइन दस्तावेज़ साझा नहीं किया गया।",
    "guidelines.chunks": "{n} चंक",
    "guidelines.browse": "नॉलेज बेस ब्राउज़ करें",

    "upgrade.title": "ग्रोथ प्लान अनलॉक करें",
    "upgrade.desc": "असीमित स्कैन, RAG दावा सत्यापन, और पूरी एजेंसी के लिए रीराइट टूल्स।",
    "upgrade.note": "आपके क्लाइंट के एडमिन द्वारा प्रबंधित",
  },
} as const;

const dictAdmin = {
  en: {
    "hero.eyebrow": "Governance HQ",
    welcome: "Welcome back, {name}",
    "hero.tagline": "The full governance picture — quality, drift, spend, and people.",
    "hero.kb": "Manage knowledge base",
    "hero.analytics": "View analytics",

    "kpi.submissions": "Team submissions",
    "kpi.avgCompliance": "Avg compliance",
    "kpi.openFindings": "Open findings",
    "kpi.approved": "Approved",

    "health.title": "Brand health",
    "health.healthy": "Healthy",
    "health.watch": "Watch",
    "health.atRisk": "At risk",
    "health.approvedRate": "Approved rate",
    "health.scans": "Scans",
    "health.findings": "Findings",
    "health.resolution": "Avg resolution",
    "health.hours": "{n}h",

    "rules.title": "Top violated rules",
    "rules.count": "{n} hits",
    "rules.empty": "No violations recorded yet — the guidelines are landing clean.",

    "friction.title": "Rules causing friction",
    "friction.desc": "These rules get overridden often — they may be ambiguous or outdated.",
    "friction.overrideRate": "Override rate",
    "friction.triggers": "{n} triggers",
    "friction.openAnalytics": "Open analytics",

    "kb.title": "Knowledge base health",
    "kb.docs": "Documents",
    "kb.chunks": "Indexed chunks",
    "kb.updated": "Last updated",
    "kb.manage": "Manage KB",
    "kb.empty": "No documents yet — add your first guideline.",

    "billing.title": "Billing snapshot",
    "billing.plan": "Plan",
    "billing.seats": "Seats",
    "billing.scans": "Scans used",
    "billing.unlimited": "Unlimited",
    "billing.renews": "Renews",
    "billing.manage": "Manage billing",

    "team.title": "Team pulse",
    "team.empty": "No team members yet.",
  },

  hi: {
    "hero.eyebrow": "गवर्नेंस HQ",
    welcome: "वापसी पर स्वागत है, {name}",
    "hero.tagline": "पूरी गवर्नेंस तस्वीर — गुणवत्ता, ड्रिफ़्ट, खर्च और लोग।",
    "hero.kb": "नॉलेज बेस प्रबंधित करें",
    "hero.analytics": "एनालिटिक्स देखें",

    "kpi.submissions": "टीम सबमिशन",
    "kpi.avgCompliance": "औसत अनुपालन",
    "kpi.openFindings": "खुले फाइंडिंग",
    "kpi.approved": "स्वीकृत",

    "health.title": "ब्रांड हेल्थ",
    "health.healthy": "स्वस्थ",
    "health.watch": "निगरानी में",
    "health.atRisk": "जोखिम में",
    "health.approvedRate": "स्वीकृति दर",
    "health.scans": "स्कैन",
    "health.findings": "फाइंडिंग",
    "health.resolution": "औसत समाधान",
    "health.hours": "{n} घं.",

    "rules.title": "सर्वाधिक उल्लंघित नियम",
    "rules.count": "{n} बार",
    "rules.empty": "अभी कोई उल्लंघन दर्ज नहीं — गाइडलाइन साफ़ चल रही हैं।",

    "friction.title": "घर्षण पैदा करने वाले नियम",
    "friction.desc": "इन नियमों को बार-बार ओवरराइड किया जाता है — ये अस्पष्ट या पुराने हो सकते हैं।",
    "friction.overrideRate": "ओवरराइड दर",
    "friction.triggers": "{n} ट्रिगर",
    "friction.openAnalytics": "एनालिटिक्स खोलें",

    "kb.title": "नॉलेज बेस स्वास्थ्य",
    "kb.docs": "दस्तावेज़",
    "kb.chunks": "इंडेक्स किए चंक",
    "kb.updated": "अंतिम अपडेट",
    "kb.manage": "KB प्रबंधित करें",
    "kb.empty": "अभी कोई दस्तावेज़ नहीं — पहली गाइडलाइन जोड़ें।",

    "billing.title": "बिलिंग स्नैपशॉट",
    "billing.plan": "प्लान",
    "billing.seats": "सीट",
    "billing.scans": "उपयोग किए स्कैन",
    "billing.unlimited": "असीमित",
    "billing.renews": "नवीनीकरण",
    "billing.manage": "बिलिंग प्रबंधित करें",

    "team.title": "टीम पल्स",
    "team.empty": "अभी कोई टीम सदस्य नहीं।",
  },
} as const;

registerDict("dash.contractor", dictContractor);
registerDict("dash.admin", dictAdmin);
