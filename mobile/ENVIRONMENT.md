# BrandShield AI Mobile — Environment Configuration

This document specifies the network endpoints, environment settings, and API keys used by the BrandShield AI Mobile application.

---

## 🌍 Production Environment

- **Production API URL**: `https://brandshield-ai-five.vercel.app`
- **Organization Slug**: `nimbus-labs`
- **Hosting Platform**: Vercel Serverless (Node.js 20 App Router)
- **Database**: Neon Serverless PostgreSQL with Prisma ORM
- **AI Model**: Google Gemini API (`gemini-flash-latest`) via server-side `/api/copilot/chat`

---

## 🔑 Security & Key Storage

> [!IMPORTANT]
> **Zero Client Secrets Rule**: The Flutter mobile application never bundles raw API keys (such as `GEMINI_API_KEY`, database credentials, or OAuth secrets). All AI calls, database queries, and GitLab webhooks are brokered through authenticated Next.js backend routes.

### Backend Environment Variables (Next.js)

These variables are defined in the backend `.env.production.local` and deployed to Vercel:

| Variable | Description | Security Scope |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL connection string | Server Only |
| `GEMINI_API_KEY` | Google AI Studio Gemini API key | Server Only |
| `GEMINI_MODEL` | `gemini-flash-latest` | Server Only |
| `GITLAB_CLIENT_ID` | GitLab OAuth 2.0 Client Application ID | Server Only |
| `GITLAB_CLIENT_SECRET` | GitLab OAuth 2.0 Secret Key | Server Only |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client Web/Mobile Key | Public Client |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project Identifier | Public Client |

---

## 🛠️ Switching Environments in Flutter

You can configure the active API backend dynamically at runtime without rebuilding the APK:

1. Launch BrandShield AI on your Android/iOS device.
2. Open the Navigation Drawer and select **Settings**.
3. Under **Backend API Endpoint**, enter your desired URL:
   - Production: `https://brandshield-ai-five.vercel.app`
   - Local Dev (macOS / iOS Simulator): `http://localhost:3000`
   - Local Dev (Android Emulator): `http://10.0.2.2:3000`
   - LAN Wi-Fi: `http://192.168.1.X:3000`
4. Tap the green checkmark button to save. The URL is persisted to `SharedPreferences` and used for all subsequent requests.

