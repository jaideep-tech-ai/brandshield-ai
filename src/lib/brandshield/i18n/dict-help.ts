"use client";

import { registerDict } from "@/lib/brandshield/i18n";

// ─── Help Center & Contextual Documentation Dictionary ───────────────────────
//
// Bilingual dictionary for 10 comprehensive guides covering all aspects of
// BrandShield AI: platform architecture, role permissions, automated scanner,
// findings remediation, approvals workflow, GitLab CI/CD, extensions,
// guidelines & knowledge base, AI Copilot RAG, and enterprise security / ZDR.

const dict = {
  en: {
    // Shell & trigger copy
    "trigger.btn": "Help",
    "trigger.aria": "Open Help Center & Guides",
    "needHelp.btn": "Need help?",
    "needHelp.scanner": "Scanner Guide",
    "needHelp.findings": "Findings Guide",
    "needHelp.approvals": "Approvals Guide",
    "needHelp.gitlab": "GitLab Guide",
    "needHelp.guidelines": "Guidelines Guide",

    // Header & Modal
    "modal.title": "BrandShield AI Help Center",
    "modal.desc":
      "Comprehensive product guides, workflow tutorials, role breakdowns, and integration walkthroughs.",
    "modal.search": "Search guides and topics...",
    "modal.allCategories": "All Guides",
    "modal.readingTime": "{m} min read",
    "modal.takeTourCta": "Launch Interactive Tour",
    "modal.close": "Close Help Center",
    "modal.noResults": "No guides matched your search query.",
    "modal.noResultsHint": "Try searching for scanner, gitlab, roles, findings, or approvals.",
    "modal.jumpTo": "Open in App",

    // Categories
    "cat.platform": "Platform",
    "cat.governance": "Governance",
    "cat.tools": "Tools",
    "cat.review": "Review",
    "cat.workflow": "Workflow",
    "cat.integrations": "Integrations",
    "cat.knowledge": "Knowledge",
    "cat.ai": "AI Assistant",
    "cat.security": "Security",

    // Guide 1: Overview
    "guide.overview.title": "Getting Started & Platform Overview",
    "guide.overview.summary":
      "Learn what BrandShield AI is, how multi-tenant prepublish governance works, and how it protects your brand reputation across all channels.",
    "guide.overview.section1Title": "What is BrandShield AI?",
    "guide.overview.section1Body":
      "BrandShield AI is an enterprise pre-publish governance platform. It autonomously inspects marketing copy, design assets, and code repositories against your organization's verified brand guidelines, typography standards, logo rules, and WCAG 2.1 accessibility criteria before content goes live.",
    "guide.overview.section2Title": "Core Architecture",
    "guide.overview.section2Body":
      "Every piece of content submitted passes through a multi-stage validation pipeline: Stage 1 extracts visual color palettes, font families, and textual tokens; Stage 2 cross-references against indexed brand playbooks using vector RAG; Stage 3 assigns deterministic severity ratings (Critical, Warning, Advisory) and generates actionable AI remediations.",
    "guide.overview.section3Title": "Key Benefits",
    "guide.overview.section3Body":
      "Zero brand drift across global teams, 85% faster review cycles with automated pre-flight checks, and immutable compliance audit trails for legal and regulatory peace of mind.",

    // Guide 2: Roles & Permissions
    "guide.roles.title": "Role Perspectives & Permissions Matrix",
    "guide.roles.summary":
      "Explore the 4 built-in role perspectives — Brand Director, Compliance Officer, Content Creator, and Auditor — and their respective authorization tiers.",
    "guide.roles.section1Title": "Brand Director (Admin)",
    "guide.roles.section1Body":
      "Full administrative control over organization settings, team seats, role assignments, guidelines upload, third-party integrations (GitLab, Google Docs, Figma), and overriding critical compliance decisions.",
    "guide.roles.section2Title": "Compliance Officer (Reviewer)",
    "guide.roles.section2Body":
      "Dedicated review desk to triage findings, review visual and copy evidence, approve or reject submissions, request modifications from creators, and enforce brand consistency.",
    "guide.roles.section3Title": "Content Creator (Creator)",
    "guide.roles.section3Body":
      "Content creation studio for drafting campaigns, uploading banners and assets, running instant pre-flight scans, applying one-click AI rewrites, and submitting finalized work for formal sign-off.",
    "guide.roles.section4Title": "Auditor & Contractor (Contractor/Viewer)",
    "guide.roles.section4Body":
      "Read-only sandbox access to inspect brand health scores, verify guideline citations, review past audit logs, and conduct external compliance audits without modification rights.",

    // Guide 3: Scanner
    "guide.scanner.title": "Pre-Publish Scanner & Automated Engine",
    "guide.scanner.summary":
      "Step-by-step instructions on running automated scans on promotional copy, display banners, and multi-asset campaigns.",
    "guide.scanner.section1Title": "Scanning Marketing Copy",
    "guide.scanner.section1Body":
      "Paste your draft headline, email body, or ad copy into the text scanner. The engine immediately checks for forbidden claims, unapproved superlatives, brand voice tone, and required legal disclaimers.",
    "guide.scanner.section2Title": "Analyzing Banners & Visual Assets",
    "guide.scanner.section2Body":
      "Upload PNG, JPEG, WEBP, or SVG files or snap a photo directly from your mobile camera. The scanner automatically extracts the dominant color palette, checks WCAG 2.1 contrast ratios against background colors, and flags unauthorized color drift.",
    "guide.scanner.section3Title": "Composite Compliance Score",
    "guide.scanner.section3Body":
      "Every scan generates a composite score from 0 to 100 based on color contrast, typography conformity, tone compliance, and legal clearance. Submissions scoring below 75 automatically require compliance officer approval.",

    // Guide 4: Findings
    "guide.findings.title": "Findings Triage, Severity & Remediation",
    "guide.findings.summary":
      "Understand severity tiers, inspect verbatim guideline citations, apply AI-powered rewrites, and track remediation history.",
    "guide.findings.section1Title": "Understanding Severity Tiers",
    "guide.findings.section1Body":
      "Critical findings (red) block publication until resolved or formally overridden. Warning findings (amber) highlight brand drift that requires review. Advisory findings (blue) offer best-practice recommendations for optimal engagement.",
    "guide.findings.section2Title": "One-Click AI Rewrites",
    "guide.findings.section2Body":
      "For every flagged copy violation, BrandShield AI generates compliant rewrite alternatives aligned with your brand guidelines. Simply click 'Apply Rewrite' to update your draft in real-time.",
    "guide.findings.section3Title": "Dismissing with Justification",
    "guide.findings.section3Body":
      "Authorized reviewers can dismiss findings when an exception applies. Every dismissal requires a mandatory written rationale that is permanently recorded in the immutable audit log.",

    // Guide 5: Approvals
    "guide.approvals.title": "Human-in-the-Loop Approvals & Queues",
    "guide.approvals.summary":
      "Master the approval desk workflow: review pending submissions, examine side-by-side diffs, batch approve, and track turnaround SLAs.",
    "guide.approvals.section1Title": "The Review Queue",
    "guide.approvals.section1Body":
      "Submissions requiring manual review appear in the Approvals queue ordered by priority and submission timestamp. Reviewers can filter by severity, campaign tag, or submitting creator.",
    "guide.approvals.section2Title": "Side-by-Side Diff Inspection",
    "guide.approvals.section2Body":
      "Reviewers inspect original drafts alongside proposed remediations, view highlighted brand violations, and verify extracted color palettes and typography rules before making an approval decision.",
    "guide.approvals.section3Title": "Decision Audit Trail",
    "guide.approvals.section3Body":
      "When approving or rejecting, reviewers add contextual comments. Approval stamps contain cryptographic signatures linking the decision to the specific user and timestamp.",

    // Guide 6: GitLab
    "guide.gitlab.title": "GitLab CI/CD Self-Service Integration",
    "guide.gitlab.summary":
      "Connect your GitLab project via OAuth, auto-provision secure webhooks, and automate prepublish pipeline blocking on push and merge request events.",
    "guide.gitlab.section1Title": "One-Click OAuth Connection",
    "guide.gitlab.section1Body":
      "Navigate to Integrations → Webhooks and click 'Connect GitLab'. Authorize BrandShield AI with your GitLab account. Our backend validates OAuth state with atomic single-use nonce consumption and encrypts all tokens at rest using AES-256-GCM.",
    "guide.gitlab.section2Title": "Selecting Your Project",
    "guide.gitlab.section2Body":
      "Select your repository from the accessible projects list. BrandShield AI automatically creates the webhook on GitLab with push and merge request subscriptions and sets up an organization-specific webhook secret.",
    "guide.gitlab.section3Title": "Prepublish Pipeline Enforcement",
    "guide.gitlab.section3Body":
      "Every git push or merge request triggers an automated webhook audit. If critical brand violations are found, BrandShield AI reports the audit findings back to GitLab and can block the merge request until resolved.",

    // Guide 7: Extensions
    "guide.extensions.title": "Google Docs & Figma Extension Connectors",
    "guide.extensions.summary":
      "Equip your creative and marketing teams with in-flight pre-flight checking directly within Google Docs and Figma.",
    "guide.extensions.section1Title": "Google Docs Add-on",
    "guide.extensions.section1Body":
      "The BrandShield AI Google Docs add-on scans documents as copywriters write. It flags tone violations, trademark mistakes, and unapproved product claims right inside the Google Docs sidebar.",
    "guide.extensions.section2Title": "Figma Plugin",
    "guide.extensions.section2Body":
      "The Figma plugin inspects design frames, canvas typography, layer color values, and vector logo assets against your design tokens stored in the BrandShield Knowledge Base.",
    "guide.extensions.section3Title": "Zero Context Switching",
    "guide.extensions.section3Body":
      "Designers and writers fix brand violations within their existing tools before exporting or submitting for review, eliminating redundant review cycles.",

    // Guide 8: Guidelines
    "guide.guidelines.title": "Brand Guidelines & Knowledge Base",
    "guide.guidelines.summary":
      "Manage organization playbooks, design tokens, voice guidelines, and verify vector embeddings for semantic RAG retrieval.",
    "guide.guidelines.section1Title": "Uploading Brand Playbooks",
    "guide.guidelines.section1Body":
      "Upload brand guide PDFs, markdown files, or structured JSON design tokens. BrandShield AI automatically parses rules into semantic chunks and creates vector embeddings.",
    "guide.guidelines.section2Title": "Defining Design Tokens",
    "guide.guidelines.section2Body":
      "Specify primary, secondary, and accent hex codes, permitted typography families, minimum font sizes, and logo exclusion zones. The scanner checks these exact tokens during visual audits.",
    "guide.guidelines.section3Title": "Forbidden Claims & Legal Guardrails",
    "guide.guidelines.section3Body":
      "Configure restricted keywords, competitor mentions, false guarantees, and required trademark symbols (®, ™) to prevent compliance and regulatory liabilities.",

    // Guide 9: Copilot
    "guide.copilot.title": "AI Brand Governance Copilot & Real RAG",
    "guide.copilot.summary":
      "How to use the conversational brand assistant for policy questions, marketing rewrites, and multi-turn policy exploration with verbatim citations.",
    "guide.copilot.section1Title": "Interactive Policy Exploration",
    "guide.copilot.section1Body":
      "Ask questions like 'Can we use our primary teal logo on a dark background?' or 'What are our approved warranty claims?' The Copilot answers with exact citations pointing to document name, rule tag, and page number.",
    "guide.copilot.section2Title": "Multi-Provider AI Engine",
    "guide.copilot.section2Body":
      "BrandShield AI integrates with OpenAI, Google Gemini, Groq, and ZAI. It automatically uses whichever API key your organization provides, and falls back to our internal semantic RAG engine if external keys are unconfigured.",
    "guide.copilot.section3Title": "Session Management & History",
    "guide.copilot.section3Body":
      "All conversation sessions are persisted to the database. You can start new sessions, rename topics, view conversation history across devices, and export transcripts.",

    // Guide 10: Security
    "guide.security.title": "Enterprise Security, ZDR & Audit Logs",
    "guide.security.summary":
      "Review our Zero Data Retention (ZDR) guarantee, tamper-evident audit logs, multi-tenant isolation, and SOC2 compliance controls.",
    "guide.security.section1Title": "Zero Data Retention (ZDR) Guarantee",
    "guide.security.section1Body":
      "Customer draft copy and uploaded images are processed in volatile memory only for scan evaluation. Content is never stored long-term without explicit retention policies and is NEVER used to train public AI foundation models.",
    "guide.security.section2Title": "Cryptographic Audit Logs",
    "guide.security.section2Body":
      "Every scan, approval, rejection, and finding dismissal creates an immutable audit record containing actor ID, timestamp, SHA-256 payload digest, and client metadata.",
    "guide.security.section3Title": "Tenant Isolation & RBAC",
    "guide.security.section3Body":
      "Strict organization-level tenant isolation is enforced at the database layer with foreign keys and session context guards. No cross-tenant data leakage is architecturally possible.",
  },

  hi: {
    // Shell & trigger copy
    "trigger.btn": "सहायता",
    "trigger.aria": "सहायता केंद्र और मार्गदर्शिकाएं खोलें",
    "needHelp.btn": "मदद चाहिए?",
    "needHelp.scanner": "स्कैनर गाइड",
    "needHelp.findings": "निष्कर्ष गाइड",
    "needHelp.approvals": "अनुमोदन गाइड",
    "needHelp.gitlab": "गिटलैब गाइड",
    "needHelp.guidelines": "दिशानिर्देश गाइड",

    // Header & Modal
    "modal.title": "ब्रांडशील्ड एआई सहायता केंद्र",
    "modal.desc":
      "विस्तृत उत्पाद मार्गदर्शिकाएं, वर्कफ़्लो ट्यूटोरियल, भूमिका विवरण और एकीकरण वॉकथ्रू।",
    "modal.search": "मार्गदर्शिकाएं और विषय खोजें...",
    "modal.allCategories": "सभी मार्गदर्शिकाएं",
    "modal.readingTime": "{m} मिनट पढ़ें",
    "modal.takeTourCta": "इंटरैक्टिव टूर शुरू करें",
    "modal.close": "सहायता केंद्र बंद करें",
    "modal.noResults": "आपकी खोज के अनुसार कोई गाइड नहीं मिला।",
    "modal.noResultsHint": "स्कैनर, गिटलैब, भूमिकाएं, निष्कर्ष, या अनुमोदन खोजें।",
    "modal.jumpTo": "ऐप में खोलें",

    // Categories
    "cat.platform": "प्लेटफ़ॉर्म",
    "cat.governance": "गवर्नेंस",
    "cat.tools": "उपकरण",
    "cat.review": "समीक्षा",
    "cat.workflow": "वर्कफ़्लो",
    "cat.integrations": "एकीकरण",
    "cat.knowledge": "ज्ञानकोष",
    "cat.ai": "एआई सहायक",
    "cat.security": "सुरक्षा",

    // Guide 1: Overview
    "guide.overview.title": "शुरुआत करें और प्लेटफ़ॉर्म अवलोकन",
    "guide.overview.summary":
      "जानें कि ब्रांडशील्ड एआई क्या है, मल्टी-टेनेंट प्री-पब्लिश गवर्नेंस कैसे काम करता है, और यह आपके ब्रांड की प्रतिष्ठा की रक्षा कैसे करता है।",
    "guide.overview.section1Title": "ब्रांडशील्ड एआई क्या है?",
    "guide.overview.section1Body":
      "ब्रांडशील्ड एआई एक एंटरप्राइज प्री-पब्लिश गवर्नेंस प्लेटफ़ॉर्म है। यह विपणन कॉपी, डिज़ाइन संपत्तियों और कोड रिपॉजिटरी की सामग्री लाइव होने से पहले सत्यापित ब्रांड दिशानिर्देशों, टाइपोग्राफी और WCAG 2.1 पहुंच मानकों के अनुसार स्वचालित जांच करता है।",
    "guide.overview.section2Title": "मुख्य वास्तुकला",
    "guide.overview.section2Body":
      "प्रत्येक सबमिशन मल्टी-स्टेज सत्यापन पाइपलाइन से गुजरता है: स्टेज 1 रंग पट्टियाँ और टेक्स्ट निकालता है; स्टेज 2 वेक्टर आरएजी के माध्यम से ब्रांड नियमों की जांच करता है; स्टेज 3 गंभीरता रेटिंग (क्रिटिकल, चेतावनी, परामर्श) देता है और एआई समाधान बनाता है।",
    "guide.overview.section3Title": "मुख्य लाभ",
    "guide.overview.section3Body":
      "वैश्विक टीमों में शून्य ब्रांड विचलन, स्वचालित प्री-फ़्लाइट जांच के साथ 85% तेज़ समीक्षा चक्र, और कानूनी अनुपालन के लिए अपरिवर्तनीय ऑडिट ट्रेल्स।",

    // Guide 2: Roles & Permissions
    "guide.roles.title": "भूमिका दृष्टिकोण और अनुमति मैट्रिक्स",
    "guide.roles.summary":
      "4 अंतर्निहित भूमिकाओं — ब्रांड डायरेक्टर, अनुपालन अधिकारी, सामग्री निर्माता और ऑडिटर — और उनके अनुमति स्तरों को समझें।",
    "guide.roles.section1Title": "ब्रांड डायरेक्टर (व्यवस्थापक)",
    "guide.roles.section1Body":
      "संगठन सेटिंग्स, टीम सीट्स, भूमिका आवंटन, दिशानिर्देश अपलोड, तृतीय-पक्ष एकीकरण (गिटलैब, गूगल डॉक्स, फिग्मा) और महत्वपूर्ण निर्णयों को ओवरराइड करने का पूर्ण नियंत्रण।",
    "guide.roles.section2Title": "अनुपालन अधिकारी (समीक्षक)",
    "guide.roles.section2Body":
      "निष्कर्षों की समीक्षा करने, साक्ष्य देखने, सबमिशन स्वीकृत या अस्वीकृत करने, सुधार का अनुरोध करने और ब्रांड स्थिरता लागू करने का विशेष समीक्षा डेस्क।",
    "guide.roles.section3Title": "सामग्री निर्माता (निर्माता)",
    "guide.roles.section3Body":
      "अभियान तैयार करने, बैनर अपलोड करने, तत्काल प्री-फ़्लाइट स्कैन चलाने, वन-क्लिक एआई रीराइट लागू करने और अंतिम अनुमोदन के लिए प्रस्तुत करने का स्टूडियो।",
    "guide.roles.section4Title": "ऑडिटर और ठेकेदार (ऑडिटर/दर्शक)",
    "guide.roles.section4Body":
      "ब्रांड स्कोर देखने, दिशानिर्देश उद्धरणों की पुष्टि करने, पिछले ऑडिट लॉग की समीक्षा करने और बिना संपादन अधिकारों के बाहरी ऑडिट करने का सैंडबॉक्स।",

    // Guide 3: Scanner
    "guide.scanner.title": "प्री-पब्लिश स्कैनर और स्वचालित इंजन",
    "guide.scanner.summary":
      "प्रचारात्मक कॉपी, डिस्प्ले बैनर और मल्टी-एसेट अभियानों पर स्वचालित स्कैन चलाने के चरण-दर-चरण निर्देश।",
    "guide.scanner.section1Title": "मार्केटिंग कॉपी को स्कैन करना",
    "guide.scanner.section1Body":
      "अपनी ड्राफ्ट हेडलाइन, ईमेल बॉडी या विज्ञापन कॉपी को टेक्स्ट स्कैनर में पेस्ट करें। इंजन तुरंत निषिद्ध दावों, अस्वीकृत शब्दों, ब्रांड टोन और आवश्यक कानूनी घोषणाओं की जांच करता है।",
    "guide.scanner.section2Title": "बैनर और दृश्य संपत्तियों का विश्लेषण",
    "guide.scanner.section2Body":
      "PNG, JPEG, WEBP या SVG फ़ाइलें अपलोड करें या सीधे अपने मोबाइल कैमरे से फ़ोटो लें। स्कैनर प्रमुख रंगों को निकालता है और WCAG 2.1 कंट्रास्ट की जांच करता है।",
    "guide.scanner.section3Title": "समग्र अनुपालन स्कोर",
    "guide.scanner.section3Body":
      "प्रत्येक स्कैन 0 से 100 तक का समग्र स्कोर तैयार करता है। 75 से कम स्कोर वाले सबमिशन को स्वचालित रूप से अनुपालन अधिकारी के अनुमोदन की आवश्यकता होती है।",

    // Guide 4: Findings
    "guide.findings.title": "निष्कर्ष ट्राइएज, गंभीरता और एआई उपचार",
    "guide.findings.summary":
      "गंभीरता स्तरों को समझें, दिशानिर्देश उद्धरणों का निरीक्षण करें, एआई रीराइट लागू करें और इतिहास ट्रैक करें।",
    "guide.findings.section1Title": "गंभीरता स्तरों को समझना",
    "guide.findings.section1Body":
      "क्रिटिकल निष्कर्ष (लाल) हल होने तक प्रकाशन को रोकते हैं। चेतावनी निष्कर्ष (पीला) समीक्षा की मांग करते हैं। परामर्श निष्कर्ष (नीला) सर्वोत्तम प्रथाओं की सिफारिश करते हैं।",
    "guide.findings.section2Title": "वन-क्लिक एआई रीराइट्स",
    "guide.findings.section2Body":
      "प्रत्येक उल्लंघन के लिए, ब्रांडशील्ड एआई दिशानिर्देशों के अनुरूप अनुपालन विकल्प उत्पन्न करता है। अपने ड्राफ्ट को तुरंत अपडेट करने के लिए 'Apply Rewrite' पर क्लिक करें।",
    "guide.findings.section3Title": "औचित्य के साथ खारिज करना",
    "guide.findings.section3Body":
      "समीक्षक अपवाद होने पर निष्कर्षों को खारिज कर सकते हैं। प्रत्येक खारिजी के लिए अनिवार्य लिखित औचित्य की आवश्यकता होती है जिसे ऑडिट लॉग में दर्ज किया जाता है।",

    // Guide 5: Approvals
    "guide.approvals.title": "ह्यूमन-इन-द-लूप अनुमोदन और समीक्षा कतारें",
    "guide.approvals.summary":
      "अनुमोदन डेस्क वर्कफ़्लो: लंबित सबमिशन की समीक्षा करें, तुलनात्मक अंतर देखें, बैच अनुमोदन करें और SLA ट्रैक करें।",
    "guide.approvals.section1Title": "समीक्षा कतार",
    "guide.approvals.section1Body":
      "मैनुअल समीक्षा की आवश्यकता वाले सबमिशन प्राथमिकता और समय के अनुसार कतार में दिखाई देते हैं। समीक्षक गंभीरता या निर्माता के अनुसार फ़िल्टर कर सकते हैं।",
    "guide.approvals.section2Title": "तुलनात्मक अंतर निरीक्षण",
    "guide.approvals.section2Body":
      "समीक्षक मूल ड्राफ्ट और प्रस्तावित सुधारों की तुलना करते हैं, उल्लंघन देखते हैं और अनुमोदन से पहले रंग व फ़ॉन्ट की जांच करते हैं।",
    "guide.approvals.section3Title": "निर्णय ऑडिट ट्रेल",
    "guide.approvals.section3Body":
      "स्वीकृति या अस्वीकृति के समय, समीक्षक प्रासंगिक टिप्पणियां जोड़ते हैं। अनुमोदन टिकटों में क्रिप्टोग्राफ़िक हस्ताक्षर होते हैं।",

    // Guide 6: GitLab
    "guide.gitlab.title": "गिटलैब सीआई/सीडी सेल्फ-सर्विस एकीकरण",
    "guide.gitlab.summary":
      "OAuth के माध्यम से गिटलैब कनेक्ट करें, सुरक्षित वेबहुक प्रोविज़न करें और पुश व मर्ज रिक्वेस्ट पर प्रीपब्लिश पाइपलाइन ब्लॉक करें।",
    "guide.gitlab.section1Title": "वन-क्लिक OAuth कनेक्शन",
    "guide.gitlab.section1Body":
      "Integrations → Webhooks पर जाएं और 'Connect GitLab' पर क्लिक करें। हमारे बैकएंड में सुरक्षित एकल-उपयोग नॉनस और AES-256-GCM एन्क्रिप्शन के साथ टोकन सुरक्षित रहते हैं।",
    "guide.gitlab.section2Title": "अपनी परियोजना का चयन",
    "guide.gitlab.section2Body":
      "सुलभ परियोजनाओं की सूची से अपनी रिपॉजिटरी चुनें। ब्रांडशील्ड एआई स्वचालित रूप से पुश और एमआर इवेंट्स के लिए वेबहुक बनाता है।",
    "guide.gitlab.section3Title": "प्रीपब्लिश पाइपलाइन प्रवर्तन",
    "guide.gitlab.section3Body":
      "प्रत्येक गिट पुश या मर्ज अनुरोध एक स्वचालित ऑडिट ट्रिगर करता है। यदि महत्वपूर्ण उल्लंघन पाए जाते हैं, तो समाधान होने तक मर्ज अनुरोध को अवरुद्ध किया जा सकता है।",

    // Guide 7: Extensions
    "guide.extensions.title": "गूगल डॉक्स और फिग्मा एक्सटेंशन",
    "guide.extensions.summary":
      "अपनी रचनात्मक टीमों को गूगल डॉक्स और फिग्मा के अंदर सीधे इन-फ़्लाइट प्री-फ़्लाइट जांच से लैस करें।",
    "guide.extensions.section1Title": "गूगल डॉक्स ऐड-ऑन",
    "guide.extensions.section1Body":
      "ब्रांडशील्ड एआई गूगल डॉक्स ऐड-ऑन सीधे साइडबार में टोन के उल्लंघन, ट्रेडमार्क त्रुटियों और अनिधिकृत दावों को चिह्नित करता है।",
    "guide.extensions.section2Title": "फिग्मा प्लगइन",
    "guide.extensions.section2Body":
      "फिग्मा प्लगइन ज्ञानकोष में संग्रहीत डिज़ाइन टोकन के आधार पर कैनवास टाइपोग्राफी, परतों के रंगों और लोगो संपत्तियों का निरीक्षण करता है।",
    "guide.extensions.section3Title": "शून्य संदर्भ स्विचिंग",
    "guide.extensions.section3Body":
      "डिज़ाइनर और लेखक समीक्षा के लिए सबमिट करने से पहले अपने पसंदीदा टूल के अंदर ही उल्लंघनों को ठीक कर लेते हैं।",

    // Guide 8: Guidelines
    "guide.guidelines.title": "ब्रांड दिशानिर्देश, टोकन और ज्ञानकोष",
    "guide.guidelines.summary":
      "संगठन प्लेबुक, डिज़ाइन टोकन और आवाज़ के दिशानिर्देश प्रबंधित करें और सिमेंटिक आरएजी के लिए वेक्टर एम्बेडिंग सत्यापित करें।",
    "guide.guidelines.section1Title": "ब्रांड प्लेबुक अपलोड करना",
    "guide.guidelines.section1Body":
      "ब्रांड गाइड पीडीएफ, मार्कडाउन या JSON डिज़ाइन टोकन अपलोड करें। ब्रांडशील्ड एआई स्वचालित रूप से नियमों को पार्स करता है और वेक्टर एम्बेडिंग बनाता है।",
    "guide.guidelines.section2Title": "डिज़ाइन टोकन परिभाषित करना",
    "guide.guidelines.section2Body":
      "प्राथमिक, द्वितीयक और एक्सेंट हेक्स कोड, अनुमत फ़ॉन्ट और लोगो नियम निर्दिष्ट करें। दृश्य ऑडिट के दौरान स्कैनर इनकी जांच करता है।",
    "guide.guidelines.section3Title": "निषिद्ध दावे और कानूनी सीमाएं",
    "guide.guidelines.section3Body":
      "कानूनी जोखिमों से बचने के लिए प्रतिबंधित कीवर्ड, प्रतियोगी नाम, झूठे वादे और आवश्यक ट्रेडमार्क प्रतीकों (®, ™) को कॉन्फ़िगर करें।",

    // Guide 9: Copilot
    "guide.copilot.title": "एआई ब्रांड गवर्नेंस कोपायलट और वास्तविक आरएजी",
    "guide.copilot.summary":
      "नीतिगत प्रश्नों, मार्केटिंग पुनर्लेखन और उद्धरणों के साथ नीति अन्वेषण के लिए संवादी ब्रांड सहायक का उपयोग करें।",
    "guide.copilot.section1Title": "इंटरैक्टिव नीति अन्वेषण",
    "guide.copilot.section1Body":
      "प्रश्न पूछें जैसे 'क्या हम डार्क बैकग्राउंड पर अपने टील लोगो का उपयोग कर सकते हैं?' कोपायलट दस्तावेज़ नाम, नियम टैग और पृष्ठ संख्या के साथ उत्तर देता है।",
    "guide.copilot.section2Title": "मल्टी-प्रोवाइडर एआई इंजन",
    "guide.copilot.section2Body":
      "ओपनएआई, गूगल जेमिनी, ग्रॉक और ज़ेडएआई के साथ एकीकृत होता है। यदि बाहरी कुंजियाँ अनुपलब्ध हैं तो यह स्वचालित रूप से हमारे आंतरिक सिमेंटिक आरएजी इंजन पर स्विच होता है।",
    "guide.copilot.section3Title": "सत्र प्रबंधन और इतिहास",
    "guide.copilot.section3Body":
      "सभी वार्तालाप डेटाबेस में सहेजे जाते हैं। आप नए सत्र शुरू कर सकते हैं, नाम बदल सकते हैं और विभिन्न उपकरणों पर इतिहास देख सकते हैं।",

    // Guide 10: Security
    "guide.security.title": "एंटरप्राइज सुरक्षा, जेडडीआर और ऑडिट लॉग",
    "guide.security.summary":
      "हमारी ज़ीरो डेटा रिटेंशन (ZDR) गारंटी, छेड़छाड़-रहित ऑडिट लॉग, मल्टी-टेनेंट अलगाव और सुरक्षा नियंत्रणों की समीक्षा करें।",
    "guide.security.section1Title": "ज़ीरो डेटा रिटेंशन (ZDR) गारंटी",
    "guide.security.section1Body":
      "ग्राहक कॉपी और छवियां केवल स्कैन मूल्यांकन के लिए अस्थायी मेमोरी में संसाधित की जाती हैं। सामग्री का उपयोग कभी भी सार्वजनिक एआई मॉडल को प्रशिक्षित करने के लिए नहीं किया जाता है।",
    "guide.security.section2Title": "क्रिप्टोग्राफ़िक ऑडिट लॉग",
    "guide.security.section2Body":
      "प्रत्येक स्कैन, अनुमोदन और निर्णय एक अपरिवर्तनीय ऑडिट रिकॉर्ड बनाता है जिसमें उपयोगकर्ता आईडी, टाइमस्टैम्प, SHA-256 डाइजेस्ट शामिल होता है।",
    "guide.security.section3Title": "टेनेंट अलगाव और आरबीएसी",
    "guide.security.section3Body":
      "डेटाबेस स्तर पर सख्त संगठन-स्तरीय टेनेंट अलगाव लागू किया जाता है। विभिन्न संगठनों के बीच डेटा का रिसाव संरचनात्मक रूप से असंभव है।",
  },
};

registerDict("help", dict);
