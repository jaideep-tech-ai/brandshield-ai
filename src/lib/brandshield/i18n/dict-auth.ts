"use client";

import { registerDict } from "./index";

// ─── Auth screen — sign-in / sign-up (English ⇄ हिन्दी) ──────────────────────
// Consumed via side-effect import in auth-view.tsx.
// Persona proper names, emails and passwords are data and are never translated.

const dict = {
  en: {
    // Brand panel (desktop aside)
    "brand.tagline": "Catch brand drift before it ships — with proof, not vibes.",
    "brand.footnote": "Trusted by brand, legal & agency teams for pre-publishing governance.",

    "trust.citations.title": "Explainable citations",
    "trust.citations.desc": "Every finding cites the exact rule and source document.",
    "trust.audit.title": "SHA-256 audit trail",
    "trust.audit.desc": "Tamper-evident chain of every review decision.",
    "trust.retention.title": "Zero-data-retention",
    "trust.retention.desc": "Your drafts are never used for model training.",

    // Header row (back button + Firebase badge + language toggle)
    "action.backFull": "Back to overview",
    "badge.connectedTitle": "Connected to your Firebase project — email/password auth runs through Firebase Authentication.",
    "badge.localTitle": "Running in Firebase-compatible local mode. Add NEXT_PUBLIC_FIREBASE_* config to connect a real Firebase project — no UI changes needed.",
    "badge.connected": "Connected",
    "badge.localMode": "Local mode",

    // Headings & tabs
    "signin.title": "Sign in to BrandShield",
    "signin.subtitle": "Email + password, Firebase-style — or jump in with a demo persona.",
    "signup.title": "Create your BrandShield account",
    "signup.subtitle": "Email + password, Firebase-style. New teammates join the Nimbus Labs workspace with data pre-loaded.",
    "tab.signin": "Sign in",
    "tab.signup": "Create account",
    "aria.modeTabs": "Authentication mode",

    // Demo personas
    "demo.heading": "One-click demo personas",
    "persona.title.creator": "Content Creator",
    "persona.title.reviewer": "Brand Manager & Legal Reviewer",
    "persona.title.contractor": "External Agency (PixelWorks)",
    "persona.title.admin": "CMO / Brand Admin",
    "divider.orEmail": "or sign in with email",

    // Shared fields
    "field.email": "Email",
    "field.password": "Password",

    // Sign-in form
    "signin.helperPrefix": "Any demo persona email works with password",
    "signin.helperSuffix": ".",
    "action.signIn": "Sign in",
    "action.signingIn": "Signing in…",

    // Sign-up form
    "signup.name": "Full name",
    "signup.namePlaceholder": "Jordan Lee",
    "signup.department": "Team / department",
    "optional": "(optional)",
    "signup.deptPlaceholder": "Content Studio",
    "signup.emailPlaceholder": "you@company.com",
    "signup.passwordPlaceholder": "6+ characters",
    "signup.confirm": "Confirm password",
    "signup.confirmPlaceholder": "Repeat it",
    "signup.roleLegend": "Choose your role",
    "role.label.creator": "Content Creator",
    "role.label.reviewer": "Brand / Legal Reviewer",
    "role.label.contractor": "External Agency",
    "role.label.admin": "CMO / Brand Admin",
    "role.hint.creator": "Draft, scan, fix, submit",
    "role.hint.reviewer": "Approve or request changes",
    "role.hint.contractor": "Sandboxed pre-checks",
    "role.hint.admin": "Knowledge, billing, analytics",
    "signup.footer": "You'll join the Nimbus Labs demo workspace — seeded with a real brand repository.",
    "error.mismatchLive": "Passwords don't match yet.",

    // Submit buttons & toasts
    "action.signUp": "Create account & start tour",
    "action.creatingAccount": "Creating account…",
    "toast.signedInAs": "Signed in as {name}",
    "toast.signedIn": "Signed in successfully",
    "toast.welcome": "Welcome aboard, {name}! Your guided tour is about to start.",
    "toast.passwordMismatch": "Passwords don't match — please retype them.",

    // ARIA
    "aria.showPassword": "Show password",
    "aria.hidePassword": "Hide password",
  },

  hi: {
    // ब्रांड पैनल (डेस्कटॉप)
    "brand.tagline": "ब्रांड ड्रिफ़्ट को लॉन्च से पहले पकड़ें — वाइब्स पर नहीं, सबूतों पर।",
    "brand.footnote": "प्रकाशन-पूर्व गवर्नेंस के लिए ब्रांड, लीगल और एजेंसी टीमों का भरोसेमंद साथ।",

    "trust.citations.title": "स्पष्टीकरण योग्य हवाले",
    "trust.citations.desc": "हर फ़ाइंडिंग सटीक नियम और स्रोत दस्तावेज़ का हवाला देती है।",
    "trust.audit.title": "SHA-256 ऑडिट ट्रेल",
    "trust.audit.desc": "हर समीक्षा निर्णय की छेड़छाड़-रोधी शृंखला।",
    "trust.retention.title": "ज़ीरो-डेटा-रिटेंशन",
    "trust.retention.desc": "आपके ड्राफ़्ट कभी भी मॉडल ट्रेनिंग के लिए इस्तेमाल नहीं होते।",

    // हेडर पंक्ति (वापस बटन + Firebase बैज + भाषा टॉगल)
    "action.backFull": "अवलोकन पर वापस",
    "badge.connectedTitle": "आपके Firebase प्रोजेक्ट से कनेक्टेड — ईमेल/पासवर्ड ऑथ Firebase Authentication से होकर चलता है।",
    "badge.localTitle": "Firebase-संगत लोकल मोड में चल रहा है। असली Firebase प्रोजेक्ट से जोड़ने के लिए NEXT_PUBLIC_FIREBASE_* कॉन्फ़िग जोड़ें — UI बदलने की ज़रूरत नहीं।",
    "badge.connected": "कनेक्टेड",
    "badge.localMode": "लोकल मोड",

    // शीर्षक और टैब
    "signin.title": "BrandShield में लॉग इन करें",
    "signin.subtitle": "ईमेल + पासवर्ड, Firebase-स्टाइल — या किसी डेमो पर्सना के साथ सीधे शुरू करें।",
    "signup.title": "अपना BrandShield अकाउंट बनाएँ",
    "signup.subtitle": "ईमेल + पासवर्ड, Firebase-स्टाइल। नए टीम सदस्य Nimbus Labs वर्कस्पेस में पहले से लोड किए गए डेटा के साथ जुड़ते हैं।",
    "tab.signin": "लॉग इन",
    "tab.signup": "अकाउंट बनाएँ",
    "aria.modeTabs": "प्रमाणीकरण मोड",

    // डेमो पर्सना
    "demo.heading": "एक क्लिक डेमो पर्सना",
    "persona.title.creator": "कंटेंट क्रिएटर",
    "persona.title.reviewer": "ब्रांड मैनेजर और लीगल समीक्षक",
    "persona.title.contractor": "बाहरी एजेंसी (PixelWorks)",
    "persona.title.admin": "CMO / ब्रांड एडमिन",
    "divider.orEmail": "या ईमेल से लॉग इन करें",

    // साझा फ़ील्ड
    "field.email": "ईमेल",
    "field.password": "पासवर्ड",

    // लॉग इन फ़ॉर्म
    "signin.helperPrefix": "कोई भी डेमो पर्सना ईमेल पासवर्ड",
    "signin.helperSuffix": " के साथ काम करता है।",
    "action.signIn": "लॉग इन",
    "action.signingIn": "लॉग इन हो रहा है…",

    // अकाउंट बनाने का फ़ॉर्म
    "signup.name": "पूरा नाम",
    "signup.namePlaceholder": "Jordan Lee",
    "signup.department": "टीम / विभाग",
    "optional": "(वैकल्पिक)",
    "signup.deptPlaceholder": "कंटेंट स्टूडियो",
    "signup.emailPlaceholder": "you@company.com",
    "signup.passwordPlaceholder": "6+ अक्षर",
    "signup.confirm": "पासवर्ड की पुष्टि करें",
    "signup.confirmPlaceholder": "दोबारा टाइप करें",
    "signup.roleLegend": "अपनी भूमिका चुनें",
    "role.label.creator": "कंटेंट क्रिएटर",
    "role.label.reviewer": "ब्रांड / लीगल समीक्षक",
    "role.label.contractor": "बाहरी एजेंसी",
    "role.label.admin": "CMO / ब्रांड एडमिन",
    "role.hint.creator": "ड्राफ़्ट करें, स्कैन करें, ठीक करें, सबमिट करें",
    "role.hint.reviewer": "मंज़ूरी दें या बदलाव माँगें",
    "role.hint.contractor": "सैंडबॉक्स में प्री-चेक",
    "role.hint.admin": "नॉलेज, बिलिंग, एनालिटिक्स",
    "signup.footer": "आप Nimbus Labs डेमो वर्कस्पेस में शामिल होंगे — जिसमें असली ब्रांड रिपॉज़िटरी पहले से तैयार है।",
    "error.mismatchLive": "पासवर्ड अभी मेल नहीं खा रहे।",

    // सबमिट बटन और टोस्ट
    "action.signUp": "अकाउंट बनाएँ और टूर शुरू करें",
    "action.creatingAccount": "अकाउंट बन रहा है…",
    "toast.signedInAs": "{name} के रूप में लॉग इन हुआ",
    "toast.signedIn": "सफलतापूर्वक लॉग इन हो गया",
    "toast.welcome": "स्वागत है, {name}! आपका निर्देशित टूर बस शुरू होने ही वाला है।",
    "toast.passwordMismatch": "पासवर्ड मेल नहीं खा रहे — कृपया दोबारा टाइप करें।",

    // ARIA
    "aria.showPassword": "पासवर्ड दिखाएँ",
    "aria.hidePassword": "पासवर्ड छिपाएँ",
  },
} as const;

registerDict("auth", dict);
