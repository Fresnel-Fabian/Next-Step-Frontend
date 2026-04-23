/**
 * Tests for Issue #22 — staff dashboard UX bug fixes.
 *
 * Bug 1: handleDismissActivity / handleClearAll were client-only.
 *        They must now hit DataService.deleteActivity / deleteAllActivity
 *        and roll back the optimistic update on error.
 *
 * Bug 2: handleLogout used setTimeout(logout, 500). It must now just
 *        await logout() — no dangling timers.
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '@/services/api';
import { useAuthStore, UserRole } from '@/store/authStore';

// Mock the toast module at the top level so we can spy on Toast.show calls.
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

// Mock the responsive hook so the screen renders without layout plumbing.
jest.mock('@/lib/dashboardResponsive', () => ({
  useDashboardCompact: () => ({
    isCompact: false,
    contentPaddingX: 16,
    contentPaddingY: 16,
    greetingFontSize: 24,
    secondaryFontSize: 14,
    cardPadding: 16,
    sectionGap: 16,
  }),
}));

// Require AFTER the mocks above so the screen picks up the mocked modules.
const Toast = require('react-native-toast-message').default;
const StaffDashboard = require('./dashboard').default;

const mock = new MockAdapter(api);

const fakeUser = {
  id: 'u1',
  email: 'staff@example.com',
  name: 'Staff Member',
  role: UserRole.TEACHER,
};

const statsPayload = {
  totalStaff: 1,
  staffTrend: '+0',
  activeSchedules: 0,
  schedulesTrend: '',
  notificationsSent: 0,
  notificationsTrend: '',
  totalDocuments: 0,
  documentsTrend: '',
  chartData: [],
};

const activityPayload = [
  { id: '1', title: 'First activity', author: 'Alice', timestamp: new Date().toISOString() },
  { id: '2', title: 'Second activity', author: 'Bob', timestamp: new Date().toISOString() },
];

async function seedAuth() {
  await AsyncStorage.clear();
  useAuthStore.setState({ user: fakeUser, isLoading: false, error: null });
}

beforeEach(async () => {
  mock.reset();
  (Toast.show as jest.Mock).mockClear();
  await seedAuth();
});

afterAll(() => {
  mock.restore();
});

async function renderDashboard() {
  mock.onGet('/api/v1/dashboard/stats').reply(200, statsPayload);
  mock.onGet('/api/v1/dashboard/activity').reply(200, activityPayload);
  const utils = render(<StaffDashboard />);
  // Wait for initial data load to finish (activity items appear).
  await waitFor(() => {
    expect(utils.getByText('First activity')).toBeTruthy();
  });
  return utils;
}

describe('StaffDashboard — handleDismissActivity', () => {
  it('removes the item and calls DataService.deleteActivity on success', async () => {
    let capturedUrl: string | undefined;
    mock.onDelete(/\/api\/v1\/dashboard\/activity\/.+/).reply((config) => {
      capturedUrl = config.url;
      return [204];
    });

    const { getByText, queryByText, getAllByTestId } = await renderDashboard();

    // There are two dismiss buttons (one per activity). The first is for id '1'.
    const dismissButtons = getAllByTestId('icon-close');
    fireEvent.press(dismissButtons[0].parent ?? dismissButtons[0]);

    await waitFor(() => {
      expect(queryByText('First activity')).toBeNull();
    });
    expect(getByText('Second activity')).toBeTruthy();
    expect(capturedUrl).toBe('/api/v1/dashboard/activity/1');
  });

  it('rolls back and shows an error toast when the delete fails', async () => {
    mock.onDelete(/\/api\/v1\/dashboard\/activity\/.+/).reply(500, { detail: 'boom' });

    const { getByText, getAllByTestId } = await renderDashboard();

    const dismissButtons = getAllByTestId('icon-close');
    fireEvent.press(dismissButtons[0].parent ?? dismissButtons[0]);

    // After the failed request, the item should reappear in the list.
    await waitFor(() => {
      expect(getByText('First activity')).toBeTruthy();
    });

    const errorCall = (Toast.show as jest.Mock).mock.calls.find(
      ([arg]) => arg && arg.type === 'error',
    );
    expect(errorCall).toBeDefined();
    expect(errorCall[0].text1).toBe('Could not dismiss');
  });
});

describe('StaffDashboard — handleLogout (Bug #2)', () => {
  it('calls logout() and schedules no timers', async () => {
    // Make logout a jest mock we can assert on.
    const logoutSpy = jest.fn(async () => {
      // Simulate the real store clearing the user.
      useAuthStore.setState({ user: null });
    });
    useAuthStore.setState({ logout: logoutSpy });

    const { getAllByTestId } = await renderDashboard();

    // The header logout button renders an Ionicon with name="log-out-outline".
    const logoutIcons = getAllByTestId('icon-log-out-outline');
    expect(logoutIcons.length).toBeGreaterThan(0);

    // Bug 2 was `setTimeout(logout, 500)`. Spy on setTimeout and confirm the
    // press handler does NOT schedule a long-running timer (anything >= 100ms
    // would be the 500ms logout delay; React/axios internals schedule 0–few ms
    // microtask-ish timers that we tolerate).
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    setTimeoutSpy.mockClear();

    await act(async () => {
      fireEvent.press(logoutIcons[0].parent ?? logoutIcons[0]);
    });

    expect(logoutSpy).toHaveBeenCalledTimes(1);

    const suspiciousTimers = setTimeoutSpy.mock.calls.filter(
      ([, delay]) => typeof delay === 'number' && delay >= 100,
    );
    expect(suspiciousTimers).toEqual([]);

    setTimeoutSpy.mockRestore();
  });
});
