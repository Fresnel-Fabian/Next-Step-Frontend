import { RoleTabsShell, type RoleNavItem } from '@/components/layout/RoleTabsShell';

const NAV_ITEMS: RoleNavItem[] = [
  {
    segment: 'dashboard',
    label: 'Home',
    tabShort: 'Home',
    icon: 'grid-outline',
    route: '/(staff)/dashboard',
  },
  {
    segment: 'polls',
    label: 'Polls',
    tabShort: 'Polls',
    icon: 'bar-chart-outline',
    route: '/(staff)/polls',
  },
  {
    segment: 'schedules',
    label: 'Schedules',
    tabShort: 'Plan',
    icon: 'calendar-outline',
    route: '/(staff)/schedules',
  },
  {
    segment: 'documents',
    label: 'Documents',
    tabShort: 'Docs',
    icon: 'document-text-outline',
    route: '/(staff)/documents',
  },
  {
    segment: 'notification',
    label: 'Notifications',
    tabShort: 'Alerts',
    icon: 'notifications-outline',
    route: '/(staff)/notification',
  },
  {
    segment: 'settings',
    label: 'Settings',
    tabShort: 'Settings',
    icon: 'settings-outline',
    route: '/(staff)/settings',
  },
];

export default function StaffLayout() {
  return (
    <RoleTabsShell
      navItems={NAV_ITEMS}
      roleName="Staff"
      avatarFallback="S"
    />
  );
}
