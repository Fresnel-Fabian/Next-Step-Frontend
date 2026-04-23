# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Expo + React Native (TypeScript). Package manager is npm.

- `npm install` — install dependencies
- `npx expo start` — start Metro dev server (or `./start.sh`, which also auto-installs deps)
  - In the CLI: `w` = web, `a` = Android emulator, `i` = iOS simulator, scan QR for Expo Go
- `npx expo start --clear` — reset Metro cache (use when bundler misbehaves)
- `npx expo install <pkg>` — add any package that touches device APIs (pins to the version compatible with the current Expo SDK). Use plain `npm install` only for pure JS libs.
- `npm test` — run the Jest suite (preset: `jest-expo`). `npm run test:watch` for watch mode, `npm run test:coverage` for coverage. CI runs this on every PR to `master`.
- Android release build: `npx expo prebuild --platform android && cd android && ./gradlew assembleRelease`

Test harness: tests colocate next to source (`foo.ts` → `foo.test.ts`). Global mocks live in `jest.setup.ts` (AsyncStorage, expo-router, expo-blur, expo-web-browser, expo-auth-session, expo-crypto, react-native-safe-area-context, react-native-reanimated, `@expo/vector-icons`). For endpoints on the Axios instance, use `axios-mock-adapter` on the `api` export so interceptors still fire.

## Architecture

### Roles drive routing

The app has four user-facing surfaces under `app/`, each an Expo Router group:

- `(auth)` — login
- `(admin)`, `(staff)`, `(student)` — one per role, each with its own `_layout.tsx`
- `(shared)` — screens reachable from any role (settings, documents, etc.)

`UserRole` in `store/authStore.ts` is the source of truth: `ADMIN`, `TEACHER` (→ `(staff)` screens), `STUDENT` (→ `(student)` screens). `app/_layout.tsx` is the auth guard — on every segment change it redirects unauthenticated users to `(auth)/login` and forces authenticated users into the group matching their role. `app/index.tsx` does the same role→group fan-out for the root route.

When adding a feature that exists for multiple roles, the same screen name (e.g. `documents.tsx`) is duplicated under each role's group rather than shared — this is intentional so each role can tailor the screen. Shared logic belongs in `components/`, `services/`, or `lib/`.

### RoleTabsShell — one shell, three layouts

`components/layout/RoleTabsShell.tsx` is the chrome rendered by each role's `_layout.tsx`. Each role layout passes a `navItems: RoleNavItem[]` array declaring its tabs. The shell branches on screen width (`< 768px` = mobile):

- **Mobile**: bottom `Tabs` bar + frosted glass top bar. Items with `segment === 'notification'` or `'settings'` are hidden from the tab bar (`href: null`) and surfaced as top-right icons instead.
- **Desktop/web**: collapsible left sidebar; the `Tabs` bar is rendered with `height: 0` (hidden) so expo-router still mounts the tab screens as routes.

So to add a new screen to a role: (1) create `app/(role)/new-screen.tsx`, (2) add a matching `RoleNavItem` in that role's `_layout.tsx`. The `segment` **must** equal the filename.

Route-active matching uses `lib/sidebarNav.ts:isSidebarRouteActive`, which strips `(group)` segments before comparing — don't compare raw pathnames.

### State & data layer

- **Auth state**: `store/authStore.ts` — Zustand store. Persists `auth_token` and `user` to AsyncStorage. `checkAuth()` runs on app boot from `_layout.tsx` and re-validates via `GET /api/v1/auth/me`. Google sign-in uses PKCE via `expo-auth-session` and posts the code to `/api/v1/auth/google`.
- **HTTP client**: `services/api.ts` — single Axios instance. Injects `Authorization: Bearer <token>` from AsyncStorage via a request interceptor; a response interceptor clears stored creds on 401. All backend calls go through this instance.
- **Dev API base URL** is computed at import time: Android → `http://10.0.2.2:8000/`, everything else → `http://127.0.0.1:8000/`. To test on a physical device, set `API_URL` in `config/api.ts` to your LAN IP (e.g. `http://192.168.1.5:8000/`) — that override wins over the platform default.
- **Data calls**: `services/dataService.ts` — thin typed wrappers around `api` for domain endpoints (schedules, dashboard, documents, polls, notifications, etc.). Prefer adding methods here over calling `api` directly from screens.

### Import alias

`tsconfig.json` maps `@/*` → repo root. Use `@/store/...`, `@/services/...`, `@/components/...` in imports rather than relative paths.

## Conventions

- **Backend-shaped types**: `dataService.ts` DTOs use `snake_case` for request bodies (e.g. `class_count`, `code_verifier`) to match the FastAPI backend, while client-facing types are `camelCase`. Follow that pattern when adding endpoints.
- **Styling**: inline `StyleSheet.create` per component. Brand color is `#2563EB`; `constants/Colors.ts` has the full palette.
- **Icons**: `@expo/vector-icons` Ionicons. Active/inactive state is commonly expressed by stripping/adding the `-outline` suffix (see `RoleTabsShell`).
- **The mock-data disclaimer in `README.md` is stale** — the app is wired to a real FastAPI backend via `services/api.ts`. Test credentials in `README.md` / `CONTRIBUTING.md` only work if the backend seeds those users.
