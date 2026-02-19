# 📚 Next-Step

A cross-platform staff management application for schools built with React Native and Expo. Next-Step provides administrators and staff members with tools to manage schedules, documents, notifications, polls, and more.

![React Native](https://img.shields.io/badge/React_Native-0.76-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

---

<!--
## 📱 Screenshots

| Login | Admin Dashboard | Staff Dashboard |
|-------|-----------------|-----------------|
| ![Login](docs/screenshots/login.png) | ![Admin](docs/screenshots/admin-dashboard.png) | ![Staff](docs/screenshots/staff-dashboard.png) |

| Documents | Schedules | Settings |
|-----------|-----------|----------|
| ![Docs](docs/screenshots/documents.png) | ![Schedule](docs/screenshots/schedules.png) | ![Settings](docs/screenshots/settings.png) |
-->

---

## ✨ Features

### Authentication
- ✅ Email/Password login
- ✅ Google SSO (OAuth 2.0)
- ✅ Role-based access (Admin/Staff/Student)
- ✅ Persistent sessions with AsyncStorage

### Admin Features
- 📊 Dashboard with analytics and charts
- 👥 Staff management overview
- 📅 Schedule management (Create, Edit, Delete, Sync)
- 📄 Document management with preview
- 🔔 Notification broadcasting
- ⚙️ System settings

### Staff Features
- 🏠 Personalized dashboard
- 📅 Today's schedule view
- 📄 Document access and downloads
- 🗳️ Interactive polls and voting
- 🔔 Notification center
- ⚙️ Profile and preferences

### Shared Features
- 🔍 Search and filtering
- 🌙 Dark mode support (configurable)
- 🌐 Multi-language support (extensible)
- 📱 Universal: iOS, Android, Web

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native with Expo |
| **Language** | TypeScript |
| **Navigation** | Expo Router (file-based) |
| **State Management** | Zustand |
| **Storage** | AsyncStorage |
| **Authentication** | expo-auth-session (Google OAuth) |
| **Charts** | react-native-chart-kit |
| **Icons** | @expo/vector-icons (Ionicons) |
| **Image Picker** | expo-image-picker |

---

## 📁 Project Structure

```
next-step/
├── app/                              # Expo Router screens
│   ├── (auth)/                       # Authentication screens
│   │   ├── _layout.tsx              # Auth navigation layout
│   │   └── login.tsx                # Login screen
│   ├── (admin)/                      # Admin-only screens
│   │   ├── _layout.tsx              # Admin tab layout
│   │   ├── dashboard.tsx            # Admin dashboard
│   │   ├── schedules.tsx            # Schedule management
│   │   ├── documents.tsx            # Document management
│   │   └── settings.tsx             # Placeholder (links to shared)
│   ├── (staff)/                      # Staff-only screens
│   │   ├── _layout.tsx              # Staff tab layout
│   │   ├── dashboard.tsx            # Staff dashboard
│   │   ├── schedules.tsx            # Schedule view
│   │   ├── documents.tsx            # Document access
│   │   ├── polls.tsx                # Polls and voting
│   │   └── settings.tsx             # Placeholder (links to shared)
│   ├── (shared)/                     # Shared screens
│   │   ├── _layout.tsx              # Shared navigation layout
│   │   ├── settings.tsx             # Settings screen
│   │   └── notifications.tsx        # Notifications screen
│   └── _layout.tsx                   # Root layout with auth guard
├── components/                       # Reusable components
│   ├── ui/                          # Generic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Toggle.tsx
│   ├── dashboard/                   # Dashboard-specific components
│   │   ├── StatsCard.tsx
│   │   ├── ActivityItem.tsx
│   │   └── ScheduleItem.tsx
│   └── documents/                   # Document-specific components
│       └── DocumentListItem.tsx
├── services/                         # API and data services
│   └── dataService.ts               # Mock data service
├── store/                            # Zustand stores
│   └── authStore.ts                 # Authentication state
├── types/                            # TypeScript definitions
│   ├── auth.ts
│   ├── document.ts
│   ├── notification.ts
│   ├── poll.ts
│   └── schedule.ts
├── config/                           # Configuration files
│   └── google-auth.ts               # Google OAuth config
├── assets/                           # Images, fonts, etc.
│   └── images/
├── app.json                          # Expo configuration
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── README.md                         # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | 18.x or higher | `node --version` |
| **npm** | 9.x or higher | `npm --version` |
| **Git** | Any recent | `git --version` |
| **Expo CLI** | Latest | `npx expo --version` |

#### Optional (for local builds):
- **Android Studio** - For Android builds
- **Xcode** - For iOS builds (macOS only)
- **Java JDK** - For Android builds (`java --version`)

---

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Fresnel-Fabian/Next-Step-Frontend
cd next-step
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Google OAuth (Optional for basic testing)

Create/update the Google OAuth configuration:

```bash
# Create config directory if it doesn't exist
mkdir -p config
```

**File: `config/google-auth.ts`**

```typescript
export const GoogleAuthConfig = {
  // Get these from Google Cloud Console
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  
  scopes: ['profile', 'email'],
};
```

> **Note:** You can skip this step for basic testing. The app will work with email/password login using mock data.

#### 4. Start the Development Server

```bash
npx expo start
```

#### 5. Run the App

Choose your preferred method:

| Platform | Command | Requirement |
|----------|---------|-------------|
| **Web** | Press `w` | None |
| **Android Emulator** | Press `a` | Android Studio |
| **iOS Simulator** | Press `i` | Xcode (macOS only) |
| **Physical Device** | Scan QR code | Expo Go app |

---

## 📱 Running on Physical Devices

### Using Expo Go (Recommended for Development)

1. **Install Expo Go** on your device:
   - [Android (Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

2. **Start the dev server:**
   ```bash
   npx expo start
   ```

3. **Scan the QR code:**
   - **Android:** Use the Expo Go app to scan
   - **iOS:** Use the Camera app to scan

4. **Test Login:**
   - Email: `admin@test.com` → Admin Dashboard
   - Email: `staff@test.com` → Staff Dashboard
   - Password: Any value (mock authentication)

---

## 🔐 Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Next-Step")
3. Enable the **Google+ API**:
   - APIs & Services → Library → Search "Google+" → Enable

### Step 2: Create OAuth Credentials

Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**

#### Web Client (Required)

```
Application type: Web application
Name: Next-Step Web
Authorized redirect URIs:
  - http://localhost:8081
  - https://auth.expo.io/@YOUR_EXPO_USERNAME/Next-Step
```

#### Android Client (For Standalone Builds)

```
Application type: Android
Name: Next-Step Android
Package name: com.yourcompany.Next-Step
SHA-1 certificate fingerprint: [See below]
```

#### iOS Client (For Standalone Builds)

```
Application type: iOS
Name: Next-Step iOS
Bundle ID: com.yourcompany.Next-Step
```

### Step 3: Get SHA-1 Fingerprint (Android)

#### For Expo Go Testing:

Use Expo Go's SHA-1 (predefined):
```
Package name: host.exp.exponent
SHA-1: E0:5F:AE:81:8E:17:8D:49:1C:8A:C7:6C:8D:4C:8F:F3:5D:1A:B6:7E
```

#### For Local/Production Builds:

```bash
# Debug keystore (development)
keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android

# Production keystore
keytool -keystore ./your-keystore.keystore -list -v -alias your-alias
```

### Step 4: Update Configuration

**File: `config/google-auth.ts`**

```typescript
export const GoogleAuthConfig = {
  webClientId: 'XXXXXX.apps.googleusercontent.com',
  iosClientId: 'YYYYYY.apps.googleusercontent.com',
  androidClientId: 'ZZZZZZ.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
};
```

### Step 5: Update `app.json`

```json
{
  "expo": {
    "scheme": "Next-Step",
    "ios": {
      "bundleIdentifier": "com.yourcompany.Next-Step"
    },
    "android": {
      "package": "com.yourcompany.Next-Step"
    }
  }
}
```

---

## 🏗️ Building for Production

### Option 1: Local Android Build (No EAS Required)

#### Prerequisites

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

#### Generate Native Project

```bash
# Generate Android folder
npx expo prebuild --platform android
```

#### Build APK

```bash
# Debug build
cd android
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# APK location
ls -lh app/build/outputs/apk/
```

#### Create Signed Release APK

1. **Generate keystore:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore Next-Step.keystore \
     -alias Next-Step \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000
   ```

2. **Configure signing in `android/app/build.gradle`:**
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

3. **Build:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### Option 2: Using EAS Build (Cloud)

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

### Option 3: Development Build

```bash
# Run directly on connected device (dev mode)
npx expo run:android

# Or for iOS (macOS only)
npx expo run:ios
```

---

## 🧪 Testing

### Manual Testing Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | `admin@school.edu` | adminpass123 | Full admin dashboard |
| Teacher | `teacher@school.edu` | teacherpass123 | Teacher dashboard |
| Student | `student@school.edu` | studentpass123 | Student dashboard |

### Run Tests (Future)

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file for sensitive configuration:

```bash
# .env
GOOGLE_WEB_CLIENT_ID=your-web-client-id
GOOGLE_IOS_CLIENT_ID=your-ios-client-id
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
API_BASE_URL=https://your-api.com
```

### App Configuration

**File: `app.json`**

```json
{
  "expo": {
    "name": "Next-Step",
    "slug": "Next-Step",
    "version": "1.0.0",
    "scheme": "Next-Step",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.Next-Step"
    },
    "android": {
      "package": "com.yourcompany.Next-Step",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#2563EB"
      }
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

---

## 📡 API Integration

The app currently uses mock data. To connect to a real backend:

### 1. Update DataService

**File: `services/dataService.ts`**

```typescript
const API_BASE = 'https://your-api.com/api';

export class DataService {
  private static async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await AsyncStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    return this.fetch('/dashboard/stats');
  }

  static async getDocuments(): Promise<DocumentItem[]> {
    return this.fetch('/documents');
  }

  // ... other methods
}
```

### 2. Update AuthStore

**File: `store/authStore.ts`**

```typescript
login: async (email, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const { user, token } = await response.json();
  
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  set({ user, token, isAuthenticated: true });
},
```

---

## 🎨 Customization

### Colors

Edit the color scheme in your components or create a constants file:

**File: `constants/Colors.ts`**

```typescript
export const Colors = {
  primary: '#2563EB',      // Brand blue
  primaryDark: '#1E40AF',
  secondary: '#8B5CF6',    // Purple (polls)
  success: '#10B981',      // Green
  danger: '#EF4444',       // Red
  warning: '#F59E0B',      // Orange
  
  background: '#F9FAFB',
  backgroundDark: '#111827',
  
  text: '#111827',
  textLight: '#6B7280',
  textDark: '#FFFFFF',
  
  border: '#E5E7EB',
};
```

### Adding New Screens

1. **Create the file** in the appropriate directory:
   ```bash
   touch app/(staff)/new-screen.tsx
   ```

2. **Add basic structure:**
   ```typescript
   import { View, Text, StyleSheet } from 'react-native';

   export default function NewScreen() {
     return (
       <View style={styles.container}>
         <Text>New Screen</Text>
       </View>
     );
   }

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: '#F9FAFB',
     },
   });
   ```

3. **Add to tab navigation** in `_layout.tsx` if needed.

---

## 🐛 Troubleshooting

### Common Issues

#### "Metro bundler not starting"
```bash
# Clear cache and restart
npx expo start --clear
```

#### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

#### "Android build fails"
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
npx expo run:android
```

#### "Google Sign-In not working"
1. Check OAuth credentials in Google Cloud Console
2. Verify package name matches
3. Ensure SHA-1 is correctly added
4. Check redirect URIs

#### "Expo Go can't connect"
1. Ensure device is on same WiFi network
2. Try tunnel mode: `npx expo start --tunnel`
3. Check firewall settings

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Google OAuth Setup](https://docs.expo.dev/guides/google-authentication/)

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes:**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- Use TypeScript for all new files
- Follow existing component patterns
- Use StyleSheet for styling (no inline styles)
- Add types for all props and state

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Fresnel Fabian** - *Initial work* - [GitHub](https://github.com/Fresnel-Fabian)

---

## 🙏 Acknowledgments

- [Expo Team](https://expo.dev/) for the amazing framework
- [React Native Community](https://reactnative.dev/)
- School administrators and staff who provided feedback

---

## 📞 Support

For support, email fabian.f@northeastern.edu or open an issue on GitHub.

---

<p align="center">
  Made with ❤️ using React Native and Expo
</p>