# BrandShield AI — Flutter Mobile Application (Android & iOS)

> **Autonomous Brand Governance & Pre-Publishing Audit**  
> Native cross-platform mobile application powered by Flutter 3.47+, Google Gemini AI, and SHA-256 cryptographic ledgers.

---

## 🌟 Overview

The **BrandShield AI Mobile Application** brings the enterprise-grade brand governance platform directly into the hands of CMOs, Legal Counsel, Creative Directors, and External Agencies on iOS and Android.

It connects directly to the production Next.js backend (`https://brandshield-ai-five.vercel.app`) and shares the exact same Neon PostgreSQL database, users, evaluation personas, guidelines, and audit logs.

### Key Capabilities

1. **Enterprise Dashboard & 7-Stage Workflow**:
   - Real-time Governance Health Index & Avg Compliance score.
   - Live 7-stage database-driven progression: Guideline Ingestion → Deterministic Rules → AI Claim Verification → WCAG Vision Inspection → Explainable Remediation → SHA-256 Sign-off → Immutable Audit Trail.
2. **Multi-Modal Pre-Flight Asset Scanner**:
   - Text copy and visual banner image testing with sub-100ms deterministic pre-checks and Gemini Vision contrast inspection.
   - Camera and photo gallery integration via `image_picker`.
3. **Findings & Remediation Desk**:
   - Verbatim ground-truth policy citations with source document references.
   - 1-click automated AI rewrites preserving creative tone.
   - Override justifications for compliance audit trail.
4. **Approval Board & Decision Ledger**:
   - Authoritative sign-offs with SHA-256 cryptographic signatures.
   - Request revisions workflow.
5. **AI Brand Governance Copilot**:
   - Conversational AI powered by Google Gemini API with RAG citations and live WCAG 2.1 contrast math.
6. **5-Step Role-Based Guided Tour**:
   - Crisp, role-specific onboarding walkthrough with prominent glowing green `#16A34A` Next button.
7. **Bilingual Localization**:
   - Complete English (`en`) and Hindi (`hi`) translation throughout all screens.

---

## 📱 Tech Stack

- **Framework**: Flutter 3.47.6 / Dart 3.13.5
- **Architecture**: Clean Architecture / Feature-First with Provider state management
- **Design System**: Enterprise Light Theme, Inter typography, WCAG 2.1 AA/AAA compliant
- **Networking**: Custom `ApiClient` with Bearer token authentication and timeout handling
- **AI Backend**: Google Gemini API via BrandShield Next.js `/api/copilot/chat`

---

## 📂 Project Structure

```
mobile/
├── lib/
│   ├── app/                    # Constants, app entrypoint, theme
│   ├── core/
│   │   ├── network/            # ApiClient & JSON serialization
│   │   ├── storage/            # SharedPreferences token storage
│   │   ├── theme/              # BrandTheme & typography
│   │   └── utils/              # WCAG ContrastCalculator math
│   ├── features/
│   │   ├── analytics/          # Department breakdown & audit logs
│   │   ├── approvals/          # SHA-256 sign-offs & ledger
│   │   ├── auth/               # Login & 4-role evaluation switcher
│   │   ├── copilot/            # Markdown AI chat & policy citations
│   │   ├── dashboard/          # Health index & 7-stage workflow
│   │   ├── findings/           # Severity filters & 1-click rewrites
│   │   ├── integrations/       # GitLab, Figma, Google Docs status
│   │   ├── knowledge_base/     # Guidelines & brand design tokens
│   │   ├── onboarding/         # 5-step native tour dialog
│   │   ├── scanner/            # Copy composer & banner camera
│   │   └── settings/           # Profile, language & API host switcher
│   ├── localization/           # English & Hindi dictionary
│   ├── models/                 # User, Finding, Submission, Approval
│   └── services/               # AuthService, ScannerService, CopilotService...
├── test/
│   ├── unit/                   # Contrast math & JSON deserialization tests
│   └── widget_test.dart        # Smoke test
├── SETUP.md                    # Installation prerequisites
├── ARCHITECTURE.md             # System architecture & data flow
├── ENVIRONMENT.md              # Backend configuration
├── FIREBASE_SETUP.md           # Firebase iOS/Android bridge
└── BUILD.md                    # APK, AAB & iOS release guides
```
