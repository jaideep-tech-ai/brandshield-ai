"use client";

import { registerDict } from "./index";

// ─── Stage 2 — Pre-Flight Scanner ────────────────────────────────────────────
// LLM-generated data (voiceSummary, vision.summary, citations, OCR) is never
// translated — only UI chrome lives here.

const dict = {
  en: {
    // Header
    "title": "Pre-Flight Scanner",
    "subtitle": "Two-stage hybrid inspection — deterministic pre-filter, then RAG claim verification & vision audit.",
    "zdr": "ZDR On — drafts never used for model training",

    // Mode toggle
    "tab.text": "Copy / Document",
    "tab.banner": "Promotional Banner",

    // Text composer
    "label.draftTitle": "Draft title",
    "ph.draftTitle": "e.g. Spring Boost Campaign — Email Hero",
    "label.content": "Campaign copy (Markdown supported)",
    "words": "{n} words",
    "ph.content": "Paste or write the copy for pre-flight inspection…\n\nTry: “Our merchants see 10x ROI — guaranteed. nimbuspay is the world's best payment platform!!!”",

    // Banner composer
    "label.bannerTitle": "Banner title",
    "ph.bannerTitle": "e.g. Summer Splash — Social Banner",
    "drop.title": "Upload a promotional banner",
    "drop.hint": "PNG, JPG or WebP · palette + WCAG contrast are extracted automatically",
    "preview.alt": "Banner preview",
    "palette.label": "Extracted dominant palette (client-side canvas)",
    "aria.uploadBanner": "Upload banner image",
    "aria.removeImage": "Remove image",

    // Context note
    "label.note": "Context note for reviewers (optional)",
    "ph.note": "e.g. Hero copy for the spring re-engagement email",

    // Actions
    "btn.scan": "Run Pre-Flight Scan",
    "btn.newScan": "New scan",
    "hint.stages": "Stage 1 is token-free <100ms · Stage 2 uses grounded LLM + vision",
    "bannerHeadline": "Banner headline: {title}",

    // Pipeline progress
    "pipe.stageA.label": "Stage 1 — Deterministic Pre-Filter",
    "pipe.stageA.detail": "Banned terms · trademark glyphs · claim extraction · hex discovery",
    "pipe.stageB.label": "Stage 2 — Hybrid RAG + Vision Verification",
    "pipe.stageB.detail": "Dense-sparse retrieval · claim verdicts · tone scoring · WCAG math",

    // Toasts
    "toast.badType": "Please upload a PNG, JPG or WebP banner image",
    "toast.tooBig": "Image must be under 6 MB",
    "toast.loaded": "Banner loaded — {n} dominant colors extracted",
    "toast.readFail": "Could not read that image",
    "toast.needTitle": "Give your draft a title first",
    "toast.needBanner": "Add a title and upload a banner image first",
    "toast.done": "Pre-flight complete — compliance score {score}/100",
    "toast.quotaDesc": "Open Billing to upgrade your plan.",
    "toast.goBilling": "Go to Billing",
    "toast.failed": "Scan failed",

    // Score card
    "score.label": "score",
    "score.critical": "{n} critical",
    "score.warnings": "{n} warnings",
    "score.minor": "{n} minor",
    "score.duration": "Full pipeline in {sec}s · strict JSON citations enforced",

    // Stage A card (server check names → translated labels)
    "check.bannedTerms": "Banned terms",
    "check.trademarkGlyphs": "Trademark glyphs",
    "check.claimCandidates": "Claim candidates",
    "check.hexDiscovery": "Hex discovery",
    "check.styleMechanics": "Style mechanics",
    "check.passed": "Passed",
    "check.attention": "Needs attention",

    // Stage B card
    "stageB.title": "Stage 2 — Grounded verification",
    "stageB.noClaims": "No numeric claims detected for RAG verification.",
    "stageB.voiceScore": "Persona voice score",
    "stageB.vision": "Vision audit",

    // Right rail
    "action.openFindings": "Open explainable findings",
    "recent.title": "Recent submissions",
    "recent.empty": "Nothing yet — run your first pre-flight scan.",
    "type.banner": "Banner",
    "type.copy": "Copy",
    "trust.copy": "Every flag must cite a verbatim guideline clause before it can fire — no black-box scores, no arbitrary rejections.",
  },

  hi: {
    // Header
    "title": "प्री-फ़्लाइट स्कैनर",
    "subtitle": "दो-चरणीय हाइब्रिड जाँच — पहले डिटरमिनिस्टिक प्री-फ़िल्टर, फिर RAG दावा सत्यापन और विज़न ऑडिट।",
    "zdr": "ZDR चालू — ड्राफ़्ट कभी भी मॉडल ट्रेनिंग में इस्तेमाल नहीं होते",

    // Mode toggle
    "tab.text": "कॉपी / दस्तावेज़",
    "tab.banner": "प्रोमोशनल बैनर",

    // Text composer
    "label.draftTitle": "ड्राफ़्ट का शीर्षक",
    "ph.draftTitle": "जैसे: स्प्रिंग बूस्ट कैंपेन — ईमेल हीरो",
    "label.content": "कैंपेन कॉपी (Markdown समर्थित)",
    "words": "{n} शब्द",
    "ph.content": "प्री-फ़्लाइट जाँच के लिए कॉपी पेस्ट करें या लिखें…\n\nकोशिश करें: “हमारे मर्चेंट को 10x ROI मिलता है — गारंटीकृत। nimbuspay दुनिया का सबसे बेहतरीन पेमेंट प्लेटफ़ॉर्म है!!!”",

    // Banner composer
    "label.bannerTitle": "बैनर का शीर्षक",
    "ph.bannerTitle": "जैसे: समर स्प्लैश — सोशल बैनर",
    "drop.title": "प्रोमोशनल बैनर अपलोड करें",
    "drop.hint": "PNG, JPG या WebP · पैलेट + WCAG कंट्रास्ट अपने-आप निकाले जाते हैं",
    "preview.alt": "बैनर प्रीव्यू",
    "palette.label": "निकाला गया प्रमुख पैलेट (क्लाइंट-साइड कैनवास)",
    "aria.uploadBanner": "बैनर इमेज अपलोड करें",
    "aria.removeImage": "इमेज हटाएँ",

    // Context note
    "label.note": "समीक्षकों के लिए संदर्भ नोट (वैकल्पिक)",
    "ph.note": "जैसे: स्प्रिंग री-एन्गेजमेंट ईमेल के लिए हीरो कॉपी",

    // Actions
    "btn.scan": "प्री-फ़्लाइट स्कैन चलाएँ",
    "btn.newScan": "नया स्कैन",
    "hint.stages": "चरण 1 टोकन-मुक्त है <100ms · चरण 2 ग्राउंडेड LLM + विज़न का उपयोग करता है",
    "bannerHeadline": "बैनर हेडलाइन: {title}",

    // Pipeline progress
    "pipe.stageA.label": "चरण 1 — डिटरमिनिस्टिक प्री-फ़िल्टर",
    "pipe.stageA.detail": "प्रतिबंधित शब्द · ट्रेडमार्क ग्लिफ़ · दावा एक्स्ट्रैक्शन · हेक्स खोज",
    "pipe.stageB.label": "चरण 2 — हाइब्रिड RAG + विज़न सत्यापन",
    "pipe.stageB.detail": "डेंस-स्पार्स रिट्रीवल · दावा निर्णय · टोन स्कोरिंग · WCAG गणित",

    // Toasts
    "toast.badType": "कृपया PNG, JPG या WebP बैनर इमेज अपलोड करें",
    "toast.tooBig": "इमेज 6 MB से छोटी होनी चाहिए",
    "toast.loaded": "बैनर लोड हुआ — {n} प्रमुख रंग निकाले गए",
    "toast.readFail": "वह इमेज पढ़ी नहीं जा सकी",
    "toast.needTitle": "पहले अपने ड्राफ़्ट को शीर्षक दें",
    "toast.needBanner": "पहले शीर्षक जोड़ें और बैनर इमेज अपलोड करें",
    "toast.done": "प्री-फ़्लाइट पूर्ण — अनुपालन स्कोर {score}/100",
    "toast.quotaDesc": "प्लान अपग्रेड के लिए बिलिंग खोलें।",
    "toast.goBilling": "बिलिंग पर जाएँ",
    "toast.failed": "स्कैन विफल हुआ",

    // Score card
    "score.label": "स्कोर",
    "score.critical": "{n} गंभीर",
    "score.warnings": "{n} चेतावनियाँ",
    "score.minor": "{n} सामान्य",
    "score.duration": "पूरी पाइपलाइन {sec}s में · सख़्त JSON साइटेशन लागू",

    // Stage A card (server check names → translated labels)
    "check.bannedTerms": "प्रतिबंधित शब्द",
    "check.trademarkGlyphs": "ट्रेडमार्क ग्लिफ़",
    "check.claimCandidates": "दावा कैंडिडेट",
    "check.hexDiscovery": "हेक्स खोज",
    "check.styleMechanics": "स्टाइल मैकेनिक्स",
    "check.passed": "उत्तीर्ण",
    "check.attention": "ध्यान देने योग्य",

    // Stage B card
    "stageB.title": "चरण 2 — ग्राउंडेड सत्यापन",
    "stageB.noClaims": "RAG सत्यापन के लिए कोई संख्यात्मक दावा नहीं मिला।",
    "stageB.voiceScore": "पर्सोना वॉइस स्कोर",
    "stageB.vision": "विज़न ऑडिट",

    // Right rail
    "action.openFindings": "व्याख्या-योग्य फ़ाइंडिंग खोलें",
    "recent.title": "हाल के सबमिशन",
    "recent.empty": "अभी कुछ नहीं — अपना पहला प्री-फ़्लाइट स्कैन चलाएँ।",
    "type.banner": "बैनर",
    "type.copy": "कॉपी",
    "trust.copy": "हर फ़्लैग के फायर होने से पहले गाइडलाइन का शब्दशः हवाला ज़रूरी है — न कोई ब्लैक-बॉक्स स्कोर, न मनमाना अस्वीकरण।",
  },
} as const;

registerDict("scanner", dict);
