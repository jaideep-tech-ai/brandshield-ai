# BrandShield AI Mobile — Build & Release Guide

This document describes how to build release binaries for Android (APK and App Bundle) and iOS on macOS Apple Silicon.

---

## 🤖 Android Builds

### 1. Build Android APK (Direct Device Installation)
```bash
cd mobile
flutter build apk --release
```
- **Output Path**: `mobile/build/app/outputs/flutter-apk/app-release.apk`
- **Use Case**: Testing on physical Android phones or distribution via internal testing.

### 2. Build Android App Bundle (Google Play Store)
```bash
cd mobile
flutter build appbundle --release
```
- **Output Path**: `mobile/build/app/outputs/bundle/release/app-release.aab`
- **Use Case**: Production upload to Google Play Console.

### Signing Key Configuration (Android)
To sign your release build with a production keystore:
1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore ~/brandshield-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias brandshield
   ```
2. Create `mobile/android/key.properties` (never commit this file):
   ```properties
   storePassword=your_store_password
   keyPassword=your_key_password
   keyAlias=brandshield
   storeFile=/path/to/brandshield-release-key.jks
   ```
3. Reference `key.properties` in `mobile/android/app/build.gradle.kts`.

---

## 🍎 iOS Builds

### 1. Build iOS Release Archive
```bash
cd mobile
flutter build ipa --release
```
- **Output Path**: `mobile/build/ios/archive/Runner.xcarchive`
- **Use Case**: Distribution via TestFlight or App Store.

### 2. Open in Xcode for Code Signing
```bash
open mobile/ios/Runner.xcworkspace
```
1. Select the **Runner** project in the navigator.
2. In the **Signing & Capabilities** tab, select your Apple Developer Team.
3. Select **Product** -> **Archive** to upload to App Store Connect.

---

## 🧪 CI/CD Automation (GitLab / GitHub Actions)

In your GitLab or GitHub Actions pipeline, execute:
```yaml
- name: Analyze & Test
  run: |
    cd mobile
    flutter pub get
    flutter analyze
    flutter test
```
All tests run headlessly and verify WCAG contrast mathematics, data models, and UI widgets before release.

