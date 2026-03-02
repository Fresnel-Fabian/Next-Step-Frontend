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

### Prerequisites

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
