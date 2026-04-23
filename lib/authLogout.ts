/**
 * Shared logout helper — single source of truth for clearing persisted auth
 * state from AsyncStorage.
 *
 * Consumed by:
 *   - `services/api.ts`   response interceptor (axios 401 handler)
 *   - `services/dataService.ts` `uploadFile` (native fetch path, bypasses axios)
 *
 * Keep the storage key constants here so every auth-clearing path agrees.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user';

/**
 * Clears the persisted auth token and cached user from AsyncStorage.
 * Call this anywhere a 401 is observed outside axios (e.g. raw `fetch`).
 */
export async function forceLogoutOn401(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
