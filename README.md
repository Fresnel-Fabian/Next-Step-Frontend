# 📚 Next-Step

A cross-platform event management application for schools built with React Native and Expo. Next-Step provides administrators and staff members with tools to manage schedules, documents, notifications, polls, and more.

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

--- -->

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

| Category             | Technology                       |
| -------------------- | -------------------------------- |
| **Framework**        | React Native with Expo           |
| **Language**         | TypeScript                       |
| **Navigation**       | Expo Router (file-based)         |
| **State Management** | Zustand                          |
| **Storage**          | AsyncStorage                     |
| **Authentication**   | expo-auth-session (Google OAuth) |
| **Charts**           | react-native-chart-kit           |
| **Icons**            | @expo/vector-icons (Ionicons)    |
| **Image Picker**     | expo-image-picker                |

---

## Quick Start

```bash
git clone https://github.com/Fresnel-Fabian/Next-Step-Frontend
cd next-step
npm install
npx expo start
```

Then press `w` for web, `a` for Android emulator, or `i` for iOS simulator.

Test credentials:

- `admin@test.com` / any password → Admin dashboard
- `staff@test.com` / any password → Staff dashboard

> For full setup including Google OAuth and physical device testing, see [CONTRIBUTING.md](CONTRIBUTING.md).

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
| Admin | `admin@test.com` | Any | Full admin dashboard |
| Staff | `staff@test.com` | Any | Staff dashboard |
| Student | `student@school.edu` | Any | Student dashboard |

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

Before you begin, ensure you have the following installed:

| Requirement  | Version        | Check Command        |
| ------------ | -------------- | -------------------- |
| **Node.js**  | 18.x or higher | `node --version`     |
| **npm**      | 9.x or higher  | `npm --version`      |
| **Git**      | Any recent     | `git --version`      |
| **Expo CLI** | Latest         | `npx expo --version` |

#### Optional (for local builds)

- **Android Studio** - For Android builds
- **Xcode** - For iOS builds (macOS only)
- **Java JDK** - For Android builds (`java --version`)

---

## Project Structure

```
app/                     # Expo Router screens
├── (auth)/              # Login
├── (admin)/             # Admin-only screens
├── (staff)/             # Staff-only screens
├── (shared)/            # Shared screens across roles
└── _layout.tsx          # Root layout with auth guard
components/              # Reusable UI components
services/                # API and data services
store/                   # Zustand state stores
types/                   # TypeScript definitions
config/                  # Configuration files
```

---

## Documentation

- [Contributing & Development Setup](CONTRIBUTING.md)
- [Deployment Guide](docs/deployment.md)

---

## License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 👥 Authors

- **Fresnel Fabian** - _Initial work_ - [GitHub](https://github.com/Fresnel-Fabian)
