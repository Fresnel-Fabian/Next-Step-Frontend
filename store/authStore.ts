// store/authStore.ts
import api, { ApiError, clearAuthToken, handleApiError, setAuthToken } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';

WebBrowser.maybeCompleteAuthSession();

// ============================================
// Types
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',   // maps to (staff) screens
  STUDENT = 'STUDENT',   // maps to (student) screens
}

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
  user: User | null;
  isLoading: boolean;
  error: ApiError | null;
  login: (email: string, password: string) => Promise<void>;
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

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

// ============================================
// Store
// ============================================

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
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

  loginWithGoogle: async (code: string, codeVerifier: string, redirectUri: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/google', {
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
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

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/api/v1/auth/register', data);
      await get().login(data.email, data.password);
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  logout: async () => {
    try {
      await clearAuthToken();
      await AsyncStorage.removeItem(USER_KEY);
      set({ user: null, error: null });
    } catch (error) {
      console.error('Logout error:', error);
      set({ user: null });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (!userData) {
        set({ user: null, isLoading: false });
        return;
      }
      const response = await api.get<User>('/api/v1/auth/me');
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      set({ user: response.data, isLoading: false });
    } catch (error) {
      await clearAuthToken();
      await AsyncStorage.removeItem(USER_KEY);
      set({ user: null, isLoading: false });
    }
  },

  updateProfile: async (data: UpdateProfileData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<User>('/api/v1/users/profile', data);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      set({ user: response.data, isLoading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// ============================================
// Selectors
// ============================================

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useIsAdmin = () =>
  useAuthStore((state) => state.user?.role === UserRole.ADMIN);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
