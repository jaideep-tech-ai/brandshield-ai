"use client";

import { registerDict } from "./index";

// ─── Stage 3 — Findings & Remediation ────────────────────────────────────────
// LLM-generated data (rationale, suggestion, citation, overrideNote) is never
// translated — only UI chrome lives here. Severity/category/status/stage/
// verdict/finding-state labels come from the shared "common" namespace.

const dict = {
  en: {
    // Submission selector strip
    "submissions.empty": "No submissions yet — run a pre-flight scan first.",

    // Workspace
    "loading": "Loading workspace…",
    "unassigned": "Unassigned",

    // Toolbar
    "action.rescan": "Re-scan",
    "rescan.tooltip": "Runs the two-stage pipeline again on the current revision",
    "action.submitReview": "Submit for review",
    "blockedCritical": "{n} critical finding{s} must be resolved or justified",
    "scanFirst": "Run a scan before submitting for review",

    // Inspection meta
    "meta.lastInspection": "Last inspection",
    "meta.pipeline": "{sec}s pipeline",
    "meta.stage1": "Stage 1 deterministic: {ms}ms",
    "meta.strictJson": "Strict JSON citations: enforced",

    // Findings list
    "findings.title": "Findings",
    "findings.openCount": "({n} open)",
    "filter.all": "All",
    "empty.title": "No open findings in this view",
    "empty.sub": "The copy aligns with the ground-truth repository.",

    // Banner annotator
    "banner.alt": "Submitted banner",
    "banner.paletteHint": "Extracted palette — click a swatch to inspect violations",

    // Finding card
    "fix.label": "Tone-preserving fix:",
    "rewrite.hint": "Generate a one-click rewrite that preserves your creative nuance.",
    "action.applyFix": "Apply fix",
    "action.oneClickRewrite": "One-click rewrite",
    "action.override": "Override with justification",
    "justification.label": "Justification:",

    // Override dialog
    "override.title": "Override finding",
    "override.desc": "Overriding skips the suggested fix. Your justification is written to the tamper-evident audit log and shown to reviewers.",
    "override.ph": "e.g. This phrase is part of a registered co-marketing claim agreed with Legal on Mar 3 (contract #CS-221).",
    "override.record": "Record override",

    // Toasts
    "toast.applied": "Rewrite applied",
    "toast.appliedDesc.contentUpdated": "Copy updated and a new revision was recorded.",
    "toast.appliedDesc.resolved": "Finding marked as resolved.",
    "toast.applyFail": "Could not apply rewrite",
    "toast.noRewrite": "No rewrite produced — try overriding with a justification instead",
    "toast.aiApplied": "AI rewrite applied to the copy",
    "toast.rewriteFail": "Rewrite failed",
    "toast.overridden": "Finding overridden with justification — recorded in the audit trail",
    "toast.overrideFail": "Override failed",
    "toast.submitted": "Submitted to the review board",
    "toast.submitFail": "Could not submit",
    "toast.rescanDone": "Re-scan complete",
    "toast.failed": "Scan failed",
  },

  hi: {
    // Submission selector strip
    "submissions.empty": "अभी कोई सबमिशन नहीं — पहले प्री-फ़्लाइट स्कैन चलाएँ।",

    // Workspace
    "loading": "वर्कस्पेस लोड हो रहा है…",
    "unassigned": "अनअसाइंड",

    // Toolbar
    "action.rescan": "फिर स्कैन करें",
    "rescan.tooltip": "वर्तमान रिविज़न पर दो-चरणीय पाइपलाइन दोबारा चलाता है",
    "action.submitReview": "समीक्षा के लिए भेजें",
    "blockedCritical": "{n} गंभीर फ़ाइंडिंग को हल करना या औचित्य देना ज़रूरी है",
    "scanFirst": "समीक्षा के लिए भेजने से पहले स्कैन चलाएँ",

    // Inspection meta
    "meta.lastInspection": "अंतिम निरीक्षण",
    "meta.pipeline": "{sec}s पाइपलाइन",
    "meta.stage1": "चरण 1 डिटरमिनिस्टिक: {ms}ms",
    "meta.strictJson": "सख़्त JSON साइटेशन: लागू",

    // Findings list
    "findings.title": "फ़ाइंडिंग",
    "findings.openCount": "({n} खुली)",
    "filter.all": "सभी",
    "empty.title": "इस दृश्य में कोई खुली फ़ाइंडिंग नहीं",
    "empty.sub": "कॉपी ग्राउंड-ट्रुथ रिपॉज़िटरी के अनुरूप है।",

    // Banner annotator
    "banner.alt": "प्रस्तुत बैनर",
    "banner.paletteHint": "निकाला गया पैलेट — उल्लंघन देखने के लिए किसी स्वैच पर क्लिक करें",

    // Finding card
    "fix.label": "टोन-संरक्षी सुधार:",
    "rewrite.hint": "एक-क्लिक पुनर्लेखन बनाएँ जो आपकी रचनात्मक बारीकी बनाए रखे।",
    "action.applyFix": "सुधार लागू करें",
    "action.oneClickRewrite": "एक-क्लिक पुनर्लेखन",
    "action.override": "औचित्य के साथ ओवरराइड करें",
    "justification.label": "औचित्य:",

    // Override dialog
    "override.title": "फ़ाइंडिंग ओवरराइड करें",
    "override.desc": "ओवरराइड करने पर सुझाया गया सुधार छोड़ दिया जाता है। आपका औचित्य छेड़छाड़-रोधी ऑडिट लॉग में दर्ज होता है और समीक्षकों को दिखाया जाता है।",
    "override.ph": "जैसे: यह वाक्यांश एक पंजीकृत सह-मार्केटिंग दावे का हिस्सा है जिस पर 3 मार्च को लीगल से सहमति बनी थी (अनुबंध #CS-221)।",
    "override.record": "ओवरराइड दर्ज करें",

    // Toasts
    "toast.applied": "पुनर्लेखन लागू हुआ",
    "toast.appliedDesc.contentUpdated": "कॉपी अपडेट हुई और एक नया रिविज़न दर्ज हुआ।",
    "toast.appliedDesc.resolved": "फ़ाइंडिंग को हल की गई के रूप में चिह्नित किया गया।",
    "toast.applyFail": "पुनर्लेखन लागू नहीं हो सका",
    "toast.noRewrite": "कोई पुनर्लेखन नहीं बना — इसके बजाय औचित्य के साथ ओवरराइड करें",
    "toast.aiApplied": "AI पुनर्लेखन कॉपी पर लागू हो गया",
    "toast.rewriteFail": "पुनर्लेखन विफल हुआ",
    "toast.overridden": "फ़ाइंडिंग औचित्य सहित ओवरराइड हुई — ऑडिट ट्रेल में दर्ज",
    "toast.overrideFail": "ओवरराइड विफल हुआ",
    "toast.submitted": "समीक्षा बोर्ड को भेज दिया गया",
    "toast.submitFail": "भेजा नहीं जा सका",
    "toast.rescanDone": "दोबारा स्कैन पूर्ण",
    "toast.failed": "स्कैन विफल हुआ",
  },
} as const;

registerDict("findings", dict);
