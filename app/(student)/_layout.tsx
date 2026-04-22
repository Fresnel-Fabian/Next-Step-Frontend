import { RoleTabsShell, type RoleNavItem } from '@/components/layout/RoleTabsShell';

const NAV_ITEMS: RoleNavItem[] = [
  {
    segment: 'dashboard',
    label: 'Home',
    tabShort: 'Home',
    icon: 'grid-outline',
    route: '/(student)/dashboard',
  },
  {
    segment: 'polls',
    label: 'Polls',
    tabShort: 'Polls',
    icon: 'bar-chart-outline',
    route: '/(student)/polls',
  },
  {
    segment: 'schedules',
    label: 'Schedules',
    tabShort: 'Plan',
    icon: 'calendar-outline',
    route: '/(student)/schedules',
  },
  {
    segment: 'documents',
    label: 'Documents',
    tabShort: 'Docs',
    icon: 'document-text-outline',
    route: '/(student)/documents',
  },
  {
    segment: 'notification',
    label: 'Notifications',
    tabShort: 'Alerts',
    icon: 'notifications-outline',
    route: '/(student)/notification',
  },
  {
    segment: 'settings',
    label: 'Settings',
    tabShort: 'Settings',
    icon: 'settings-outline',
    route: '/(student)/settings',
  },
];

export default function StudentLayout() {
  return (
    <RoleTabsShell
      navItems={NAV_ITEMS}
      roleName="Student"
      avatarFallback="S"
    />
  );
}
