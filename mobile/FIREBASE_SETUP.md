# BrandShield AI Mobile — Firebase Integration & RS256 Auth Bridge

This guide details the Firebase configuration for Android and iOS in BrandShield AI, explaining how client Firebase ID tokens are securely verified and synced with our Neon PostgreSQL database.

---

## 🔥 Firebase Architecture

```
[Flutter App]
       │  (1) Sign in with Firebase Auth (Email/Password or Google)
       ▼
[Firebase Auth Service]
       │  (2) Returns Firebase ID Token (JWT signed with Google RS256 key)
       ▼
[Flutter App]
       │  (3) POST /api/auth/firebase-sync
       │      Headers: Authorization: Bearer <firebase_id_token>
       ▼
[BrandShield Next.js Server]
       │  (4) Verifies RS256 JWT signature using Google Public JWKS
       │  (5) Finds or creates user record in Neon PostgreSQL
       │  (6) Issues BrandShield session token
       ▼
[Flutter App]
       │  (7) Stores BrandShield session token in SharedPreferences
       ▼
[Subsequent API Requests: /api/submissions, /api/copilot/chat, etc.]
```

---

## 📱 Android Setup (`google-services.json`)

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your BrandShield project.
3. Click **Add App** -> **Android**.
4. Enter the package name: `com.example.brandshield_mobile` (or your company package name).
5. Download `google-services.json`.
6. Move `google-services.json` into:
   ```
   mobile/android/app/google-services.json
   ```
7. Verify that `mobile/android/build.gradle.kts` has the Google services classpath:
   ```kotlin
   dependencies {
       classpath("com.google.gms:google-services:4.4.1")
   }
   ```

---

## 🍎 iOS Setup (`GoogleService-Info.plist`)

1. In Firebase Console, select **Add App** -> **iOS**.
2. Enter the iOS bundle ID: `com.example.brandshieldMobile`.
3. Download `GoogleService-Info.plist`.
4. Open Xcode (`open mobile/ios/Runner.xcworkspace`).
5. Drag and drop `GoogleService-Info.plist` into the `Runner` group in Xcode.
6. Ensure **Copy items if needed** is checked.

---

## 🛡️ RS256 Public Key Verification (Backend)

The Next.js backend verifies Firebase ID tokens at `src/app/api/auth/firebase-sync/route.ts` using the Google Identity public certificate keyset (`https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`).

No server private key or service account JSON needs to be exposed on client devices.
