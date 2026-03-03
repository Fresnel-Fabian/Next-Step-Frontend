// store/authStore.ts
/**
 * Authentication Store using Zustand
 *
 * Handles:
 * - Email/password login
 * - Google OAuth login
 * - Token management
 * - User state
 */

import api, {
  ApiError,
  clearAuthToken,
  handleApiError,
  setAuthToken,
} from "@/services/api";
import { GOOGLE_ACCESS_TOKEN_KEY } from "@/services/googleDriveService";
import { UserRole } from "@/types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { create } from "zustand";

// Required for Google auth to work properly
WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  department?: string | null;
}

interface AuthResponse {
  token: string;
  user: User;
}

// /api/v1/auth/drive-token endpoint
interface DriveTokenResponse {
  access_token: string;
}

interface AuthStore {
  // State
  user: User | null;
  isLoading: boolean;
  error: ApiError | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  // Authenticate with a Google PKCE authorization code.
  loginWithGoogle: (
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  department?: string;
}

interface UpdateProfileData {
  name?: string;
  department?: string;
}

// Storage keys
const TOKEN_KEY = "auth_token";
const USER_KEY = "user";

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  // Email/Password Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<AuthResponse>("/api/v1/auth/login", {
        email,
        password,
      });
      const { token, user } = response.data;
      await setAuthToken(token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  // ── Google PKCE Code Login ────────────────────────────────────────────────
  loginWithGoogle: async (code, codeVerifier, redirectUri) => {
    set({ isLoading: true, error: null });
    try {
      // Backend exchanges the code for tokens, verifies identity, creates/finds
      // the user, and returns our own JWT + user object.
      const response = await api.post<AuthResponse>("/api/v1/auth/google", {
        code,
        codeVerifier,
        redirectUri,
      });
      const { token, user } = response.data;
      await setAuthToken(token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      // Fetch and cache the Drive access token so googleDriveService.ts can use
      // it immediately without an extra round-trip.
      // The backend /drive-token endpoint also refreshes the token if needed.
      try {
        const driveResp = await api.get<DriveTokenResponse>(
          "/api/v1/auth/drive-token",
        );
        if (driveResp.data.access_token) {
          await AsyncStorage.setItem(
            GOOGLE_ACCESS_TOKEN_KEY,
            driveResp.data.access_token,
          );
        }
      } catch {
        // Non-fatal: Drive features will re-fetch the token on first use
      }

      set({ user, isLoading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  // Register New User
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Register the user
      await api.post("/api/v1/auth/register", data);

      // Auto-login after registration
      await get().login(data.email, data.password);
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  // Logout
  logout: async () => {
    try {
      // Clear stored data
      await clearAuthToken();
      await AsyncStorage.multiRemove([USER_KEY, GOOGLE_ACCESS_TOKEN_KEY]);
      set({ user: null, error: null });
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear user state even if storage fails
      set({ user: null });
    }
  },

  // Check Existing Auth (App Startup)
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (!userData) {
        set({ user: null, isLoading: false });
        return;
      }

      // Verify token is still valid by calling /me endpoint
      const response = await api.get<User>("/api/v1/auth/me");
      // Update stored user with fresh data
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      set({ user: response.data, isLoading: false });
    } catch {
      await clearAuthToken();
      await AsyncStorage.multiRemove([USER_KEY, GOOGLE_ACCESS_TOKEN_KEY]);
      set({ user: null, isLoading: false });
    }
  },

  // Update Profile
  updateProfile: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.put<User>("/api/v1/users/profile", data);

      // Update stored user
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      set({ user: response.data, isLoading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors (for convenience)
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => !!s.user);
export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.role === UserRole.ADMIN);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
