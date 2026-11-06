"use client";

import { registerDict } from "./index";

// ─── Stage 5 · Analytics — English ⇄ हिन्दी ──────────────────────────────────

const dict = {
  en: {
    // Page header
    "title": "Brand Drift & Rule Friction Analytics",
    "subtitle": "Continuous governance — where content drifts, which rules get violated, and which policies confuse your teams.",
    "feedbackBadge": "Bi-directional feedback loop active",
    "loading": "Crunching governance data…",

    // KPI stat band
    "statAvgCompliance": "Avg compliance score",
    "statScans": "Pre-flight scans",
    "statOpenFindings": "Open findings",
    "statAvgResolution": "Avg resolution time",
    "valueResolution": "{h}h",

    // Charts
    "chartVelocity": "Governance velocity — last 14 days",
    "seriesScans": "Scans",
    "seriesFindings": "Findings",
    "chartSeverity": "Severity mix",
    "chartTopRules": "Top violated rules",
    "noViolations": "No violations recorded yet.",
    "violationsCount": "{n} violations",
    "count": "Count",
    "chartDept": "Department compliance scores",
    "noDeptScores": "No scored submissions yet.",
    "draftsCount": "{n} drafts",

    // Bi-directional feedback (ambiguous policies)
    "ambiguousTitle": "Bi-directional feedback — rules flagged as ambiguous / high friction",
    "ambiguousHint": "repeated triggers across teams → refine the rule",
    "noFriction": "No policy friction detected — teams are finding the guidelines clear.",
    "frictionAmbiguous": "Ambiguous",
    "frictionHigh": "High friction",
    "frictionWatch": "Watch",
    "triggersCount": "{n} triggers",
    "overriddenPct": "{n}% overridden",
    "openPct": "{n}% still open",
    "refineGuideline": "Refine guideline →",
  },

  hi: {
    // पेज हेडर
    "title": "ब्रांड ड्रिफ़्ट और नियम फ्रिक्शन एनालिटिक्स",
    "subtitle": "निरंतर गवर्नेंस — कंटेंट कहाँ ड्रिफ़्ट करता है, कौन से नियम उल्लंघित होते हैं, और कौन सी नीतियाँ आपकी टीमों को उलझन में डालती हैं।",
    "feedbackBadge": "द्विदिशात्मक फ़ीडबैक लूप सक्रिय",
    "loading": "गवर्नेंस डेटा संसाधित हो रहा है…",

    // KPI आँकड़ा पट्टी
    "statAvgCompliance": "औसत अनुपालन स्कोर",
    "statScans": "प्री-फ़्लाइट स्कैन",
    "statOpenFindings": "खुले निष्कर्ष",
    "statAvgResolution": "औसत समाधान समय",
    "valueResolution": "{h} घंटे",

    // चार्ट
    "chartVelocity": "गवर्नेंस वेग — पिछले 14 दिन",
    "seriesScans": "स्कैन",
    "seriesFindings": "निष्कर्ष",
    "chartSeverity": "गंभीरता मिश्रण",
    "chartTopRules": "सर्वाधिक उल्लंघित नियम",
    "noViolations": "अभी कोई उल्लंघन दर्ज नहीं है।",
    "violationsCount": "{n} उल्लंघन",
    "count": "गिनती",
    "chartDept": "विभागीय अनुपालन स्कोर",
    "noDeptScores": "अभी कोई स्कोर किया गया सबमिशन नहीं।",
    "draftsCount": "{n} ड्राफ़्ट",

    // द्विदिशात्मक फ़ीडबैक (अस्पष्ट नीतियाँ)
    "ambiguousTitle": "द्विदिशात्मक फ़ीडबैक — अस्पष्ट / उच्च फ्रिक्शन चिह्नित नियम",
    "ambiguousHint": "टीमों में बार-बार ट्रिगर → नियम सुधारें",
    "noFriction": "कोई नीति फ्रिक्शन नहीं मिला — टीमों को दिशानिर्देश स्पष्ट लग रहे हैं।",
    "frictionAmbiguous": "अस्पष्ट",
    "frictionHigh": "उच्च फ्रिक्शन",
    "frictionWatch": "निगरानी में",
    "triggersCount": "{n} ट्रिगर",
    "overriddenPct": "{n}% ओवरराइड",
    "openPct": "{n}% अभी खुले",
    "refineGuideline": "दिशानिर्देश सुधारें →",
  },
} as const;

registerDict("analytics", dict);
