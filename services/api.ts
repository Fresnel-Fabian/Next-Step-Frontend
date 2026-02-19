// services/api.ts
/**
 * API Client - Centralized HTTP client for backend communication
 * 
 * Features:
 * - Automatic token injection
 * - Token refresh handling
 * - Error handling
 * - Request/response logging (in dev)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

// ============================================
// Configuration
// ============================================

// Backend URL - Override in config/api.ts for physical device (use your computer's LAN IP)
import { API_URL as CONFIG_API_URL } from '@/config/api';

const API_PORT = 8000;
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const DEFAULT_DEV_URL = `http://${DEV_HOST}:${API_PORT}/`;
const API_BASE_URL =
  CONFIG_API_URL ||
  (__DEV__ ? DEFAULT_DEV_URL : 'https://your-production-api.com');

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

// ============================================
// Create Axios Instance
// ============================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Request Interceptor
// ============================================

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from storage
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    // Add token to headers if it exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (__DEV__) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor
// ============================================

api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log(`✅ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Log error in development
    if (__DEV__) {
      console.log(`❌ ${error.response?.status} ${error.config?.url}`);
      console.log('Error:', error.response?.data);
    }
    
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      // Clear stored auth data
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      
      // You might want to redirect to login here
      // This depends on your navigation setup
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// Token Management
// ============================================

export const setAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// ============================================
// Error Helper
// ============================================

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    return {
      message: axiosError.response?.data?.detail || axiosError.message || 'An error occurred',
      status: axiosError.response?.status,
      details: axiosError.response?.data,
    };
  }
  
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  return { message: 'An unknown error occurred' };
};

// ============================================
// Export
// ============================================

export default api;
export { API_BASE_URL };
