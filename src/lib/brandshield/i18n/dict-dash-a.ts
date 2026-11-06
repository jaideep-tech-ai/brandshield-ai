"use client";

import { registerDict } from "@/lib/brandshield/i18n";

// ─── BrandShield AI — Dashboard dictionaries (workstream A) ──────────────────
//
// Owns three namespaces:
//   dash.creator  — Content Studio (creator landing dashboard)
//   dash.reviewer — Review Desk (reviewer landing dashboard)
//   app           — top-level app chrome (loading screens)
//
// Key sets are identical across `en` and `hi`. Names, org names, statuses,
// severities and categories come from dict-common / data and are not repeated.

const dictCreator = {
  en: {
    "studio": "Content Studio",

    "welcome": "Welcome back, {name}",
    "hero.sub": "Scan drafts against ground-truth guidelines, fix flagged copy with one click, then submit for review — all from one studio.",
    "hero.zdr": "Zero-Data-Retention",
    "hero.cta": "New pre-flight scan",

    "composer.title": "Draft composer",
    "composer.sub": "Write, scan and fix without leaving this page.",
    "composer.titlePlaceholder": "Give your draft a title…",
    "composer.type.copy": "Copy",
    "composer.type.banner": "Banner",
    "composer.contentPlaceholder": "Write or paste the content you want to pre-flight…",
    "composer.bannerNote": "Image banners are uploaded in the Scanner — this quick composer checks text copy.",
    "composer.scan": "Scan now",
    "composer.scanning": "Scanning…",
    "composer.created": "Draft created — scanning for findings…",
    "composer.errorCreate": "Could not create the draft — check your connection and try again.",
    "composer.errorScan": "Scan failed, but the draft was saved. Reopen it in Findings to retry.",

    "pipeline.title": "My pipeline",
    "pipeline.sub": "Your drafts at every stage",

    "attention.title": "Needs your attention",
    "attention.sub": "Open findings across your submissions",
    "attention.empty.title": "All clear",
    "attention.empty.body": "No open findings across your submissions. Keep shipping.",
    "attention.empty.cta": "Start a new draft",

    "compliance.title": "Personal compliance",
    "compliance.strong": "Strong — above the 85 bar",
    "compliance.needsCare": "Needs care — below the 85 bar",
    "compliance.noData": "Run a scan to see your score",

    "scans.title": "Scans used",
    "scans.unlimited": "Unlimited",
    "scans.left": "{left} left this cycle",

    "tips.title": "Writing tips",
    "tips.1": "Back every stat with a source — unsupported claims are the number-one flag.",
    "tips.2": "Use approved hex codes only; the vision stage catches off-brand colors.",
    "tips.3": "Fix critical findings first — they block approval automatically.",
  },

  hi: {
    "studio": "कंटेंट स्टूडियो",

    "welcome": "वापसी पर स्वागत है, {name}",
    "hero.sub": "ग्राउंड-ट्रुथ गाइडलाइन के मुक़ाबले ड्राफ़्ट स्कैन करें, एक क्लिक में फ़्लैग सुधारें और समीक्षा के लिए भेजें — सब एक ही स्टूडियो से।",
    "hero.zdr": "ज़ीरो-डेटा-रिटेंशन",
    "hero.cta": "नया प्री-फ़्लाइट स्कैन",

    "composer.title": "ड्राफ़्ट कंपोज़र",
    "composer.sub": "पेज छोड़े बिना लिखें, स्कैन करें और सुधारें।",
    "composer.titlePlaceholder": "अपने ड्राफ़्ट को शीर्षक दें…",
    "composer.type.copy": "कॉपी",
    "composer.type.banner": "बैनर",
    "composer.contentPlaceholder": "जो कंटेंट आप प्री-फ़्लाइट करना चाहते हैं, लिखें या पेस्ट करें…",
    "composer.bannerNote": "इमेज बैनर स्कैनर में अपलोड होते हैं — यह क्विक कंपोज़र टेक्स्ट कॉपी जाँचता है।",
    "composer.scan": "अभी स्कैन करें",
    "composer.scanning": "स्कैन हो रहा है…",
    "composer.created": "ड्राफ़्ट बन गया — फाइंडिंग्स के लिए स्कैन चल रहा है…",
    "composer.errorCreate": "ड्राफ़्ट नहीं बन सका — कनेक्शन जाँचें और फिर कोशिश करें।",
    "composer.errorScan": "स्कैन विफ़ल, पर ड्राफ़्ट सेव हो गया। दोबारा कोशिश के लिए इसे फाइंडिंग्स में खोलें।",

    "pipeline.title": "मेरी पाइपलाइन",
    "pipeline.sub": "हर चरण में आपके ड्राफ़्ट",

    "attention.title": "ध्यान देने की ज़रूरत",
    "attention.sub": "आपकी सबमिशन में खुली फाइंडिंग्स",
    "attention.empty.title": "सब साफ़ है",
    "attention.empty.body": "आपकी सबमिशन में कोई खुली फाइंडिंग नहीं है — ऐसे ही बनाते रहें।",
    "attention.empty.cta": "नया ड्राफ़्ट शुरू करें",

    "compliance.title": "व्यक्तिगत अनुपालना",
    "compliance.strong": "मज़बूत — 85 की सीमा से ऊपर",
    "compliance.needsCare": "ध्यान देने की ज़रूरत — 85 से नीचे",
    "compliance.noData": "स्कोर देखने के लिए स्कैन चलाएँ",

    "scans.title": "उपयोग किए गए स्कैन",
    "scans.unlimited": "असीमित",
    "scans.left": "इस चक्र में {left} शेष",

    "tips.title": "लेखन सुझाव",
    "tips.1": "हर आँकड़े का स्रोत दें — असमर्थित दावे सबसे ज़्यादा फ़्लैग होते हैं।",
    "tips.2": "केवल स्वीकृत हेक्स कोड इस्तेमाल करें; विज़न जाँच ऑफ़-ब्रांड रंग पकड़ लेती है।",
    "tips.3": "पहले गंभीर फाइंडिंग्स सुधारें — वे स्वीकृति को रोकती हैं।",
  },
} as const;

