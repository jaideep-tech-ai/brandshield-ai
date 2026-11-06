"use client";

import { registerDict } from "./index";

// ─── Landing page dictionary (English ⇄ हिन्दी) ───────────────────────────────
// Every user-visible string on the marketing landing page lives here.
// Brand/technical terms kept as-is: BrandShield AI, WCAG 2.1, SHA-256, RAG.

const dict = {
  en: {
    // ── Navbar ──
    "nav.problem": "Problem",
    "nav.workflow": "Workflow",
    "nav.personas": "Personas",
    "nav.pricing": "Pricing",
    "nav.cta": "Get Started",
    "nav.ariaHome": "BrandShield AI home",
    "nav.ariaSections": "Sections",

    // ── Hero ──
    "hero.badge": "Pre-Publishing Brand Assurance",
    "hero.titleA": "Catch brand drift",
    "hero.titleB": "before it ships",
    "hero.titleEnd": ".",
    "hero.sub":
      "An explainable copilot that prevents factual hallucinations, tone drift, visual non-compliance, and compliance violations before content publication — grounded in your verified corporate documents.",
    "hero.ctaPrimary": "Start free in sandbox",
    "hero.ctaSecondary": "See the 5-stage workflow",

    // ── Hero product mock ──
    "mock.title": "Pre-Flight Scan",
    "mock.draft": "Draft v3",
    "mock.quoteA": "“Experience up to",
    "mock.quoteFlag": "340% guaranteed conversion uplift",
    "mock.quoteB": "with zero ramp-up time.”",
    "mock.unverified": "Unverified claim — no supporting source in Brand Voice Guide §4.2",
    "mock.chipCritical": "Critical Claim Mismatch",
    "mock.chipWarning": "Warning Tone Drift",
    "mock.chipMinor": "Minor Style",
    "mock.complianceScore": "Compliance Score",
    "mock.citationsVerified": "3 citations verified",
    "mock.auditLogged": "SHA-256 audit logged",

    // ── Problem ──
    "problem.kicker": "The problem",
    "problem.title": "Governance fails at the last mile",
    "problem.sub":
      "Brand books are thorough — enforcement is not. Drift is discovered after publication, when the damage is already public.",
    "problem.p1.title": "Factual Hallucinations & Unverified Claims",
    "problem.p1.desc":
      "Confidently published statistics and product claims that no verified corporate document actually supports.",
    "problem.p2.title": "Brand Voice Fragmentation",
    "problem.p2.desc":
      "Every team writes in a different tone, eroding the consistent voice your audience was trained to trust.",
    "problem.p3.title": "Visual & Accessibility Non-Compliance",
    "problem.p3.desc":
      "Off-palette colors, stretched logos, and WCAG contrast failures that slip through until after launch.",
    "problem.p4.title": "Manual Review Bottlenecks",
    "problem.p4.desc":
      "Reviewers drown in doc threads and email chains, delaying launch dates by days for every asset.",
    "problem.stat1": "of enterprise teams publish off-brand or unverified claims",
    "problem.stat2": "business days average review delay",

    // ── Workflow ──
    "workflow.kicker": "The workflow",
    "workflow.title": "Five stages between draft and public",
    "workflow.sub": "Every step is explainable, auditable, and grounded in documents you already trust.",
    "workflow.s1.title": "Repository Ingestion & Brand Tokenization",
    "workflow.s1.desc":
      "Connect guideline PDFs, style wikis, and approved visual tokens. BrandShield tokenizes them into a governed, versioned knowledge base.",
    "workflow.s2.title": "Multi-Modal Pre-Flight Analysis",
    "workflow.s2.desc":
      "Deterministic validators, RAG claim verification, and vision checks run on every text and banner draft before it moves an inch.",
    "workflow.s3.title": "Explainable Findings & Guided Remediation",
    "workflow.s3.desc":
      "Every flag cites the exact rule and source document, with one-click, tone-preserving rewrite suggestions.",
    "workflow.s4.title": "Collaborative Sign-Off & Cryptographic Audit Trail",
    "workflow.s4.desc":
      "Reviewers approve or request changes on a shared board; each decision is hashed into a tamper-evident SHA-256 chain.",
    "workflow.s5.title": "Brand Drift & Rule Ambiguity Analytics",
    "workflow.s5.desc":
      "Spot recurring drift patterns and rules that generate friction, then refine your governance where it matters most.",

    // ── Personas ──
    "personas.kicker": "Personas",
    "personas.title": "Built for everyone who touches the brand",
    "personas.p1.title": "Content Creators & Copywriters",
    "personas.p1.pain": "Waiting days for manual brand reviews kills creative momentum.",
    "personas.p1.value": "Instant pre-flight scans with cited, actionable fixes — ship same-day.",
    "personas.p2.title": "Brand Managers & Legal Reviewers",
    "personas.p2.pain": "Risky claims and tone drift hide inside endless doc threads.",
    "personas.p2.value": "One approval board with explainable findings and a full audit trail.",
    "personas.p3.title": "External Agencies & Contractors",
    "personas.p3.pain": "Contractors lack context on every client's brand rules.",
    "personas.p3.value": "Sandboxed workspaces enforce client guidelines without exposing internals.",
    "personas.p4.title": "CMO & Marketing Leadership",
    "personas.p4.pain": "No quantified visibility into where brand equity leaks.",
    "personas.p4.value": "Drift analytics measure risk and prove governance ROI to the board.",

    // ── Pricing ──
    "pricing.kicker": "Pricing",
    "pricing.title": "Governance that scales with you",
    "pricing.sub": "Start free in sandbox. Upgrade when the team does.",
    "pricing.popular": "Most popular",
    "pricing.perMonth": "/month",
    "pricing.ctaFree": "Start free",
    "pricing.ctaEnterprise": "Contact sales",

    "pricing.tier.starter": "Starter — Agency Sandbox",
    "pricing.tier.starter.blurb":
      "Self-service pre-flight sandbox for external agencies testing copy against client-approved guidelines.",
    "pricing.tier.starter.f1": "50 pre-flight scans / month",
    "pricing.tier.starter.f2": "Deterministic + tone checks",
    "pricing.tier.starter.f3": "Single client workspace",
    "pricing.tier.starter.f4": "Banned-term & trademark validator",
    "pricing.tier.starter.f5": "Community support",

    "pricing.tier.growth": "Growth — Team Governance",
    "pricing.tier.growth.blurb":
      "Unlimited multi-modal audits with RAG claim verification and a role-based review board.",
    "pricing.tier.growth.f1": "Unlimited text & banner audits",
    "pricing.tier.growth.f2": "RAG claim verification w/ citations",
    "pricing.tier.growth.f3": "Role-based review board",
    "pricing.tier.growth.f4": "One-click tone-preserving rewrites",
    "pricing.tier.growth.f5": "WCAG 2.1 visual inspector",
    "pricing.tier.growth.f6": "Priority support",

    "pricing.tier.enterprise": "Enterprise — Custom Shield",
    "pricing.tier.enterprise.blurb":
      "Custom vector knowledge bases, cryptographic audit exports, SSO, and bi-directional analytics.",
    "pricing.tier.enterprise.f1": "Everything in Growth",
    "pricing.tier.enterprise.f2": "Custom vector knowledge bases",
    "pricing.tier.enterprise.f3": "SHA-256 cryptographic audit exports",
    "pricing.tier.enterprise.f4": "SSO / OAuth + MFA enforcement",
    "pricing.tier.enterprise.f5": "Bi-directional rule-friction analytics",
    "pricing.tier.enterprise.f6": "Zero-data-retention guarantee",
    "pricing.tier.enterprise.f7": "Dedicated success manager",

    // ── CTA band ──
    "cta.title": "Ship on-brand, every time.",
    "cta.sub":
      "Spin up a sandbox workspace in under a minute — no credit card required, no data retained, full audit trail included.",
    "cta.button": "Get started free",

    // ── Footer ──
    "footer.copyright": "© 2025 BrandShield AI · Explainable brand governance",
    "footer.zdr": "Zero-Data-Retention by default",
  },

  hi: {
    // ── नेवबार ──
    "nav.problem": "समस्या",
    "nav.workflow": "वर्कफ़्लो",
    "nav.personas": "पर्सोना",
    "nav.pricing": "मूल्य",
    "nav.cta": "शुरू करें",
    "nav.ariaHome": "BrandShield AI होम",
    "nav.ariaSections": "सेक्शन",

    // ── हीरो ──
    "hero.badge": "प्रकाशन-पूर्व ब्रांड आश्वासन",
    "hero.titleA": "ब्रांड ड्रिफ़्ट को",
    "hero.titleB": "प्रकाशित होने से पहले पकड़ें",
    "hero.titleEnd": "।",
    "hero.sub":
      "एक व्याख्यात्मक कोपायलट जो कंटेंट के प्रकाशित होने से पहले तथ्यात्मक हैल्यूसिनेशन, टोन ड्रिफ़्ट, विज़ुअल गैर-अनुपालन और अनुपालन उल्लंघनों को रोकता है — पूरी तरह आपके सत्यापित कॉर्पोरेट दस्तावेज़ों पर आधारित।",
    "hero.ctaPrimary": "सैंडबॉक्स में मुफ़्त शुरुआत करें",
    "hero.ctaSecondary": "5-चरणीय वर्कफ़्लो देखें",

    // ── हीरो प्रोडक्ट मॉक ──
    "mock.title": "प्री-फ़्लाइट स्कैन",
    "mock.draft": "ड्राफ़्ट v3",
    "mock.quoteA": "“शून्य रैंप-अप समय के साथ",
    "mock.quoteFlag": "340% तक की गारंटीकृत कन्वर्ज़न वृद्धि",
    "mock.quoteB": "का अनुभव करें।”",
    "mock.unverified": "असत्यापित दावा — ब्रांड वॉइस गाइड §4.2 में कोई समर्थक स्रोत नहीं",
    "mock.chipCritical": "गंभीर दावा बेमेल",
    "mock.chipWarning": "चेतावनी: टोन ड्रिफ़्ट",
    "mock.chipMinor": "मामूली स्टाइल",
    "mock.complianceScore": "अनुपालन स्कोर",
    "mock.citationsVerified": "3 उद्धरण सत्यापित",
    "mock.auditLogged": "SHA-256 ऑडिट दर्ज हुआ",

    // ── समस्या ──
    "problem.kicker": "समस्या",
    "problem.title": "गवर्नेंस आख़िरी चरण में नाकाम हो जाती है",
    "problem.sub":
      "ब्रांड बुक्स विस्तृत होती हैं — लेकिन उनका प्रवर्तन नहीं। ड्रिफ़्ट का पता प्रकाशन के बाद चलता है, जब नुक़सान सबके सामने हो चुका होता है।",
    "problem.p1.title": "तथ्यात्मक हैल्यूसिनेशन और असत्यापित दावे",
    "problem.p1.desc":
      "आत्मविश्वास भरकर प्रकाशित किए गए आँकड़े और प्रोडक्ट दावे, जिन्हें असल में कोई सत्यापित कॉर्पोरेट दस्तावेज़ समर्थन नहीं देता।",
    "problem.p2.title": "ब्रांड वॉइस का बिखराव",
    "problem.p2.desc":
      "हर टीम अलग टोन में लिखती है, जिससे वह एकसुर आवाज़ कमज़ोर पड़ती है जिस पर भरोसा करना आपके दर्शकों को सिखाया गया था।",
    "problem.p3.title": "विज़ुअल और एक्सेसिबिलिटी गैर-अनुपालन",
    "problem.p3.desc":
      "पैलेट से हटकर रंग, खिंचे हुए लोगो और WCAG कॉन्ट्रास्ट विफलताएँ, जो लॉन्च के बाद तक नज़रों से बच जाती हैं।",
    "problem.p4.title": "मैन्युअल समीक्षा की अड़चनें",
    "problem.p4.desc":
      "समीक्षक दस्तावेज़-थ्रेड और ईमेल-चेन में डूबे रहते हैं, जिससे हर ऐसेट की लॉन्च कई दिनों पीछे खिसक जाती है।",
    "problem.stat1": "एंटरप्राइज़ टीमें ऑफ़-ब्रांड या असत्यापित दावे प्रकाशित करती हैं",
    "problem.stat2": "कारोबारी दिनों में समीक्षा में औसत देरी",

    // ── वर्कफ़्लो ──
    "workflow.kicker": "वर्कफ़्लो",
    "workflow.title": "ड्राफ़्ट से प्रकाशन तक के पाँच चरण",
    "workflow.sub": "हर क़दम व्याख्या-योग्य, ऑडिट-योग्य है और उन दस्तावेज़ों पर आधारित है जिन पर आप पहले से भरोसा करते हैं।",
    "workflow.s1.title": "रिपॉज़िटरी इन्जेशन और ब्रांड टोकनाइज़ेशन",
    "workflow.s1.desc":
      "गाइडलाइन PDF, स्टाइल विकि और स्वीकृत विज़ुअल टोकन कनेक्ट करें। BrandShield इन्हें एक नियंत्रित, वर्ज़नबद्ध नॉलेज बेस में टोकनाइज़ कर देता है।",
    "workflow.s2.title": "मल्टी-मोडल प्री-फ़्लाइट विश्लेषण",
    "workflow.s2.desc":
      "डिटरमिनिस्टिक वैलिडेटर, RAG दावा-सत्यापन और विज़न जाँचें हर टेक्स्ट और बैनर ड्राफ़्ट पर उसके आगे बढ़ने से पहले ही चल जाती हैं।",
    "workflow.s3.title": "व्याख्या-योग्य फाइंडिंग्स और निर्देशित सुधार",
    "workflow.s3.desc":
      "हर फ़्लैग सटीक नियम और स्रोत दस्तावेज़ का उल्लेख करता है, साथ में एक-क्लिक, टोन सुरक्षित रखने वाले रीराइट सुझाव भी।",
    "workflow.s4.title": "सहयोगी स्वीकृति और क्रिप्टोग्राफ़िक ऑडिट ट्रेल",
    "workflow.s4.desc":
      "समीक्षक एक साझा बोर्ड पर स्वीकृति देते हैं या बदलाव माँगते हैं; हर निर्णय छेड़छाड़-प्रतिरोधी SHA-256 चेन में हैश होकर दर्ज होता है।",
    "workflow.s5.title": "ब्रांड ड्रिफ़्ट और नियम-अस्पष्टता एनालिटिक्स",
    "workflow.s5.desc":
      "बार-बार लौटते ड्रिफ़्ट पैटर्न और अड़चनें पैदा करने वाले नियमों को पहचानें, फिर अपनी गवर्नेंस को वहीं सुधारें जहाँ सबसे ज़्यादा ज़रूरत है।",

    // ── पर्सोना ──
    "personas.kicker": "पर्सोना",
    "personas.title": "ब्रांड से जुड़ने वाले हर व्यक्ति के लिए बनाया गया",
    "personas.p1.title": "कंटेंट क्रिएटर और कॉपीराइटर",
    "personas.p1.pain": "मैन्युअल ब्रांड समीक्षा के लिए दिनों इंतज़ार रचनात्मक रफ़्तार तोड़ देता है।",
    "personas.p1.value": "तुरंत प्री-फ़्लाइट स्कैन, उद्धरण-सहित व्यावहारिक सुधार — उसी दिन शिप करें।",
    "personas.p2.title": "ब्रांड मैनेजर और लीगल समीक्षक",
    "personas.p2.pain": "जोखिम भरे दावे और टोन ड्रिफ़्ट अंतहीन दस्तावेज़-थ्रेड में छिपे रहते हैं।",
    "personas.p2.value": "एक स्वीकृति बोर्ड, जिसमें व्याख्या-योग्य फाइंडिंग्स और पूरा ऑडिट ट्रेल मौजूद है।",
    "personas.p3.title": "बाहरी एजेंसियाँ और कॉन्ट्रैक्टर",
    "personas.p3.pain": "कॉन्ट्रैक्टर के पास हर क्लाइंट के ब्रांड नियमों का संदर्भ नहीं होता।",
    "personas.p3.value": "सैंडबॉक्स्ड वर्कस्पेस क्लाइंट गाइडलाइन लागू करते हैं, बिना आंतरिक जानकारी उजागर किए।",
    "personas.p4.title": "CMO और मार्केटिंग नेतृत्व",
    "personas.p4.pain": "ब्रांड इक्विटी कहाँ रिस रही है, इसका कोई मात्रात्मक आकलन नहीं।",
    "personas.p4.value": "ड्रिफ़्ट एनालिटिक्स जोखिम मापते हैं और बोर्ड के सामने गवर्नेंस का ROI सिद्ध करते हैं।",

    // ── मूल्य ──
    "pricing.kicker": "मूल्य",
    "pricing.title": "गवर्नेंस जो आपके साथ स्केल करती है",
    "pricing.sub": "सैंडबॉक्स में मुफ़्त शुरू करें। टीम बढ़ने पर अपग्रेड करें।",
    "pricing.popular": "सबसे लोकप्रिय",
    "pricing.perMonth": "/माह",
    "pricing.ctaFree": "मुफ़्त शुरू करें",
    "pricing.ctaEnterprise": "सेल्स से संपर्क करें",

    "pricing.tier.starter": "स्टार्टर — एजेंसी सैंडबॉक्स",
    "pricing.tier.starter.blurb":
      "बाहरी एजेंसियों के लिए सेल्फ़-सर्विस प्री-फ़्लाइट सैंडबॉक्स, जहाँ कॉपी को क्लाइंट-स्वीकृत गाइडलाइन के मुक़ाबले परखा जा सके।",
    "pricing.tier.starter.f1": "50 प्री-फ़्लाइट स्कैन / माह",
    "pricing.tier.starter.f2": "डिटरमिनिस्टिक + टोन जाँचें",
    "pricing.tier.starter.f3": "एकल क्लाइंट वर्कस्पेस",
    "pricing.tier.starter.f4": "प्रतिबंधित-शब्द और ट्रेडमार्क वैलिडेटर",
    "pricing.tier.starter.f5": "कम्युनिटी सहायता",

    "pricing.tier.growth": "ग्रोथ — टीम गवर्नेंस",
    "pricing.tier.growth.blurb":
      "असीमित मल्टी-मोडल ऑडिट, RAG दावा-सत्यापन और रोल-आधारित समीक्षा बोर्ड के साथ।",
    "pricing.tier.growth.f1": "असीमित टेक्स्ट और बैनर ऑडिट",
    "pricing.tier.growth.f2": "उद्धरण-सहित RAG दावा सत्यापन",
    "pricing.tier.growth.f3": "रोल-आधारित समीक्षा बोर्ड",
    "pricing.tier.growth.f4": "एक-क्लिक, टोन बनाए रखने वाले रीराइट",
    "pricing.tier.growth.f5": "WCAG 2.1 विज़ुअल इंस्पेक्टर",
    "pricing.tier.growth.f6": "प्राथमिकता सहायता",

    "pricing.tier.enterprise": "एंटरप्राइज़ — कस्टम शील्ड",
    "pricing.tier.enterprise.blurb":
      "कस्टम वेक्टर नॉलेज बेस, क्रिप्टोग्राफ़िक ऑडिट एक्सपोर्ट, SSO और द्विदिश एनालिटिक्स।",
    "pricing.tier.enterprise.f1": "Growth की सभी सुविधाएँ",
    "pricing.tier.enterprise.f2": "कस्टम वेक्टर नॉलेज बेस",
    "pricing.tier.enterprise.f3": "SHA-256 क्रिप्टोग्राफ़िक ऑडिट एक्सपोर्ट",
    "pricing.tier.enterprise.f4": "SSO / OAuth + MFA प्रवर्तन",
    "pricing.tier.enterprise.f5": "द्विदिश नियम-घर्षण एनालिटिक्स",
    "pricing.tier.enterprise.f6": "ज़ीरो-डेटा-रिटेंशन गारंटी",
    "pricing.tier.enterprise.f7": "समर्पित सक्सेस मैनेजर",

    // ── CTA बैंड ──
    "cta.title": "हर बार, ब्रांड के अनुरूप शिप करें।",
    "cta.sub":
      "एक मिनट से भी कम में सैंडबॉक्स वर्कस्पेस तैयार करें — क्रेडिट कार्ड की ज़रूरत नहीं, कोई डेटा सुरक्षित नहीं रखा जाता, पूरा ऑडिट ट्रेल शामिल।",
    "cta.button": "मुफ़्त में शुरू करें",

    // ── फ़ुटर ──
    "footer.copyright": "© 2025 BrandShield AI · व्याख्यात्मक ब्रांड गवर्नेंस",
    "footer.zdr": "डिफ़ॉल्ट रूप से ज़ीरो-डेटा-रिटेंशन",
  },
} as const;

registerDict("landing", dict);
