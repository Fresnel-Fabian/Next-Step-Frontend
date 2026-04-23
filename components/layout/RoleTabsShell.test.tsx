import React from 'react';
import { render } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';
import { RoleTabsShell, RoleNavItem } from './RoleTabsShell';
import { useAuthStore, UserRole } from '@/store/authStore';
import { MOBILE_BREAKPOINT } from '@/lib/breakpoints';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions');

const navItems: RoleNavItem[] = [
  { segment: 'dashboard', label: 'Dashboard', tabShort: 'Home', icon: 'home-outline', route: '/(admin)/dashboard' },
  { segment: 'schedules', label: 'Schedules', tabShort: 'Sched', icon: 'calendar-outline', route: '/(admin)/schedules' },
];

function setDimensions(width: number) {
  (useWindowDimensions as jest.Mock).mockReturnValue({ width, height: 800, scale: 1, fontScale: 1 });
}

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'u1', email: 'a@b.com', name: 'Admin', role: UserRole.ADMIN },
    isLoading: false,
    error: null,
  });
});

describe('RoleTabsShell', () => {
  it('renders tab host at mobile width', () => {
    setDimensions(500);
    const { getByTestId } = render(
      <RoleTabsShell navItems={navItems} roleName="Admin" avatarFallback="A" />,
    );
    expect(getByTestId('tabs')).toBeTruthy();
  });

  it('renders tab host at desktop width', () => {
    setDimensions(1280);
    const { getByTestId } = render(
      <RoleTabsShell navItems={navItems} roleName="Admin" avatarFallback="A" />,
    );
    expect(getByTestId('tabs')).toBeTruthy();
  });

  it('renders desktop sidebar at exactly MOBILE_BREAKPOINT (768)', () => {
    // Branching is width < MOBILE_BREAKPOINT, so width === 768 is desktop.
    setDimensions(MOBILE_BREAKPOINT);
    const { getByTestId } = render(
      <RoleTabsShell navItems={navItems} roleName="Admin" avatarFallback="A" />,
    );
    expect(getByTestId('tabs')).toBeTruthy();
    // Sidebar collapse chevron only renders in desktop mode.
    expect(getByTestId('icon-chevron-back')).toBeTruthy();
  });
});
