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

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import api, { setAuthToken, clearAuthToken, handleApiError, ApiError } from '@/services/api';

// Required for Google auth to work properly
WebBrowser.maybeCompleteAuthSession();

// ============================================
// Types
// ============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STAFF = 'STAFF',
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

interface AuthStore {
  // State
  user: User | null;
  isLoading: boolean;
  error: ApiError | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
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
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

// ============================================
// Store
// ============================================

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  // ========================================
  // Email/Password Login
  // ========================================
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/login', {
        email,
        password,
      });
      
      const { token, user } = response.data;
      
      // Store token and user
      await setAuthToken(token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      set({ user, isLoading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  // ========================================
  // Google OAuth Login
  // ========================================
  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Send Google token to backend for verification
      const response = await api.post<AuthResponse>('/api/v1/auth/google', {
        idToken,
      });
      
      const { token, user } = response.data;
      
      // Store token and user
      await setAuthToken(token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      set({ user, isLoading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  // ========================================
  // Register New User
  // ========================================
  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Register the user
      await api.post('/api/v1/auth/register', data);
      
      // Auto-login after registration
      await get().login(data.email, data.password);
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  // ========================================
  // Logout
  // ========================================
  logout: async () => {
    try {
      // Clear stored data
      await clearAuthToken();
      await AsyncStorage.removeItem(USER_KEY);
      
      set({ user: null, error: null });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if storage fails
      set({ user: null });
    }
  },

  // ========================================
  // Check Existing Auth (App Startup)
  // ========================================
  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      // Check for stored user
      const userData = await AsyncStorage.getItem(USER_KEY);
      
      if (!userData) {
        set({ user: null, isLoading: false });
        return;
      }
      
      // Verify token is still valid by calling /me endpoint
      const response = await api.get<User>('/api/v1/auth/me');
      
      // Update stored user with fresh data
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      
      set({ user: response.data, isLoading: false });
    } catch (error) {
      // Token is invalid or expired
      await clearAuthToken();
      await AsyncStorage.removeItem(USER_KEY);
      set({ user: null, isLoading: false });
    }
  },

  // ========================================
  // Update Profile
  // ========================================
  updateProfile: async (data: UpdateProfileData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.put<User>('/api/v1/users/profile', data);
      
      // Update stored user
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      
      set({ user: response.data, isLoading: false });
    } catch (error) {
      const apiError = handleApiError(error);
      set({ error: apiError, isLoading: false });
      throw apiError;
    }
  },

  // ========================================
  // Clear Error
  // ========================================
  clearError: () => {
    set({ error: null });
  },
}));

// ============================================
// Selectors (for convenience)
// ============================================

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === UserRole.ADMIN);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);