# Deployment

Production build options for iOS, Android, and Web. (Beta -- copied from old documentation, needs to be further developed)

---

## Environment Variables

Create a `.env` file for sensitive config:

```bash
GOOGLE_WEB_CLIENT_ID=your-web-client-id
GOOGLE_IOS_CLIENT_ID=your-ios-client-id
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
API_BASE_URL=https://your-api.com
```

---

## Option 1 — EAS Build (Recommended)

Expo's cloud build service. No local Android Studio or Xcode required.

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## Option 2 — Local Android Build

### Prerequisites

```bash
# Install Android Studio
sudo snap install android-studio --classic  # Ubuntu/Debian

# Set environment variables (add to ~/.bashrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Reload shell
source ~/.bashrc
```

### Generate Native Project

```bash
npx expo prebuild --platform android
```

### Build APK

```bash
# Debug build
cd android
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# APK location
ls -lh app/build/outputs/apk/
```

APK output: `android/app/build/outputs/apk/`

### Sign a Release APK

1. Generate a keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore Next-Step.keystore \
  -alias Next-Step \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

1. Configure signing in `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../Next-Step.keystore')
            storePassword 'your-password'
            keyAlias 'Next-Step'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

1. Build:

```bash
cd android
./gradlew assembleRelease
```

---

## Option 3 — Development Build

Runs directly on a connected device with dev tools enabled:

```bash
npx expo run:android
npx expo run:ios        # macOS only
npx expo export --platform web # web
```

---

## Pre-Deploy Checklist

- `API_BASE_URL` points to production backend
- `DEBUG` flags disabled
- Google OAuth redirect URIs updated for production domain
- Version code incremented in `app.json`
