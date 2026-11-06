"use client";

import { registerDict } from "@/lib/brandshield/i18n";

// ─── Billing & Subscription view — EN ⇄ HI ───────────────────────────────────
// Tier display names come from `common.tier.*`; prices/scan limits come from
// TIER_META (numbers only). Member/merchant names are data, never translated.

const dict = {
  en: {
    // Header
    "title": "Billing & Subscription",
    "subtitle": "Plan, quota and seat management for your organization workspace.",
    "sandboxBadge": "Sandbox Mode — Stripe test environment",
    "readOnlyBadge": "Read-only",

    // Current plan card
    "currentPlan": "Current plan",
    "status.active": "Active",
    "perMonth": "/ month",
    "renews": "Renews {date}",
    "noRenewalDate": "No renewal date",
    "seat.one": "{n} seat",
    "seat.many": "{n} seats",
    "managePortal": "Manage billing portal",

    // Usage / scan quota
    "scanQuota": "Scan quota",
    "unlimitedScans": "Unlimited pre-flight scans",
    "scansThisCycle": "{n} scans this cycle",
    "scansUsed": "{used} of {limit} scans used",
    "quotaResets": "Quota resets at the start of each billing cycle.",

    // Read-only notice
    "readOnlyTitle": "Read-only",
    "readOnlyDesc": "Brand Admins manage plan changes and payment methods.",

    // Tier cards — shared badges
    "popular": "Most popular",

    // Tier cards — starter
    "tier.starter.short": "Starter",
    "tier.starter.tagline": "Agency Sandbox",
    "tier.starter.blurb": "Self-service pre-flight sandbox for external agencies testing copy against client-approved guidelines.",
    "tier.starter.f1": "50 pre-flight scans / month",
    "tier.starter.f2": "Deterministic + tone checks",
    "tier.starter.f3": "Single client workspace",
    "tier.starter.f4": "Banned-term & trademark validator",
    "tier.starter.f5": "Community support",

    // Tier cards — growth
    "tier.growth.short": "Growth",
    "tier.growth.tagline": "Team Governance",
    "tier.growth.blurb": "Unlimited multi-modal audits with RAG claim verification and a role-based review board.",
    "tier.growth.f1": "Unlimited text & banner audits",
    "tier.growth.f2": "RAG claim verification w/ citations",
    "tier.growth.f3": "Role-based review board",
    "tier.growth.f4": "One-click tone-preserving rewrites",
    "tier.growth.f5": "WCAG 2.1 visual inspector",
    "tier.growth.f6": "Priority support",

    // Tier cards — enterprise
    "tier.enterprise.short": "Enterprise",
    "tier.enterprise.tagline": "Custom Shield",
    "tier.enterprise.blurb": "Custom vector knowledge bases, cryptographic audit exports, SSO, and bi-directional analytics.",
    "tier.enterprise.f1": "Everything in Growth",
    "tier.enterprise.f2": "Custom vector knowledge bases",
    "tier.enterprise.f3": "SHA-256 cryptographic audit exports",
    "tier.enterprise.f4": "SSO / OAuth + MFA enforcement",
    "tier.enterprise.f5": "Bi-directional rule-friction analytics",
    "tier.enterprise.f6": "Zero-data-retention guarantee",
    "tier.enterprise.f7": "Dedicated success manager",

    // Upgrade / downgrade buttons
    "upgradeTo": "Upgrade to {tier}",
    "downgradeTo": "Downgrade to {tier}",

    // How billing works
    "howTitle": "How billing works",
    "howDesc": "Checkout creates a Stripe Checkout Session; the secure webhook (Stripe-Signature verified) syncs the subscription record to Firestore/DB. Seat and quota enforcement are derived from that synced subscription on every request.",

    // Simulated Stripe Checkout dialog
    "merchantOfRecord": "Merchant of record · Stripe Checkout",
    "testMode": "Test mode",
    "payConfirmed": "Payment confirmed — webhook synced",
    "syncingWorkspace": "Syncing subscription to your workspace…",
    "productLine": "BrandShield AI · monthly subscription",
    "email": "Email",
    "cardInfo": "Card information",
    "expiry": "Expiry",
    "cvc": "CVC",
    "sandboxNote": "Sandbox mode — no real charge. STRIPE_SECRET_KEY enables live Checkout.",
    "processing": "Processing…",
    "payNow": "Pay ${amount}",
    "stripeFooter": "Powered by Stripe · PCI-DSS Level 1 · Payments are simulated in this environment",

    // Toasts
    "toastCheckoutError": "Could not start checkout.",
    "toastSubUpdated": "Subscription updated",
    "toastPayError": "Payment could not be confirmed.",
    "toastPortalInfo": "Stripe Customer Portal opens here in production (sandbox mode)",
    "toastPortalError": "Could not open the billing portal.",
  },

  hi: {
    // Header
    "title": "बिलिंग और सब्सक्रिप्शन",
    "subtitle": "आपके संगठन वर्कस्पेस के लिए प्लान, कोटा और सीट प्रबंधन।",
    "sandboxBadge": "सैंडबॉक्स मोड — Stripe टेस्ट एनवायरनमेंट",
    "readOnlyBadge": "केवल देखने योग्य",

    // Current plan card
    "currentPlan": "वर्तमान प्लान",
    "status.active": "सक्रिय",
    "perMonth": "/ माह",
    "renews": "{date} को नवीनीकरण",
    "noRenewalDate": "कोई नवीनीकरण तिथि नहीं",
    "seat.one": "{n} सीट",
    "seat.many": "{n} सीटें",
    "managePortal": "बिलिंग पोर्टल प्रबंधित करें",

    // Usage / scan quota
    "scanQuota": "स्कैन कोटा",
    "unlimitedScans": "असीमित प्री-फ़्लाइट स्कैन",
    "scansThisCycle": "इस चक्र में {n} स्कैन",
    "scansUsed": "{limit} में से {used} स्कैन उपयोग हुए",
    "quotaResets": "कोटा हर बिलिंग चक्र की शुरुआत में रीसेट हो जाता है।",

    // Read-only notice
    "readOnlyTitle": "केवल देखने योग्य",
    "readOnlyDesc": "प्लान बदलाव और भुगतान विधियाँ ब्रांड एडमिन प्रबंधित करते हैं।",

    // Tier cards — shared badges
    "popular": "सबसे लोकप्रिय",

    // Tier cards — starter
    "tier.starter.short": "स्टार्टर",
    "tier.starter.tagline": "एजेंसी सैंडबॉक्स",
    "tier.starter.blurb": "बाहरी एजेंसियों के लिए सेल्फ़-सर्विस प्री-फ़्लाइट सैंडबॉक्स, जहाँ कॉपी को क्लाइंट-स्वीकृत गाइडलाइन के मुताबिक़ परखा जा सकता है।",
    "tier.starter.f1": "50 प्री-फ़्लाइट स्कैन / माह",
    "tier.starter.f2": "डिटरमिनिस्टिक + टोन जाँच",
    "tier.starter.f3": "एक क्लाइंट वर्कस्पेस",
    "tier.starter.f4": "प्रतिबंधित शब्द व ट्रेडमार्क वैलिडेटर",
    "tier.starter.f5": "कम्युनिटी सपोर्ट",

    // Tier cards — growth
    "tier.growth.short": "ग्रोथ",
    "tier.growth.tagline": "टीम गवर्नेंस",
    "tier.growth.blurb": "RAG दावा सत्यापन और भूमिका-आधारित रिव्यू बोर्ड के साथ असीमित मल्टी-मोडल ऑडिट।",
    "tier.growth.f1": "असीमित टेक्स्ट व बैनर ऑडिट",
    "tier.growth.f2": "संदर्भ सहित RAG दावा सत्यापन",
    "tier.growth.f3": "भूमिका-आधारित रिव्यू बोर्ड",
    "tier.growth.f4": "एक-क्लिक टोन-सुरक्षित रीराइट",
    "tier.growth.f5": "WCAG 2.1 विज़ुअल इंस्पेक्टर",
    "tier.growth.f6": "प्रायोरिटी सपोर्ट",

    // Tier cards — enterprise
    "tier.enterprise.short": "एंटरप्राइज़",
    "tier.enterprise.tagline": "कस्टम शील्ड",
    "tier.enterprise.blurb": "कस्टम वेक्टर नॉलेज बेस, क्रिप्टोग्राफ़िक ऑडिट एक्सपोर्ट, SSO और दो-तरफ़ा एनालिटिक्स।",
    "tier.enterprise.f1": "ग्रोथ की सभी सुविधाएँ",
    "tier.enterprise.f2": "कस्टम वेक्टर नॉलेज बेस",
    "tier.enterprise.f3": "SHA-256 क्रिप्टोग्राफ़िक ऑडिट एक्सपोर्ट",
    "tier.enterprise.f4": "SSO / OAuth + MFA लागूकरण",
    "tier.enterprise.f5": "दो-तरफ़ा रूल-फ्रिक्शन एनालिटिक्स",
    "tier.enterprise.f6": "ज़ीरो-डेटा-रिटेंशन गारंटी",
    "tier.enterprise.f7": "समर्पित सक्सेस मैनेजर",

    // Upgrade / downgrade buttons
    "upgradeTo": "{tier} पर अपग्रेड करें",
    "downgradeTo": "{tier} पर डाउनग्रेड करें",

    // How billing works
    "howTitle": "बिलिंग कैसे काम करती है",
    "howDesc": "चेकआउट एक Stripe Checkout Session बनाता है; सुरक्षित वेबहुक (Stripe-Signature सत्यापित) सब्सक्रिप्शन रिकॉर्ड को Firestore/DB में सिंक करता है। सीट और कोटा लागूकरण हर रिक्वेस्ट पर उसी सिंक की गई सब्सक्रिप्शन से तय होता है।",

    // Simulated Stripe Checkout dialog
    "merchantOfRecord": "मर्चेंट ऑफ़ रिकॉर्ड · Stripe Checkout",
    "testMode": "टेस्ट मोड",
    "payConfirmed": "भुगतान पुष्ट — वेबहुक सिंक हुआ",
    "syncingWorkspace": "सब्सक्रिप्शन आपके वर्कस्पेस में सिंक हो रहा है…",
    "productLine": "BrandShield AI · मासिक सब्सक्रिप्शन",
    "email": "ईमेल",
    "cardInfo": "कार्ड जानकारी",
    "expiry": "समाप्ति",
    "cvc": "CVC",
    "sandboxNote": "सैंडबॉक्स मोड — कोई वास्तविक शुल्क नहीं। STRIPE_SECRET_KEY लाइव चेकआउट सक्षम करता है।",
    "processing": "प्रोसेसिंग हो रहा है…",
    "payNow": "${amount} का भुगतान करें",
    "stripeFooter": "Stripe द्वारा संचालित · PCI-DSS Level 1 · इस एनवायरनमेंट में भुगतान सिम्युलेटेड हैं",

    // Toasts
    "toastCheckoutError": "चेकआउट शुरू नहीं हो सका।",
    "toastSubUpdated": "सब्सक्रिप्शन अपडेट हो गया",
    "toastPayError": "भुगतान की पुष्टि नहीं हो सकी।",
    "toastPortalInfo": "प्रोडक्शन में यहीं Stripe कस्टमर पोर्टल खुलेगा (सैंडबॉक्स मोड)",
    "toastPortalError": "बिलिंग पोर्टल नहीं खोला जा सका।",
  },
} as const;

registerDict("billing", dict);
