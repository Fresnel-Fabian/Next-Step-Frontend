import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, USER_KEY, forceLogoutOn401 } from './authLogout';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('forceLogoutOn401', () => {
  it('removes both the auth token and cached user from AsyncStorage', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'jwt-abc');
    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify({ id: 'u1', name: 'Admin' }),
    );

    await forceLogoutOn401();

    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
  });

  it('is a no-op when nothing is stored', async () => {
    await expect(forceLogoutOn401()).resolves.toBeUndefined();
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
  });
});