const dictReviewer = {
  en: {
    "desk": "Review Desk",

    "welcome": "Welcome back, {name}",
    "hero.sub": "Work the approval queue, verify claim citations, and sign off with hash-chained audit trails.",
    "awaiting.rest": "submissions awaiting your decision",
    "hero.cta": "Open approval board",

    "stats.pending": "Pending review",
    "stats.decided": "Decisions made",
    "stats.avg": "Avg compliance",
    "stats.critical": "Open critical findings",

    "queue.title": "Priority queue",
    "queue.sub": "Longest waiting first",
    "queue.review": "Review",
    "queue.waitingTip": "Waiting in the queue",
    "queue.empty": "Queue is clear — great team velocity",

    "risk.title": "Risk radar",
    "risk.sub": "Unapproved items with open critical findings",
    "risk.flagged": "{n} critical open",
    "risk.empty": "Nothing critical on the radar right now.",

    "decisions.title": "Recent decisions",
    "decisions.empty": "No review decisions recorded yet.",
    "decisions.footer": "Full audit trail",

    "action.approval": "Approved",
    "action.signOff": "Signed off",
    "action.changes": "Changes requested",
    "action.submittedReview": "Submitted for review",
    "action.submitted": "Submitted",

    "quick.title": "Quick actions",
    "quick.approvals": "Open approval board",
    "quick.chain": "Verify audit chain",
    "quick.drift": "View drift analytics",
  },

  hi: {
    "desk": "रिव्यू डेस्क",

    "welcome": "वापसी पर स्वागत है, {name}",
    "hero.sub": "अनुमोदन कतार संभालें, दावों के हवाले जाँचें और हैश-चेन ऑडिट ट्रेल के साथ स्वीकृति दें।",
    "awaiting.rest": "सबमिशन आपके निर्णय की प्रतीक्षा कर रहे हैं",
    "hero.cta": "अनुमोदन बोर्ड खोलें",

    "stats.pending": "समीक्षा में लंबित",
    "stats.decided": "लिए गए निर्णय",
    "stats.avg": "औसत अनुपालना",
    "stats.critical": "खुली गंभीर फाइंडिंग्स",

    "queue.title": "प्राथमिकता कतार",
    "queue.sub": "सबसे लंबे समय से प्रतीक्षारत पहले",
    "queue.review": "समीक्षा",
    "queue.waitingTip": "कतार में प्रतीक्षारत",
    "queue.empty": "कतार खाली है — टीम की गति शानदार है",

    "risk.title": "रिस्क रडार",
    "risk.sub": "बिना स्वीकृत आइटम जिनमें गंभीर फाइंडिंग्स खुली हैं",
    "risk.flagged": "{n} गंभीर खुली",
    "risk.empty": "अभी रडार पर कोई गंभीर जोखिम नहीं है।",

    "decisions.title": "हाल के निर्णय",
    "decisions.empty": "अभी कोई समीक्षा निर्णय दर्ज नहीं है।",
    "decisions.footer": "पूरा ऑडिट ट्रेल",

    "action.approval": "स्वीकृत किया",
    "action.signOff": "हस्ताक्षर स्वीकृति",
    "action.changes": "बदलाव माँगे गए",
    "action.submittedReview": "समीक्षा के लिए भेजा",
    "action.submitted": "भेजा गया",

    "quick.title": "त्वरित कार्य",
    "quick.approvals": "अनुमोदन बोर्ड खोलें",
    "quick.chain": "ऑडिट चेन सत्यापित करें",
    "quick.drift": "ड्रिफ़्ट एनालिटिक्स देखें",
  },
} as const;

const dictApp = {
  en: {
    "loading": "Loading BrandShield AI…",
    "loadingWorkspace": "Preparing your workspace…",
  },
  hi: {
    "loading": "BrandShield AI लोड हो रहा है…",
    "loadingWorkspace": "आपका वर्कस्पेस तैयार हो रहा है…",
  },
} as const;

registerDict("dash.creator", dictCreator);
registerDict("dash.reviewer", dictReviewer);
registerDict("app", dictApp);
