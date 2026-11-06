"use client";

import { registerDict } from "./index";

// ─── Stage 4 · Approval Board — English ⇄ हिन्दी ──────────────────────────────

const dict = {
  en: {
    // Page header / board
    "title": "Approval Board",
    "subtitle": "Draft → In Review → Changes Requested → Approved, with a tamper-evident sign-off trail.",
    "reviewerBadge": "Reviewer authority · {count} awaiting review",
    "emptyColumn": "Empty",
    "typeBanner": "banner",
    "findingsClear": "clear",
    "findingsOpen": "{n} open",

    // Detail dialog
    "detailSrTitle": "Submission review detail",
    "scoreBadge": "Score {score}/100",
    "tabDiffVersion": "Version",
    "tabDiff": "Diff",
    "tabFindings": "Findings ({n})",
    "tabAudit": "Audit Trail",
    "noFindings": "No findings recorded.",
    "markResolved": "Mark resolved",
    "chainOk": "Chain integrity verified",
    "chainBroken": "Chain broken",
    "exportCert": "Export certificate (JSON)",

    // Action bar
    "submitReview": "Submit for review",
    "working": "Working…",
    "requestChanges": "Request changes",
    "grantApproval": "Grant final approval",
    "reopenDraft": "Reopen as draft",
    "signedOff": "Cryptographic sign-off recorded",

    // Decision-note dialog
    "approveHelp": "Approving computes a SHA-256 hash over the content, your reviewer identity and timestamp, then appends an immutable, hash-chained sign-off entry.",
    "changesHelp": "Explain what the author should fix. This note is attached to the audit trail.",
    "approvePlaceholder": "e.g. All flags resolved — cleared for publication.",
    "changesPlaceholder": "e.g. 40% claim is not in the approved facts — cite FACT PD-09 instead.",
    "approveSign": "Approve & sign off",
    "send": "Send",

    // Toasts
    "toastApproved": "Final approval granted",
    "toastApprovedDesc": "SHA-256 sign-off: {hash}… · compliance certificate ready",
    "toastChanges": "Changes requested — the author has been notified on the board",
    "toastSubmitted": "Submitted for review",
    "toastReopened": "Draft reopened",
    "toastError": "Action failed",
    "toastExported": "Compliance certificate exported (JSON)",

    // Diff viewer
    "noRevisions": "No revisions recorded.",
    "compare": "Compare",
    "edited": "edited",
    "current": "current",
    "identical": "identical",
    "prevVersion": "Previous version",
    "currVersion": "Verified current version",

    // Audit trail actions (server action codes; raw fallback applies for unknowns)
    "action.SUBMITTED": "Submitted",
    "action.SUBMITTED_FOR_REVIEW": "Submitted for review",
    "action.CREATED": "Created",
    "action.SCAN": "Scan",
    "action.SCAN_COMPLETED": "Scan completed",
    "action.APPROVAL": "Approved",
    "action.SIGN_OFF": "Sign-off",
    "action.CHANGES_REQUESTED": "Changes requested",
    "action.REOPENED": "Reopened",
    "action.FINDING_RESOLVED": "Finding resolved",
    "action.OVERRIDE": "Overridden",
    "action.SETTINGS": "Org settings",
    "action.SUBSCRIPTION": "Subscription",

    // Audit entry detail keys (fallback = raw key)
    "detail.submissionId": "Submission ID",
    "detail.title": "Title",
    "detail.version": "Version",
    "detail.note": "Note",
    "detail.findings": "Findings",
    "detail.score": "Score",
    "detail.certificate": "Certificate",
    "detail.sandbox": "Sandbox",
    "detail.tier": "Tier",
    "detail.event": "Event",
    "detail.seats": "Seats",
    "detail.findingId": "Finding ID",
    "detail.flagged": "Flagged text",
    "detail.justification": "Justification",
    "detail.appliedSuggestion": "Applied suggestion",
    "detail.zeroDataRetention": "Zero-data retention",
  },

  hi: {
    // पेज हेडर / बोर्ड
    "title": "स्वीकृति बोर्ड",
    "subtitle": "ड्राफ़्ट → समीक्षा में → बदलाव माँगे गए → स्वीकृत — छेड़छाड़-प्रमाण साइन-ऑफ़ ट्रेल के साथ।",
    "reviewerBadge": "समीक्षक अधिकार · {count} समीक्षा की प्रतीक्षा में",
    "emptyColumn": "खाली",
    "typeBanner": "बैनर",
    "findingsClear": "साफ़",
    "findingsOpen": "{n} खुले",

    // विवरण डायलॉग
    "detailSrTitle": "सबमिशन समीक्षा विवरण",
    "scoreBadge": "स्कोर {score}/100",
    "tabDiffVersion": "वर्ज़न",
    "tabDiff": "अंतर",
    "tabFindings": "निष्कर्ष ({n})",
    "tabAudit": "ऑडिट ट्रेल",
    "noFindings": "कोई निष्कर्ष दर्ज नहीं है।",
    "markResolved": "हल के रूप में चिह्नित करें",
    "chainOk": "चेन अखंडता सत्यापित",
    "chainBroken": "चेन टूट गई",
    "exportCert": "प्रमाणपत्र निर्यात करें (JSON)",

    // कार्रवाई पट्टी
    "submitReview": "समीक्षा के लिए भेजें",
    "working": "काम हो रहा है…",
    "requestChanges": "बदलाव माँगें",
    "grantApproval": "अंतिम स्वीकृति दें",
    "reopenDraft": "ड्राफ़्ट के रूप में फिर खोलें",
    "signedOff": "क्रिप्टोग्राफ़िक साइन-ऑफ़ दर्ज हो गया",

    // निर्णय-नोट डायलॉग
    "approveHelp": "स्वीकृति देने पर कंटेंट, आपकी समीक्षक पहचान और टाइमस्टैम्प का SHA-256 हैश गणना होता है, और एक अपरिवर्तनीय, हैश-चेन साइन-ऑफ़ प्रविष्टि जुड़ जाती है।",
    "changesHelp": "समझाएँ कि लेखक को क्या ठीक करना चाहिए। यह नोट ऑडिट ट्रेल से जुड़ जाएगा।",
    "approvePlaceholder": "यथा — सभी फ़्लैग हल हो गए — प्रकाशन हेतु स्वीकृत।",
    "changesPlaceholder": "यथा — 40% दावा स्वीकृत तथ्यों में नहीं है — इसके बजाय FACT PD-09 उद्धृत करें।",
    "approveSign": "स्वीकृत करें और साइन-ऑफ़ करें",
    "send": "भेजें",

    // टोस्ट
    "toastApproved": "अंतिम स्वीकृति दी गई",
    "toastApprovedDesc": "SHA-256 साइन-ऑफ़: {hash}… · अनुपालन प्रमाणपत्र तैयार",
    "toastChanges": "बदलाव माँगे गए — लेखक को बोर्ड पर सूचित कर दिया गया है",
    "toastSubmitted": "समीक्षा के लिए भेज दिया गया",
    "toastReopened": "ड्राफ़्ट फिर से खोल दिया गया",
    "toastError": "कार्रवाई विफल हुई",
    "toastExported": "अनुपालन प्रमाणपत्र निर्यात हो गया (JSON)",

    // अंतर दर्शक (diff viewer)
    "noRevisions": "कोई रिवीज़न दर्ज नहीं है।",
    "compare": "तुलना",
    "edited": "संपादित",
    "current": "वर्तमान",
    "identical": "समान",
    "prevVersion": "पिछला वर्ज़न",
    "currVersion": "सत्यापित वर्तमान वर्ज़न",

    // ऑडिट ट्रेल क्रियाएँ (सर्वर कोड; अज्ञात कोड पर रॉ फ़ॉलबैक)
    "action.SUBMITTED": "प्रस्तुत किया गया",
    "action.SUBMITTED_FOR_REVIEW": "समीक्षा हेतु भेजा गया",
    "action.CREATED": "बनाया गया",
    "action.SCAN": "स्कैन",
    "action.SCAN_COMPLETED": "स्कैन पूर्ण हुआ",
    "action.APPROVAL": "स्वीकृत किया गया",
    "action.SIGN_OFF": "साइन-ऑफ़",
    "action.CHANGES_REQUESTED": "बदलाव माँगे गए",
    "action.REOPENED": "फिर खोला गया",
    "action.FINDING_RESOLVED": "निष्कर्ष हल हुआ",
    "action.OVERRIDE": "ओवरराइड किया गया",
    "action.SETTINGS": "संगठन सेटिंग्स",
    "action.SUBSCRIPTION": "सदस्यता",

    // ऑडिट प्रविष्टि विवरण कुंजियाँ (फ़ॉलबैक = रॉ कुंजी)
    "detail.submissionId": "सबमिशन आईडी",
    "detail.title": "शीर्षक",
    "detail.version": "वर्ज़न",
    "detail.note": "नोट",
    "detail.findings": "निष्कर्ष",
    "detail.score": "स्कोर",
    "detail.certificate": "प्रमाणपत्र",
    "detail.sandbox": "सैंडबॉक्स",
    "detail.tier": "टियर",
    "detail.event": "इवेंट",
    "detail.seats": "सीटें",
    "detail.findingId": "निष्कर्ष आईडी",
    "detail.flagged": "चिह्नित पाठ",
    "detail.justification": "औचित्य",
    "detail.appliedSuggestion": "लागू किया गया सुझाव",
    "detail.zeroDataRetention": "ज़ीरो-डेटा रिटेंशन",
  },
} as const;

registerDict("approvals", dict);
