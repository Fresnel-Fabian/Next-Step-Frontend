import { User, UserRole } from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';

// Required for Google auth to work properly
WebBrowser.maybeCompleteAuthSession();

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  
  // Google auth request
  googleRequest: any;
  googleResponse: any;
  promptGoogleAsync: () => Promise<void>;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  googleRequest: null,
  googleResponse: null,
  promptGoogleAsync: async () => {},

  login: async (email, password) => {
    try {
      // Mock login - replace with real API
      const mockUser: User = {
        id: '1',
        email,
        name: email.includes('admin') ? 'Administrator' : 'Sarah Johnson',
        role: email.includes('admin') ? UserRole.ADMIN : UserRole.STAFF,
        department: email.includes('admin') ? undefined : 'English Department',
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      set({ user: mockUser });
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  },

  loginWithGoogle: async (idToken: string, userData: any) => {
    try {
      // TODO: Send idToken to your backend for verification
      // Your backend verifies the token with Google and returns user info
      
      // For now, create user from Google data
      const user: User = {
        id: userData.id || 'google-' + Date.now(),
        email: userData.email,
        name: userData.name || userData.email,
        role: UserRole.STAFF, // Default to staff, your backend should determine this
        avatar: userData.picture,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('googleToken', idToken);
      set({ user });
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error('Failed to sign in with Google');
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['user', 'googleToken']);
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        set({ user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Check auth error:', error);
      set({ isLoading: false });
    }
  },
}));