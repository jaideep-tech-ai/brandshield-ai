# BrandShield AI Mobile — Setup & Installation Guide

This guide walks you through setting up your local environment to run and build the BrandShield AI Flutter Mobile application on macOS Apple Silicon, Android, or iOS.

---

## 📋 Prerequisites

1. **Flutter SDK**: 3.47.6 or newer  
   Verify installation:
   ```bash
   flutter --version
   ```
2. **Dart SDK**: 3.13.5 or newer (bundled with Flutter).
3. **Java Development Kit (JDK 17)**:
   Required for building Android APK and Gradle compilation.
   Install via Homebrew:
   ```bash
   brew install openjdk@17
   sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
   ```
4. **Android SDK**:
   - `platform-tools`
   - `build-tools` (version 34.0.0+)
   - `cmdline-tools`
   Set environment variables in `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```
5. **Xcode (for iOS development)**:
   - macOS with Xcode 15+ installed from Mac App Store.
   - Command Line Tools: `xcode-select --install`
   - CocoaPods: `sudo gem install cocoapods`

---

## 🚀 Quick Start

### 1. Navigate to the mobile directory
```bash
cd mobile
```

### 2. Fetch Flutter packages
```bash
flutter pub get
```

### 3. Verify static analysis and test suite
```bash
flutter analyze
flutter test
```
Expected output:
```
Analyzing mobile...
No issues found!

All tests passed!
```

### 4. Run on a connected device or simulator

**iOS Simulator:**
```bash
open -a Simulator
flutter run
```

**Android Emulator / Device:**
```bash
flutter run
```

**macOS Desktop (for rapid dev testing):**
```bash
flutter run -d macos
```

---

## 🌐 Connecting to the Backend

By default, the app points to the production deployment:
```
https://brandshield-ai-five.vercel.app
```

To point to your local Next.js dev server:
1. Open the app.
2. Go to **Settings** (`Nav Drawer -> Settings`).
3. Under **Backend API Endpoint**, change the URL to:
   - iOS Simulator: `http://localhost:3000`
   - Android Emulator: `http://10.0.2.2:3000`
   - Physical Device on same Wi-Fi: `http://<your-mac-ip>:3000`
4. Tap the green checkmark to save.
