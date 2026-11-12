"use client";

import { registerDict } from "@/lib/brandshield/i18n";

// ─── Role-specific guided tours (creator / reviewer / contractor / admin) ────
//
// Key shape: tour.<role>.s<n>.title | .body — comprehensive scripted walkthrough per role.
// Shared chrome (counter, buttons, completion card, tasks) lives under tour.* directly.

const dict = {
  en: {
    stepCounter: "Step {x} of {y}",
    allSet: "You're all set",
    "complete.title": "Tour complete — you're ready to ship on-brand",

    // Controls
    "btn.go": "Let's go",
    "btn.start": "Start Interactive Tour",
    "btn.next": "Next",
    "btn.back": "Back",
    "btn.finish": "Finish",
    "btn.skip": "Skip tour",
    "btn.pause": "Pause",
    "btn.resume": "Resume Tour",
    "btn.restart": "Restart Tour",

    "aria.skip": "Skip tour",
    "aria.dialog": "Guided product tour",

    // Welcome Screen
    "welcome.title": "Welcome to BrandShield AI",
    "welcome.tagline":
      "The unified, autonomous brand governance platform that keeps copy, design assets, and marketing campaigns 100% compliant with brand guidelines and WCAG 2.1 accessibility.",
    "welcome.roleLabel": "Your Role",
    "welcome.permissionsTitle": "Your Permissions & Capabilities",
    "welcome.cta": "Start Guided Walkthrough",
    "welcome.skipCta": "Explore on my own",

    // Role permissions summaries
    "perm.admin": "Full Organization Governance · Team & Role Admin · Integrations · Database Health · Approvals & Overrides",
    "perm.reviewer": "Compliance Review Desk · Findings Triage · Evidence Verification · Apply & Override Fixes · Formal Sign-Off",
    "perm.creator": "Content Studio · Draft Composer · Asset & Banner Uploads · Pre-Flight Scanner · One-Click AI Rewrites · Submit for Review",
    "perm.contractor": "Client Sandbox · Read-Only Governance Overview · Asset Pre-Checks · Evidence & Citation Inspection · Audit Verification",

    // Guided Tasks
    "tasks.title": "First-Time Guided Tasks",
    "tasks.subtitle": "Hands-on milestones tracked against real database activity",
    "tasks.completed": "{done} of {total} completed",
    "tasks.allComplete": "🎉 All guided tasks completed for your role!",

    // Admin Tasks
    "task.admin_configure_org.title": "Configure Guidelines & Tokens",
    "task.admin_configure_org.desc": "Upload or verify indexed brand voice playbooks, product facts, and visual tokens in Knowledge Base.",
    "task.admin_add_team.title": "Team & Member Onboarding",
    "task.admin_add_team.desc": "Review team seats and invite colleagues with appropriate role-based access.",
    "task.admin_review_compliance.title": "Review Governance Health",
    "task.admin_review_compliance.desc": "Inspect org-wide compliance scores, active submissions, and rule friction radar.",

    // Reviewer Tasks
    "task.reviewer_review_critical.title": "Inspect Critical Findings",
    "task.reviewer_review_critical.desc": "Examine blocked claims and trademark violations against ground-truth citations.",
    "task.reviewer_inspect_evidence.title": "Verify Ground-Truth Evidence",
    "task.reviewer_inspect_evidence.desc": "Check verbatim citations and WCAG 2.1 color contrast calculations.",
    "task.reviewer_complete_approval.title": "Sign-Off or Request Changes",
    "task.reviewer_complete_approval.desc": "Complete an authorized approval or approve a resolved finding in the queue.",

    // Creator Tasks
    "task.creator_upload_asset.title": "Create or Upload an Asset",
    "task.creator_upload_asset.desc": "Compose a draft in the Studio, upload a creative banner, or ingest via integrations.",
    "task.creator_run_scan.title": "Run Pre-Flight Brand Scan",
    "task.creator_run_scan.desc": "Execute deterministic rules and multimodal AI vision inspection on your asset.",
    "task.creator_submit_approval.title": "Submit Asset for Approval",
    "task.creator_submit_approval.desc": "Resolve high-priority findings and submit your cleaned draft to the Review Desk.",

    // Contractor / Auditor Tasks
    "task.contractor_review_audit.title": "Inspect Cryptographic Audit Log",
    "task.contractor_review_audit.desc": "Review the immutable SHA-256 hash-chain of governance decisions.",
    "task.contractor_inspect_evidence.title": "Review Policy Citations",
    "task.contractor_inspect_evidence.desc": "Inspect rule citations and color palette clusters on reviewed assets.",
    "task.contractor_export_report.title": "Verify Compliance History",
    "task.contractor_export_report.desc": "Examine compliance certificates and department audit records.",

    // ── Admin · Governance HQ (Elena) — 5 Crisp Steps ──
    "admin.s1.title": "Governance HQ & System Health",
    "admin.s1.body": "Welcome {role}. Monitor enterprise compliance scores, active team submissions, and real-time governance velocity.",
    "admin.s2.title": "Brand Guidelines & Vector RAG",
    "admin.s2.body": "Upload voice playbooks, product facts, and visual tokens indexed with 3072-dim embeddings for verbatim semantic retrieval.",
    "admin.s3.title": "Pre-Flight Multi-Modal Scanner",
    "admin.s3.body": "Test copy and banners before release with sub-100ms deterministic rules and AI vision contrast checks.",
    "admin.s4.title": "Automated Findings & Citations",
    "admin.s4.body": "Inspect detected policy flags with exact rule citations, and apply 1-click tone-preserving AI corrections instantly.",
    "admin.s5.title": "Approvals & SHA-256 Audit Ledger",
    "admin.s5.body": "Every sign-off and policy override is hashed into an immutable cryptographic SHA-256 audit ledger.",
    "admin.done.body": "Your Governance HQ is configured and ready. Complete your guided tasks below or replay this tour anytime from the header button.",

    // ── Reviewer · Compliance Desk (Marcus) — 5 Crisp Steps ──
    "reviewer.s1.title": "Priority Review Queue & Radar",
    "reviewer.s1.body": "Welcome {role}. Submissions are ranked dynamically by wait time and risk severity so critical marketing drafts get prompt sign-off.",
    "reviewer.s2.title": "Brand Guidelines & Rule Citations",
    "reviewer.s2.body": "Inspect verified brand voice playbooks, approved product claims, and restricted terms directly from your review desk.",
    "reviewer.s3.title": "Findings & Evidence Verification",
    "reviewer.s3.body": "Examine detected violations with side-by-side evidence, verbatim guideline citations, and WCAG 2.1 contrast calculations.",
    "reviewer.s4.title": "AI Recommendations & Safe Rewrites",
    "reviewer.s4.body": "Evaluate 1-click AI-engineered rewrites that resolve policy violations while preserving the creator's nuanced creative tone.",
    "reviewer.s5.title": "Cryptographic Sign-Off & Audit Log",
    "reviewer.s5.body": "Approve or request changes with cryptographic SHA-256 signing, producing tamper-evident proof for enterprise audits.",
    "reviewer.done.body": "Your Review Desk is fully operational. Review pending submissions in the queue or start the guided tasks below.",

    // ── Creator · Content Studio (Ava) — 5 Crisp Steps ──
    "creator.s1.title": "Content Studio & Draft Pipeline",
    "creator.s1.body": "Welcome {role}. Compose copy, draft marketing campaigns, and monitor your active assets across the pre-flight publishing pipeline.",
    "creator.s2.title": "Multi-Modal Pre-Flight Scanner",
    "creator.s2.body": "Scan copy, images, and creative banners before sharing. Sub-100ms deterministic rules catch trademark and claim issues instantly.",
    "creator.s3.title": "Compliance Scores & 1-Click Fixes",
    "creator.s3.body": "Get explainable 0–100 compliance scores. Apply tone-preserving AI rewrite suggestions or swap banners with 1 click.",
    "creator.s4.title": "Review Desk Submissions",
    "creator.s4.body": "Submit clean drafts for formal sign-off. Track reviewer feedback, version diffs, and approval passes in real time.",
    "creator.s5.title": "24/7 AI Brand Copilot",
    "creator.s5.body": "Chat with your 24/7 AI brand expert for live advice on tone, approved taglines, color contrast, and guideline rules.",
    "creator.done.body": "Your Content Studio is ready. Try composing a draft, uploading an image, and submitting for approval using the guided tasks below.",

    // ── Contractor · Client Sandbox (Priya) — 5 Crisp Steps ──
    "contractor.s1.title": "Client Sandbox Environment",
    "contractor.s1.body": "Welcome {role}. A secure, read-only pre-flight sandbox for agency contractors to verify work against strict client guidelines.",
    "contractor.s2.title": "Authorized Guidelines & Tokens",
    "contractor.s2.body": "Access indexed client brand playbooks, approved product claims, and color palettes to ensure perfect alignment.",
    "contractor.s3.title": "Pre-Flight Asset Scanner",
    "contractor.s3.body": "Self-check deliverables before submission. Test creative banners and copy against client contrast and trademark rules.",
    "contractor.s4.title": "Findings & Remediation Desk",
    "contractor.s4.body": "Inspect categorized flags, verbatim client citations, and recommended corrections to fix issues before client review.",
    "contractor.s5.title": "Compliance Audit & Export",
    "contractor.s5.body": "Verify deliverable compliance scores and generate verifiable compliance proof backed by SHA-256 audit logs.",
    "contractor.done.body": "Your Client Sandbox is ready. Pre-check your deliverables, remediate flags, and submit with full confidence.",
  },

  hi: {
    stepCounter: "स्टेप {x} / {y}",
    allSet: "आप तैयार हैं",
    "complete.title": "टूर पूरा हुआ — अब आप ब्रांड के अनुरूप कार्य करने को तैयार हैं",

    // Controls
    "btn.go": "चलिए शुरू करें",
    "btn.start": "इंटरैक्टिव टूर शुरू करें",
    "btn.next": "आगे",
    "btn.back": "वापस",
    "btn.finish": "समाप्त",
    "btn.skip": "टूर छोड़ें",
    "btn.pause": "रोकें",
    "btn.resume": "टूर जारी रखें",
    "btn.restart": "टूर दोबारा शुरू करें",

    "aria.skip": "टूर छोड़ें",
    "aria.dialog": "गाइडेड प्रोडक्ट टूर",

    // Welcome Screen
    "welcome.title": "ब्रांडशील्ड AI में आपका स्वागत है",
    "welcome.tagline":
      "एकीकृत, स्वायत्त ब्रांड शासन मंच जो कॉपी, डिज़ाइन संपत्तियों और अभियानों को ब्रांड दिशानिर्देशों और WCAG 2.1 पहुंच मानकों के 100% अनुरूप रखता है।",
    "welcome.roleLabel": "आपकी भूमिका",
    "welcome.permissionsTitle": "आपकी अनुमतियाँ और क्षमताएँ",
    "welcome.cta": "निर्देशित वॉकथ्रू शुरू करें",
    "welcome.skipCta": "स्वयं एक्सप्लोर करें",

    // Role permissions summaries
    "perm.admin": "पूर्ण संगठन शासन · टीम और भूमिका प्रशासन · एकीकरण · डेटाबेस स्वास्थ्य · अनुमोदन और ओवरराइड",
    "perm.reviewer": "अनुपालन समीक्षा डेस्क · निष्कर्ष वर्गीकरण · साक्ष्य सत्यापन · सुधार लागू और ओवरराइड · औपचारिक अनुमोदन",
    "perm.creator": "सामग्री स्टूडियो · ड्राफ्ट कंपोज़र · संपत्ति और बैनर अपलोड · प्री-फ़्लाइट स्कैनर · वन-क्लिक AI पुनर्लेखन · समीक्षा हेतु सबमिशन",
    "perm.contractor": "क्लाइंट सैंडबॉक्स · केवल-पढ़ने योग्य शासन अवलोकन · संपत्ति प्री-चेक · साक्ष्य और उद्धरण निरीक्षण · ऑडिट सत्यापन",

    // Guided Tasks
    "tasks.title": "प्रथम-उपयोग निर्देशित कार्य",
    "tasks.subtitle": "वास्तविक डेटाबेस गतिविधि के आधार पर ट्रैक किए गए व्यावहारिक मील के पत्थर",
    "tasks.completed": "{total} में से {done} पूर्ण",
    "tasks.allComplete": "🎉 आपकी भूमिका के सभी निर्देशित कार्य सफलतापूर्वक पूर्ण हुए!",

    // Admin Tasks
    "task.admin_configure_org.title": "दिशानिर्देश और टोकन कॉन्फ़िगर करें",
    "task.admin_configure_org.desc": "नॉलेज बेस में ब्रांड आवाज़, उत्पाद तथ्य और दृश्य टोकन अपलोड या सत्यापित करें।",
    "task.admin_add_team.title": "टीम और सदस्य ऑनबोर्डिंग",
    "task.admin_add_team.desc": "टीम सीटों की समीक्षा करें और उचित भूमिका-आधारित पहुँच के साथ सहयोगियों को आमंत्रित करें।",
    "task.admin_review_compliance.title": "शासन स्वास्थ्य की समीक्षा करें",
    "task.admin_review_compliance.desc": "संगठन-व्यापी अनुपालन स्कोर, सक्रिय सबमिशन और नियम घर्षण रडार का निरीक्षण करें।",

    // Reviewer Tasks
    "task.reviewer_review_critical.title": "गंभीर निष्कर्षों का निरीक्षण करें",
    "task.reviewer_review_critical.desc": "मूल स्रोतों के विरुद्ध अवरुद्ध दावों और ट्रेडमार्क उल्लंघनों की जाँच करें।",
    "task.reviewer_inspect_evidence.title": "सत्य साक्ष्य का सत्यापन करें",
    "task.reviewer_inspect_evidence.desc": "दस्तावेज़ उद्धरणों और WCAG 2.1 रंग कंट्रास्ट गणनाओं की पुष्टि करें।",
    "task.reviewer_complete_approval.title": "अनुमोदित करें या बदलाव माँगें",
    "task.reviewer_complete_approval.desc": "एक अधिकृत अनुमोदन पूरा करें या कतार में हल किए गए निष्कर्ष को स्वीकृत करें।",

    // Creator Tasks
    "task.creator_upload_asset.title": "सामग्री बनाएँ या अपलोड करें",
    "task.creator_upload_asset.desc": "स्टूडियो में ड्राफ्ट लिखें, प्रचार बैनर अपलोड करें, या एकीकरण से सामग्री प्राप्त करें।",
    "task.creator_run_scan.title": "प्री-फ़्लाइट ब्रांड स्कैन चलाएँ",
    "task.creator_run_scan.desc": "अपनी सामग्री पर डिटरमिनिस्टिक नियम और मल्टीमॉडल AI दृष्टि निरीक्षण निष्पादित करें।",
    "task.creator_submit_approval.title": "अनुमोदन हेतु सबमिट करें",
    "task.creator_submit_approval.desc": "उच्च-प्राथमिकता वाले मुद्दों को हल करें और परिष्कृत ड्राफ्ट समीक्षा डेस्क को भेजें।",

    // Contractor / Auditor Tasks
    "task.contractor_review_audit.title": "क्रिप्टोग्राफिक ऑडिट लॉग देखें",
    "task.contractor_review_audit.desc": "शासन निर्णयों की अपरिवर्तनीय SHA-256 हैश-चेन का निरीक्षण करें।",
    "task.contractor_inspect_evidence.title": "नीति उद्धरणों की समीक्षा करें",
    "task.contractor_inspect_evidence.desc": "समीक्षित संपत्तियों पर नियम उद्धरणों और रंग पैलेट क्लस्टर की जाँच करें।",
    "task.contractor_export_report.title": "अनुपालन इतिहास सत्यापित करें",
    "task.contractor_export_report.desc": "अनुपालन प्रमाणपत्रों और विभाग ऑडिट रिकॉर्ड की जाँच करें।",

    // ── एडमिन · गवर्नेंस HQ (एलेना) — 5 Crisp Steps ──
    "admin.s1.title": "शासन अवलोकन और नियंत्रण कक्ष",
    "admin.s1.body": "स्वागत है {role}। गवर्नेंस HQ आपके संगठन में हर ड्राफ्ट, अभियान, टीम सदस्य और ब्रांड अनुपालन निर्णय की पूर्ण निगरानी प्रदान करता है।",
    "admin.s2.title": "ब्रांड दिशानिर्देश और ज्ञानकोष",
    "admin.s2.body": "वॉइस और टोन प्लेबुक, उत्पाद दावे और दृश्य टोकन अपलोड करें जो सटीक उद्धरणों के लिए अनुक्रमित हैं।",
    "admin.s3.title": "प्री-फ़्लाइट मल्टी-मॉडल स्कैनर",
    "admin.s3.body": "नियमों (<100ms) और AI दृष्टि से कॉपी और बैनर विज्ञापनों का प्रकाशन से पहले त्वरित परीक्षण करें।",
    "admin.s4.title": "स्वचालित निष्कर्ष और AI सुधार",
    "admin.s4.body": "सटीक नीति संदर्भों के साथ ब्रांड उल्लंघनों की समीक्षा करें और तुरंत 1-क्लिक AI सुधार लागू करें।",
    "admin.s5.title": "अनुमोदन और SHA-256 ऑडिट ट्रेल",
    "admin.s5.body": "प्रत्येक अनुमोदन, निर्णय और नीति अपवाद को एक अपरिवर्तनीय SHA-256 क्रिप्टोग्राफ़िक खाता बही में रिकॉर्ड किया जाता है।",
    "admin.done.body": "आपका गवर्नेंस HQ कॉन्फ़िगर और तैयार है। नीचे दिए गए निर्देशित कार्य पूरे करें या हेडर के बटन से कभी भी यह टूर दोबारा देखें।",

    // ── रिव्यूअर · समीक्षा डेस्क (मार्कस) — 5 Crisp Steps ──
    "reviewer.s1.title": "समीक्षा डेस्क और प्राथमिकता कतार",
    "reviewer.s1.body": "स्वागत है {role}। सबमिशन प्रतीक्षा समय और जोखिम गंभीरता के अनुसार कतारबद्ध होते हैं ताकि महत्वपूर्ण अभियानों को त्वरित मंजूरी मिले।",
    "reviewer.s2.title": "ब्रांड दिशानिर्देश और नीति नियम",
    "reviewer.s2.body": "अपने डेस्क से सीधे सत्यापित ब्रांड वॉइस प्लेबुक, स्वीकृत उत्पाद दावों और प्रतिबंधित शब्दों का निरीक्षण करें।",
    "reviewer.s3.title": "निष्कर्ष और साक्ष्य सत्यापन",
    "reviewer.s3.body": "सटीक उद्धरणों और WCAG 2.1 कंट्रास्ट गणनाओं के साथ पाए गए उल्लंघनों की जांच करें।",
    "reviewer.s4.title": "AI अनुशंसाएं और सुरक्षित पुनर्लेखन",
    "reviewer.s4.body": "1-क्लिक AI-निर्मित सुधारों का मूल्यांकन करें जो मूल रचनात्मक लहजे को बनाए रखते हुए नीति उल्लंघन हल करते हैं।",
    "reviewer.s5.title": "क्रिप्टोग्राफ़िक हस्ताक्षर और ऑडिट लॉग",
    "reviewer.s5.body": "क्रिप्टोग्राफ़िक SHA-256 हस्ताक्षर के साथ अनुमोदन दें या बदलाव का अनुरोध करें, जो पूर्णतः छेड़छाड़-प्रूफ रिकॉर्ड बनाता है।",
    "reviewer.done.body": "आपका समीक्षा डेस्क पूर्ण रूप से सक्रिय है। कतार में लंबित सबमिशन की समीक्षा करें या नीचे दिए गए कार्य शुरू करें।",

    // ── क्रिएटर · सामग्री स्टूडियो (आवा) — 5 Crisp Steps ──
    "creator.s1.title": "सामग्री स्टूडियो और पाइपलाइन",
    "creator.s1.body": "स्वागत है {role}। कॉपी तैयार करें, विपणन अभियान बनाएं और प्रकाशन से पहले अपनी सक्रिय संपत्तियों की निगरानी करें।",
    "creator.s2.title": "मल्टी-मॉडल प्री-फ़्लाइट स्कैनर",
    "creator.s2.body": "साझा करने से पहले कॉपी, चित्र और बैनर स्कैन करें। सब-100ms नियम तुरंत ट्रेडमार्क और दावों की जांच करते हैं।",
    "creator.s3.title": "अनुपालन स्कोर और 1-क्लिक सुधार",
    "creator.s3.body": "स्पष्ट 0–100 अनुपालन स्कोर प्राप्त करें। 1 क्लिक में AI पुनर्लेखन सुझाव लागू करें या बैनर बदलें।",
    "creator.s4.title": "समीक्षा डेस्क सबमिशन",
    "creator.s4.body": "औपचारिक अनुमोदन के लिए स्वच्छ ड्राफ्ट सबमिट करें। रीयल-टाइम में समीक्षक फीडबैक और संस्करण अंतर ट्रैक करें।",
    "creator.s5.title": "24/7 AI ब्रांड कोपायलट",
    "creator.s5.body": "ब्रांड टोन, स्वीकृत टैगलाइन, रंग कंट्रास्ट और नियमों पर लाइव सलाह के लिए अपने AI ब्रांड विशेषज्ञ से चैट करें।",
    "creator.done.body": "आपका सामग्री स्टूडियो तैयार है। ड्राफ्ट लिखें, चित्र अपलोड करें और नीचे दिए गए निर्देशित कार्यों से शुरुआत करें।",

    // ── कॉन्ट्रैक्टर · क्लाइंट सैंडबॉक्स (प्रिया) — 5 Crisp Steps ──
    "contractor.s1.title": "क्लाइंट सैंडबॉक्स वातावरण",
    "contractor.s1.body": "स्वागत है {role}। सख्त क्लाइंट दिशानिर्देशों के विरुद्ध कार्य को सत्यापित करने के लिए सुरक्षित, केवल-पढ़ने योग्य सैंडबॉक्स।",
    "contractor.s2.title": "अधिकृत दिशानिर्देश और टोकन",
    "contractor.s2.body": "सटीक संरेखण सुनिश्चित करने के लिए अनुक्रमित क्लाइंट ब्रांड प्लेबुक, स्वीकृत दावों और रंग पैलेट का उपयोग करें।",
    "contractor.s3.title": "प्री-फ़्लाइट एसेट स्कैनर",
    "contractor.s3.body": "सबमिशन से पहले डिलिवरेबल्स की स्वयं जांच करें। क्लाइंट कंट्रास्ट और ट्रेडमार्क नियमों के विरुद्ध बैनर और कॉपी का परीक्षण करें।",
    "contractor.s4.title": "निष्कर्ष और सुधार मार्गदर्शन",
    "contractor.s4.body": "क्लाइंट समीक्षा से पहले समस्याओं को ठीक करने के लिए वर्गीकृत चेतावनियों और अनुशंसित सुधारों का निरीक्षण करें।",
    "contractor.s5.title": "अनुपालन ऑडिट और निर्यात",
    "contractor.s5.body": "डिलिवरेबल अनुपालन स्कोर सत्यापित करें और SHA-256 ऑडिट लॉग द्वारा समर्थित सत्यापन योग्य अनुपालन प्रमाण तैयार करें।",
    "contractor.done.body": "आपका क्लाइंट सैंडबॉक्स तैयार है। अपने काम की पहले से जाँच करें, त्रुटियाँ सुधारें और पूर्ण आत्मविश्वास के साथ प्रस्तुत करें।",
  },
} as const;

registerDict("tour", dict);
