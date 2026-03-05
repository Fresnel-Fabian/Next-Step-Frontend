# Contributing

Local development setup and workflow. For production builds and deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Development Setup

### 1. Prerequisites

| Requirement | Version        | Check                |
| ----------- | -------------- | -------------------- |
| Node.js     | 18.x or higher | `node --version`     |
| npm         | 9.x or higher  | `npm --version`      |
| Expo CLI    | Latest         | `npx expo --version` |

### 2. Install Dependencies

```bash
npm install
```

### 2. Configure Google OAuth (optional for basic testing)

```typescript
// config/google-auth.ts
export const GoogleAuthConfig = {
  webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
  androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
  scopes: ["profile", "email"],
};
```

> You can skip this step for basic testing. Email/password login works with mock data without any OAuth config.

For full Google OAuth setup see the [Google OAuth](#google-oauth-setup) section below.

### 3. Start the Development Server

```bash
npx expo start
```

### 4. Run the App

| Platform         | Action       | Requirement        |
| ---------------- | ------------ | ------------------ |
| Web              | Press `w`    | None               |
| Android emulator | Press `a`    | Android Studio     |
| iOS simulator    | Press `i`    | Xcode (macOS only) |
| Physical device  | Scan QR code | Expo Go app        |

---

## Running on a Physical Device

1. Install Expo Go — [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)
2. Run `npx expo start`
3. Scan the QR code with Expo Go (Android) or the Camera app (iOS)

---

## Test Credentials

| Role  | Email                | Password |
| ----- | -------------------- | -------- |
| Admin | `admin@test.com`     | any      |
| Staff | `staff@test.com`     | any      |
| Staff | `teacher@school.edu` | any      |

---

## Daily Development

Reference [section 3-5 above](#3-start-the-development-server) for further details.

```bash
npx expo start
```

### Adding Dependencies

```bash
npm install package-name
npx expo install package-name    # for Expo-compatible packages
```

Use `npx expo install` for any package that touches device APIs — it pins to the version compatible with your Expo SDK.

---

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project
2. Enable the **Google Identity** API under APIs & Services
3. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**

### 2. Create Client IDs

**Web client** (required):

```
Application type: Web application
Authorized redirect URIs:
  - http://localhost:8081
  - https://auth.expo.io/@YOUR_EXPO_USERNAME/Next-Step
```

**Android client** (for standalone builds):

```
Application type: Android
Package name: com.yourcompany.Next-Step
SHA-1 fingerprint: [see below]
```

**iOS client** (for standalone builds):

```
Application type: iOS
Bundle ID: com.yourcompany.Next-Step
```

### 3. Get SHA-1 Fingerprint (Android)

For Expo Go testing, use the predefined Expo Go fingerprint:

```
Package name: host.exp.exponent
SHA-1: E0:5F:AE:81:8E:17:8D:49:1C:8A:C7:6C:8D:4C:8F:F3:5D:1A:B6:7E
```

For local builds:

```bash
keytool -keystore ~/.android/debug.keystore -list -v \
  -alias androiddebugkey -storepass android
```

### 4. Update `app.json`

```json
{
  "expo": {
    "scheme": "Next-Step",
    "ios": { "bundleIdentifier": "com.yourcompany.Next-Step" },
    "android": { "package": "com.yourcompany.Next-Step" }
  }
}
```

---

## Troubleshooting

**Metro bundler not starting**

```bash
npx expo start --clear
```

**Module not found**

```bash
rm -rf node_modules
npm install
```

**Google Sign-In not working**

- Verify package name matches Google Cloud Console
- Check SHA-1 fingerprint is correctly added
- Confirm redirect URIs include your Expo username

**Expo Go can't connect**

- Ensure device is on same WiFi network
- Try tunnel mode: `npx expo start --tunnel`
- Check firewall settings

---

## Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing GitHub issues
3. Create a new issue with:
   - Node version: `node --version`
   - Expo version: `npx expo --version`
   - OS and device/simulator
   - Full error message and steps to reproduce
