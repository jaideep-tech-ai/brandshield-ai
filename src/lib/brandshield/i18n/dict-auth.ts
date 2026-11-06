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
    "signup.subtitle": "Email + password, Firebase-style. You get your own private workspace, ready in seconds.",
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
    "signup.organization": "Company / workspace name",
    "signup.orgPlaceholder": "Acme Marketing",
    "signup.orgHint": "A private, isolated workspace is provisioned just for your team — no shared data.",
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
    "signup.footer": "Your own isolated workspace is provisioned atomically — duplicates are impossible, passwords are scrypt-hashed.",
    "error.mismatchLive": "Passwords don't match yet.",

    // Firebase-style error codes → localized messages (server sends codes; UI translates)
    "err.invalid-email": "That email address doesn't look right. Check the format — e.g. you@company.com.",
    "err.missing-password": "Please enter a password.",
    "err.weak-password": "Password should be at least 6 characters.",
    "err.missing-name": "Please tell us your full name — it appears on reviews and audit logs.",
    "err.email-already-in-use": "An account with this email already exists. Sign in instead — duplicates are blocked by design.",
    "err.user-not-found": "No account found for this email. Create one on the “Create account” tab, or use a one-click demo persona.",
    "err.wrong-password": "Incorrect password. Demo accounts use “demo1234”.",
    "err.missing-credentials": "Email and password are required.",
    "err.too-many-requests": "Too many attempts from this network. Please wait a few minutes and try again.",
    "err.unknown": "Something went wrong. Please try again.",

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
    "signup.subtitle": "ईमेल + पासवर्ड, Firebase-स्टाइल। आपको कुछ ही सेकंड में अपना निजी वर्कस्पेस मिलता है।",
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
    "signup.organization": "कंपनी / वर्कस्पेस का नाम",
    "signup.orgPlaceholder": "Acme मार्केटिंग",
    "signup.orgHint": "आपकी टीम के लिए निजी, पूरी तरह अलग वर्कस्पेस बनता है — कोई शेयर्ड डेटा नहीं।",
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
    "signup.footer": "आपका अलग वर्कस्पेस एक ही ट्रांज़ैक्शन में बनता है — डुप्लीकेट असंभव, पासवर्ड scrypt-हैश्ड।",
    "error.mismatchLive": "पासवर्ड अभी मेल नहीं खा रहे।",

    // Firebase-स्टाइल एरर कोड → अनूदित संदेश
    "err.invalid-email": "यह ईमेल पता सही नहीं लग रहा। फ़ॉर्मैट जाँचें — जैसे aap@company.com।",
    "err.missing-password": "कृपया पासवर्ड दर्ज करें।",
    "err.weak-password": "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।",
    "err.missing-name": "कृपया अपना पूरा नाम बताएँ — यह समीक्षाओं और ऑडिट लॉग में दिखता है।",
    "err.email-already-in-use": "इस ईमेल का अकाउंट पहले से मौजूद है। कृपया लॉग इन करें — डुप्लीकेट जान-बूझकर रोके गए हैं।",
    "err.user-not-found": "इस ईमेल का कोई अकाउंट नहीं मिला। “अकाउंट बनाएँ” टैब से बनाएँ, या किसी वन-क्लिक डेमो पर्सना का उपयोग करें।",
    "err.wrong-password": "पासवर्ड गलत है। डेमो अकाउंट का पासवर्ड “demo1234” है।",
    "err.missing-credentials": "ईमेल और पासवर्ड दोनों ज़रूरी हैं।",
    "err.too-many-requests": "इस नेटवर्क से बहुत ज़्यादा प्रयास हुए हैं। कृपया कुछ मिनट रुककर फिर कोशिश करें।",
    "err.unknown": "कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।",

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
