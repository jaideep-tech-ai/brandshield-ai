"use client";

import { registerDict } from "./index";

// ─── Shared vocabulary used across every view ────────────────────────────────

const dict = {
  en: {
    "severity.critical": "Critical — Claim Mismatch",
    "severity.warning": "Warning — Tone / Visual Drift",
    "severity.minor": "Minor — Style",

    "category.claim": "Factual Claim",
    "category.tone": "Tone of Voice",
    "category.visual": "Visual / WCAG",
    "category.style": "Style Mechanics",
    "category.trademark": "Trademark",

    "status.draft": "Draft",
    "status.in_review": "In Review",
    "status.changes_requested": "Changes Requested",
    "status.approved": "Approved",

    "role.creator": "Content Creator",
    "role.reviewer": "Brand Manager / Legal",
    "role.contractor": "External Agency",
    "role.admin": "CMO / Brand Admin",

    "tier.starter": "Starter — Agency Sandbox",
    "tier.growth": "Growth — Team Governance",
    "tier.enterprise": "Enterprise — Custom Shield",

    "verdict.SUPPORTED": "Supported",
    "verdict.UNSUPPORTED": "Unsupported",
    "verdict.UNVERIFIABLE": "Unverifiable",

    "stage.deterministic": "Deterministic pre-filter",
    "stage.ai": "AI verification",
    "stage.vision": "Vision check",

    "finding.open": "Open",
    "finding.resolved": "Resolved",
    "finding.overridden": "Overridden",

    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.delete": "Delete",
    "action.close": "Close",
    "action.back": "Back",
    "action.next": "Next",
    "action.finish": "Finish",
    "action.retry": "Try again",
    "action.viewAll": "View all",
    "action.open": "Open",
    "action.edit": "Edit",
    "action.copy": "Copy",
    "action.copied": "Copied!",
    "action.loading": "Loading…",
    "action.saving": "Saving…",
    "action.search": "Search",
    "action.confirm": "Confirm",
    "action.upload": "Upload",

    "state.empty": "Nothing here yet",
    "state.error": "Something went wrong",

    "score.of100": "{score}/100",
    "count.items": "{n} items",
  },

  hi: {
    "severity.critical": "गंभीर — दावा बेमेल",
    "severity.warning": "चेतावनी — टोन / विज़ुअल ड्रिफ़्ट",
    "severity.minor": "सामान्य — स्टाइल",

    "category.claim": "तथ्यात्मक दावा",
    "category.tone": "आवाज़ की टोन",
    "category.visual": "विज़ुअल / WCAG",
    "category.style": "स्टाइल मैकेनिक्स",
    "category.trademark": "ट्रेडमार्क",

    "status.draft": "ड्राफ़्ट",
    "status.in_review": "समीक्षा में",
    "status.changes_requested": "बदलाव माँगे गए",
    "status.approved": "स्वीकृत",

    "role.creator": "कंटेंट क्रिएटर",
    "role.reviewer": "ब्रांड मैनेजर / लीगल",
    "role.contractor": "बाहरी एजेंसी",
    "role.admin": "CMO / ब्रांड एडमिन",

    "tier.starter": "स्टार्टर — एजेंसी सैंडबॉक्स",
    "tier.growth": "ग्रोथ — टीम गवर्नेंस",
    "tier.enterprise": "एंटरप्राइज़ — कस्टम शील्ड",

    "verdict.SUPPORTED": "समर्थित",
    "verdict.UNSUPPORTED": "असमर्थित",
    "verdict.UNVERIFIABLE": "सत्यापन असंभव",

    "stage.deterministic": "डिटरमिनिस्टिक प्री-फ़िल्टर",
    "stage.ai": "AI सत्यापन",
    "stage.vision": "विज़न जाँच",

    "finding.open": "खुला",
    "finding.resolved": "हल किया",
    "finding.overridden": "ओवरराइड किया",

    "action.save": "सेव करें",
    "action.cancel": "रद्द करें",
    "action.delete": "हटाएँ",
    "action.close": "बंद करें",
    "action.back": "वापस",
    "action.next": "आगे",
    "action.finish": "समाप्त",
    "action.retry": "फिर कोशिश करें",
    "action.viewAll": "सभी देखें",
    "action.open": "खोलें",
    "action.edit": "संपादित करें",
    "action.copy": "कॉपी",
    "action.copied": "कॉपी हो गया!",
    "action.loading": "लोड हो रहा है…",
    "action.saving": "सेव हो रहा है…",
    "action.search": "खोजें",
    "action.confirm": "पुष्टि करें",
    "action.upload": "अपलोड",

    "state.empty": "यहाँ अभी कुछ नहीं है",
    "state.error": "कुछ गड़बड़ हो गई",

    "score.of100": "{score}/100",
    "count.items": "{n} आइटम",
  },
} as const;

registerDict("common", dict);
