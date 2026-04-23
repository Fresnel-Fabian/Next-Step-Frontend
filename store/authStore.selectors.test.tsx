import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, useAuthStore, useUser } from './authStore';

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
  await resetStore();
});

/**
 * The point of the selector refactor: a component that reads only `user` via
 * the `useUser()` selector must NOT re-render when an unrelated slice
 * (`isLoading`) changes. It must still re-render when `user` itself changes.
 */
describe('authStore selector isolation', () => {
  it('does not re-render on unrelated slice change, re-renders on watched slice change', () => {
    const renders = { count: 0 };

    function UserConsumer() {
      renders.count += 1;
      const user = useUser();
      return <Text>{user ? user.name : 'no user'}</Text>;
    }

    const { getByText } = render(<UserConsumer />);
    expect(getByText('no user')).toBeTruthy();

    const rendersAfterMount = renders.count;

    // Flip an unrelated slice — the selected `user` reference is unchanged,
    // so this component must not re-render.
    act(() => {
      useAuthStore.setState((s) => ({ isLoading: !s.isLoading }));
    });
    expect(renders.count).toBe(rendersAfterMount);

    // Flip the watched slice — component should re-render.
    act(() => {
      useAuthStore.setState({ user: fakeUser });
    });
    expect(renders.count).toBe(rendersAfterMount + 1);
    expect(getByText('Admin')).toBeTruthy();
  });
});
