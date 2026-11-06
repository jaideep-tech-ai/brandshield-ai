"use client";

import { registerDict } from "@/lib/brandshield/i18n";

// ─── Role-specific guided tours (creator / reviewer / contractor / admin) ────
//
// Key shape: tour.<role>.s<n>.title | .body — one scripted walkthrough per role.
// Shared chrome (counter, buttons, completion card) lives under tour.* directly.
// Intro bodies use the {role} placeholder, filled from common.role.<role>.

const dict = {
  en: {
    "stepCounter": "Step {x} of {y}",
    "allSet": "You're all set",
    "complete.title": "Tour complete — you're ready to ship on-brand",

    "btn.go": "Let's go",
    "btn.next": "Next",
    "btn.back": "Back",
    "btn.finish": "Finish",
    "btn.skip": "Skip tour",

    "aria.skip": "Skip tour",
    "aria.dialog": "Guided product tour",

    // ── Creator · Content Studio (Ava) ──
    "creator.s1.title": "Welcome to your Content Studio",
    "creator.s1.body":
      "Hi {role} — this workspace takes your drafts from first paste to approved, on-brand publish. Four stages, one guided loop. Let's go.",
    "creator.s2.title": "Draft Composer",
    "creator.s2.body":
      "Paste a draft and scan it in seconds. Write or drop in copy right here, then send it through the pre-flight pipeline without changing pages.",
    "creator.s3.title": "Your pipeline",
    "creator.s3.body":
      "Drafts move left to right, from first version toward approved. Each card's column tells you exactly where the piece stands and what happens next.",
    "creator.s4.title": "Needs your attention",
    "creator.s4.body":
      "Open flags land here with one-click rewrites. Fix the highest-impact issues first — every rewrite preserves your original intent.",
    "creator.s5.title": "Stage 1 · Ground-truth repository",
    "creator.s5.body":
      "Upload brand guidelines, product facts and visual tokens. Documents are chunked and indexed so every future finding can cite a verbatim rule — that's why citations matter.",
    "creator.s6.title": "Stage 2 · Pre-flight scanner",
    "creator.s6.body":
      "Paste copy or drop a banner. A deterministic pre-filter runs first (<100 ms, no AI cost), then the RAG + vision pipeline verifies claims, tone and color contrast.",
    "creator.s7.title": "Stage 3 · Explainable findings",
    "creator.s7.body":
      "Each flag shows the exact phrase, the rule it broke and why it matters — plus a one-click rewrite that fixes intent, not just words.",
    "creator.s8.title": "Stage 4 · Sign-off & audit trail",
    "creator.s8.body":
      "Submit the finished piece for sign-off. Reviewers compare versions side-by-side and every decision is hashed into a tamper-evident SHA-256 audit chain.",
    "creator.done.body":
      "Your Content Studio is ready. Jump in with the demo personas on the sign-in screen to see other roles' workspaces — and replay this tour anytime from the 🎓 button in the header.",

    // ── Reviewer · Review Desk (Marcus) ──
    "reviewer.s1.title": "Welcome to your Review Desk",
    "reviewer.s1.body":
      "Hi {role} — this desk is built for fast, defensible decisions. Here's where to focus first.",
    "reviewer.s2.title": "Priority queue",
    "reviewer.s2.body":
      "Longest-waiting submissions rise to the top, so nothing stalls and every author gets a timely decision.",
    "reviewer.s3.title": "Risk radar",
    "reviewer.s3.body":
      "Critical flags surface here — claim mismatches and trademark issues jump the queue so risky copy never ships.",
    "reviewer.s4.title": "Stage 4 · Side-by-side sign-off",
    "reviewer.s4.body":
      "Compare versions with a side-by-side diff, then approve or request changes. Every decision is hash-chained (SHA-256) into a tamper-evident audit trail.",
    "reviewer.s5.title": "Verify against ground truth",
    "reviewer.s5.body":
      "Every flag cites the exact rule it broke — verify each citation against the knowledge base before you sign off.",
    "reviewer.s6.title": "Stage 5 · Drift analytics",
    "reviewer.s6.body":
      "Spot where brand drift happens and which rules keep triggering — repeated friction is a signal that a rule is ambiguous or too strict.",
    "reviewer.done.body":
      "Your Review Desk is ready. Try the other demo personas to see their workspaces — and replay this tour anytime from the 🎓 button in the header.",

    // ── Contractor · Client Sandbox (Priya) ──
    "contractor.s1.title": "Welcome to your Client Sandbox",
    "contractor.s1.body":
      "Hi {role} — a private workspace for pre-checking work against client guidelines before anything is shared.",
    "contractor.s2.title": "Your private sandbox",
    "contractor.s2.body":
      "Pre-check drafts against the client's guidelines right here. Nothing leaves this sandbox until formal submission.",
    "contractor.s3.title": "Three steps to on-brand",
    "contractor.s3.body":
      "Paste → pre-check → fix & share. That's the whole loop — most drafts clear it in minutes.",
    "contractor.s4.title": "Run your pre-check",
    "contractor.s4.body":
      "Paste copy or drop a banner and run the scan — keep an eye on your monthly quota. The deterministic pre-filter is instant and costs nothing.",
    "contractor.s5.title": "Fix flags, then share",
    "contractor.s5.body":
      "One-click rewrites resolve flags while keeping your intent — share only once the score is clean.",
    "contractor.s6.title": "Client-approved guidelines",
    "contractor.s6.body":
      "Browse exactly what you're checked against — the same ground truth your client's reviewers see.",
    "contractor.done.body":
      "Your Client Sandbox is ready. Explore the other demo personas' workspaces — and replay this tour anytime from the 🎓 button in the header.",

    // ── Admin · Governance HQ (Elena) ──
    "admin.s1.title": "Welcome to your Governance HQ",
    "admin.s1.body":
      "Hi {role} — an org-wide control room. Let's look at the signals that matter most.",
    "admin.s2.title": "Org KPIs at a glance",
    "admin.s2.body":
      "Live counters for submissions, open findings, average compliance score and review load — across every team.",
    "admin.s3.title": "Brand health gauge",
    "admin.s3.body":
      "Your drift early-warning. When the needle moves, a guideline needs attention before drift becomes the new normal.",
    "admin.s4.title": "Knowledge base health",
    "admin.s4.body":
      "Freshness matters — stale guidelines produce noisy findings. Keep sources current and every citation stays trustworthy.",
    "admin.s5.title": "Usage & plan snapshot",
    "admin.s5.body":
      "Scans, seats and plan limits in one view — spot the moment it's time to scale up.",
    "admin.s6.title": "Manage guidelines & tokens",
    "admin.s6.body":
      "Upload and version brand guidelines and visual tokens — the ground truth every scan and finding cites.",
    "admin.s7.title": "Oversight of the sign-off chain",
    "admin.s7.body":
      "The full approval chain in one place — who approved what and when, with every decision hash-chained for audit.",
    "admin.s8.title": "Drift + rule friction",
    "admin.s8.body":
      "Where brand drift happens and which rules keep triggering — ambiguous rules surface here so you can sharpen them.",
    "admin.s9.title": "Team, security & language",
    "admin.s9.body":
      "Manage team seats, org security and language preferences for the whole workspace — English and हिन्दी included.",
    "admin.done.body":
      "Your Governance HQ is ready. Switch demo personas to see each role's workspace — and replay this tour anytime from the 🎓 button in the header.",
  },

  hi: {
    "stepCounter": "स्टेप {x} / {y}",
    "allSet": "आप तैयार हैं",
    "complete.title": "टूर पूरा हुआ — अब आप ब्रांड के अनुरूप शिप करने को तैयार हैं",

    "btn.go": "चलिए शुरू करें",
    "btn.next": "आगे",
    "btn.back": "वापस",
    "btn.finish": "समाप्त",
    "btn.skip": "टूर छोड़ें",

    "aria.skip": "टूर छोड़ें",
    "aria.dialog": "गाइडेड प्रोडक्ट टूर",

    // ── क्रिएटर · कंटेंट स्टूडियो (आवा) ──
    "creator.s1.title": "आपके कंटेंट स्टूडियो में स्वागत है",
    "creator.s1.body":
      "नमस्ते {role} — यह वर्कस्पेस आपके ड्राफ़्ट को पहली पेस्ट से लेकर स्वीकृत, ब्रांड-अनुरूप प्रकाशन तक ले जाता है। चार चरण, एक गाइडेड लूप। चलिए शुरू करें।",
    "creator.s2.title": "ड्राफ़्ट कंपोज़र",
    "creator.s2.body":
      "ड्राफ़्ट पेस्ट करें और सेकंडों में स्कैन पाएँ। कॉपी यहीं लिखें या पेस्ट करें, फिर पेज बदले बिना इसे प्री-फ़्लाइट पाइपलाइन से गुज़ारें।",
    "creator.s3.title": "आपकी पाइपलाइन",
    "creator.s3.body":
      "ड्राफ़्ट बाएँ से दाएँ बढ़ते हैं — पहले वर्ज़न से स्वीकृति की ओर। हर कार्ड का कॉलम बताता है कि पीस अभी किस स्थिति में है और आगे क्या होगा।",
    "creator.s4.title": "ध्यान देने की ज़रूरत",
    "creator.s4.body":
      "खुले फ़्लैग वन-क्लिक रीराइट के साथ यहाँ पहुँचते हैं। सबसे ज़्यादा असर वाले मुद्दे पहले सुलझाएँ — हर रीराइट आपका मूल इंटेंट बरकरार रखती है।",
    "creator.s5.title": "चरण 1 · ग्राउंड-ट्रुथ रिपॉज़िटरी",
    "creator.s5.body":
      "ब्रांड गाइडलाइन, प्रोडक्ट फ़ैक्ट और विज़ुअल टोकन अपलोड करें। डॉक्यूमेंट चंक और इंडेक्स होते हैं ताकि हर आने वाली फाइंडिंग शब्दशः नियम का साइटेशन दे सके — इसीलिए साइटेशन ज़रूरी हैं।",
    "creator.s6.title": "चरण 2 · प्री-फ़्लाइट स्कैनर",
    "creator.s6.body":
      "कॉपी पेस्ट करें या बैनर ड्रॉप करें। पहले डिटरमिनिस्टिक प्री-फ़िल्टर चलता है (<100 ms, कोई AI लागत नहीं), फिर RAG + विज़न पाइपलाइन दावों, टोन और कलर कंट्रास्ट को सत्यापित करती है।",
    "creator.s7.title": "चरण 3 · व्याख्या-योग्य फाइंडिंग्स",
    "creator.s7.body":
      "हर फ़्लैग सटीक वाक्यांश, टूटा नियम और उसका महत्व दिखाता है — साथ में वन-क्लिक रीराइट, जो सिर्फ़ शब्द नहीं, इंटेंट भी ठीक करती है।",
    "creator.s8.title": "चरण 4 · साइन-ऑफ़ और ऑडिट ट्रेल",
    "creator.s8.body":
      "तैयार पीस को साइन-ऑफ़ के लिए सबमिट करें। रिव्यूअर साइड-बाय-साइड वर्ज़न मिलाते हैं और हर फ़ैसला छेड़छाड़ का पता देने वाली SHA-256 ऑडिट चेन में हैश हो जाता है।",
    "creator.done.body":
      "आपका कंटेंट स्टूडियो तैयार है। साइन-इन स्क्रीन पर डेमो पर्सोना आज़माएँ और दूसरी भूमिकाओं के वर्कस्पेस देखें — यह टूर आप हेडर के 🎓 बटन से कभी भी दोबारा चला सकते हैं।",

    // ── रिव्यूअर · रिव्यू डेस्क (मार्कस) ──
    "reviewer.s1.title": "आपके रिव्यू डेस्क में स्वागत है",
    "reviewer.s1.body":
      "नमस्ते {role} — यह डेस्क तेज़ और हर स्तर पर सही ठहराने योग्य फ़ैसलों के लिए बना है। आइए देखें सबसे पहले कहाँ ध्यान देना है।",
    "reviewer.s2.title": "प्रायोरिटी क्यू",
    "reviewer.s2.body":
      "सबसे लंबे समय से इंतज़ार कर रहे सबमिशन सबसे ऊपर आते हैं, ताकि कुछ भी अटके नहीं और हर लेखक को समय पर फ़ैसला मिले।",
    "reviewer.s3.title": "रिस्क रडार",
    "reviewer.s3.body":
      "गंभीर फ़्लैग यहीं सामने आते हैं — दावा बेमेल और ट्रेडमार्क मुद्दे कतार में सबसे आगे आ जाते हैं, ताकि जोखिम भरी कॉपी कभी प्रकाशित न हो।",
    "reviewer.s4.title": "चरण 4 · साइड-बाय-साइड साइन-ऑफ़",
    "reviewer.s4.body":
      "साइड-बाय-साइड डिफ़ से वर्ज़न मिलाएँ, फिर स्वीकृत करें या बदलाव माँगें। हर फ़ैसला हैश-चेन (SHA-256) के ज़रिए छेड़छाड़ का पता देने वाली ऑडिट ट्रेल में दर्ज होता है।",
    "reviewer.s5.title": "ग्राउंड ट्रुथ से सत्यापन करें",
    "reviewer.s5.body":
      "हर फ़्लैग बताता है कि वह किस सटीक नियम को तोड़ता है — साइन-ऑफ़ से पहले हर साइटेशन को नॉलेज बेस से मिलाकर जाँचें।",
    "reviewer.s6.title": "चरण 5 · ड्रिफ़्ट एनालिटिक्स",
    "reviewer.s6.body":
      "देखें ब्रांड ड्रिफ़्ट कहाँ होता है और कौन से नियम बार-बार ट्रिगर होते हैं — बार-बार की रगड़ यह संकेत है कि नियम अस्पष्ट या बहुत सख़्त है।",
    "reviewer.done.body":
      "आपका रिव्यू डेस्क तैयार है। दूसरे डेमो पर्सोना आज़माकर उनके वर्कस्पेस देखें — यह टूर आप हेडर के 🎓 बटन से कभी भी दोबारा चला सकते हैं।",

    // ── कॉन्ट्रैक्टर · क्लाइंट सैंडबॉक्स (प्रिया) ──
    "contractor.s1.title": "आपके क्लाइंट सैंडबॉक्स में स्वागत है",
    "contractor.s1.body":
      "नमस्ते {role} — एक निजी वर्कस्पेस, जहाँ कुछ भी शेयर होने से पहले काम को क्लाइंट गाइडलाइन के हिसाब से प्री-चेक किया जाता है।",
    "contractor.s2.title": "आपका निजी सैंडबॉक्स",
    "contractor.s2.body":
      "ड्राफ़्ट को यहीं क्लाइंट की गाइडलाइन के हिसाब से प्री-चेक करें। औपचारिक सबमिशन तक इस सैंडबॉक्स से कुछ भी बाहर नहीं जाता।",
    "contractor.s3.title": "तीन आसान चरण",
    "contractor.s3.body":
      "पेस्ट → प्री-चेक → ठीक करें और शेयर करें। पूरा लूप बस इतना है — ज़्यादातर ड्राफ़्ट मिनटों में क्लियर हो जाते हैं।",
    "contractor.s4.title": "अपना प्री-चेक चलाएँ",
    "contractor.s4.body":
      "कॉपी पेस्ट करें या बैनर ड्रॉप करें और स्कैन चलाएँ — साथ ही अपने मासिक कोटे पर नज़र रखें। डिटरमिनिस्टिक प्री-फ़िल्टर तुरंत और मुफ़्त है।",
    "contractor.s5.title": "फ़्लैग ठीक करें, फिर शेयर करें",
    "contractor.s5.body":
      "वन-क्लिक रीराइट फ़्लैग हल करती है और आपका इंटेंट बरकरार रखती है — स्कोर साफ़ होने पर ही शेयर करें।",
    "contractor.s6.title": "क्लाइंट-स्वीकृत गाइडलाइन",
    "contractor.s6.body":
      "ब्राउज़ करें कि आपकी जाँच किसके आधार पर होती है — वही ग्राउंड ट्रुथ जिसे आपके क्लाइंट के रिव्यूअर देखते हैं।",
    "contractor.done.body":
      "आपका क्लाइंट सैंडबॉक्स तैयार है। दूसरे डेमो पर्सोना आज़माकर उनके वर्कस्पेस देखें — यह टूर आप हेडर के 🎓 बटन से कभी भी दोबारा चला सकते हैं।",

    // ── एडमिन · गवर्नेंस HQ (एलेना) ──
    "admin.s1.title": "आपके गवर्नेंस HQ में स्वागत है",
    "admin.s1.body":
      "नमस्ते {role} — पूरे संगठन का कंट्रोल रूम। आइए सबसे मायने रखने वाले संकेत देखें।",
    "admin.s2.title": "संगठन के KPI एक नज़र में",
    "admin.s2.body":
      "सबमिशन, खुली फाइंडिंग्स, औसत कंप्लायंस स्कोर और रिव्यू लोड के लाइव काउंटर — हर टीम के लिए।",
    "admin.s3.title": "ब्रांड हेल्थ गेज",
    "admin.s3.body":
      "आपका ड्रिफ़्ट अर्ली-वार्निंग। जब सुई हिलती है, तब किसी गाइडलाइन को ध्यान चाहिए — इससे पहले कि ड्रिफ़्ट नया सामान्य बन जाए।",
    "admin.s4.title": "नॉलेज बेस हेल्थ",
    "admin.s4.body":
      "ताज़गी मायने रखती है — पुरानी गाइडलाइन शोर भरी फाइंडिंग्स पैदा करती हैं। स्रोत अपडेट रखें और हर साइटेशन भरोसेमंद रहेगा।",
    "admin.s5.title": "उपयोग और प्लान स्नैपशॉट",
    "admin.s5.body":
      "स्कैन, सीट और प्लान लिमिट एक ही नज़र में — पता चल जाएगा कि स्केल बढ़ाने का समय कब है।",
    "admin.s6.title": "गाइडलाइन और टोकन प्रबंधित करें",
    "admin.s6.body":
      "ब्रांड गाइडलाइन और विज़ुअल टोकन अपलोड और वर्ज़न करें — यही ग्राउंड ट्रुथ है जिसे हर स्कैन और फाइंडिंग साइट करती है।",
    "admin.s7.title": "साइन-ऑफ़ चेन पर निगरानी",
    "admin.s7.body":
      "पूरी अप्रूवल चेन एक जगह — किसने, कब क्या स्वीकृत किया, और हर फ़ैसला ऑडिट के लिए हैश-चेन से जुड़ा।",
    "admin.s8.title": "ड्रिफ़्ट + नियम-फ़्रिक्शन",
    "admin.s8.body":
      "ब्रांड ड्रिफ़्ट कहाँ होता है और कौन से नियम बार-बार ट्रिगर होते हैं — अस्पष्ट नियम यहीं सामने आते हैं ताकि उन्हें और सटीक बनाया जा सके।",
    "admin.s9.title": "टीम, सुरक्षा और भाषा",
    "admin.s9.body":
      "पूरे वर्कस्पेस के लिए टीम सीट, संगठन की सुरक्षा और भाषा प्राथमिकताएँ प्रबंधित करें — अंग्रेज़ी और हिन्दी दोनों शामिल हैं।",
    "admin.done.body":
      "आपका गवर्नेंस HQ तैयार है। डेमो पर्सोना बदलकर हर भूमिका का वर्कस्पेस देखें — यह टूर आप हेडर के 🎓 बटन से कभी भी दोबारा चला सकते हैं।",
  },
} as const;

registerDict("tour", dict);
