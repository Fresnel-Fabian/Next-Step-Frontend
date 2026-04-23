import AsyncStorage from '@react-native-async-storage/async-storage';
import MockAdapter from 'axios-mock-adapter';
import api from '@/services/api';
import { UserRole, useAuthStore } from './authStore';

const mock = new MockAdapter(api);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

const fakeUser = {
  id: 'u1',
  email: 'admin@example.com',
  name: 'Admin',
  role: UserRole.ADMIN,
};

async function resetStore() {
  await AsyncStorage.clear();
  useAuthStore.setState({ user: null, isLoading: false, error: null });
}

beforeEach(async () => {
  mock.reset();
  await resetStore();
});

afterAll(() => {
  mock.restore();
});

describe('authStore.login', () => {
  it('persists token + user and sets state on success', async () => {
    mock.onPost('/api/v1/auth/login').reply(200, {
      token: 'jwt-abc',
      user: fakeUser,
    });

    await useAuthStore.getState().login('admin@example.com', 'pw');

    expect(useAuthStore.getState().user).toEqual(fakeUser);
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBe('jwt-abc');
    expect(await AsyncStorage.getItem(USER_KEY)).toBe(JSON.stringify(fakeUser));
  });

  it('sets error and rethrows on 401', async () => {
    mock.onPost('/api/v1/auth/login').reply(401, { detail: 'Invalid credentials' });

    await expect(
      useAuthStore.getState().login('admin@example.com', 'wrong'),
    ).rejects.toMatchObject({ message: 'Invalid credentials', status: 401 });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().error?.message).toBe('Invalid credentials');
  });
});

describe('authStore.logout', () => {
  it('clears token, user, and state', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'jwt-abc');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(fakeUser));
    useAuthStore.setState({ user: fakeUser });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
  });
});

describe('authStore.checkAuth', () => {
  it('stays logged out when no user in storage', async () => {
    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('revalidates and populates user when token + user are present', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'jwt-abc');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(fakeUser));
    mock.onGet('/api/v1/auth/me').reply(200, fakeUser);

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().user).toEqual(fakeUser);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('clears session when /me returns 401', async () => {
    await AsyncStorage.setItem(TOKEN_KEY, 'jwt-stale');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(fakeUser));
    mock.onGet('/api/v1/auth/me').reply(401, { detail: 'expired' });

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(await AsyncStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
  });
});
