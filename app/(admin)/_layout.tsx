import { RoleTabsShell, type RoleNavItem } from '@/components/layout/RoleTabsShell';

const NAV_ITEMS: RoleNavItem[] = [
  {
    segment: 'dashboard',
    label: 'Dashboard',
    tabShort: 'Home',
    icon: 'grid-outline',
    route: '/(admin)/dashboard',
  },
  {
    segment: 'schedules',
    label: 'Schedules',
    tabShort: 'Plan',
    icon: 'calendar-outline',
    route: '/(admin)/schedules',
  },
  {
    segment: 'documents',
    label: 'Documents',
    tabShort: 'Docs',
    icon: 'document-text-outline',
    route: '/(admin)/documents',
  },
  {
    segment: 'announcements',
    label: 'Announcements',
    tabShort: 'News',
    icon: 'megaphone-outline',
    route: '/(admin)/announcements',
  },
  {
    segment: 'polls',
    label: 'Polls',
    tabShort: 'Polls',
    icon: 'bar-chart-outline',
    route: '/(admin)/polls',
  },
  {
    segment: 'notification',
    label: 'Notifications',
    tabShort: 'Alerts',
    icon: 'notifications-outline',
    route: '/(admin)/notification',
  },
  {
    segment: 'settings',
    label: 'Settings',
    tabShort: 'Settings',
    icon: 'settings-outline',
    route: '/(admin)/settings',
  },
];

export default function AdminLayout() {
  return (
    <RoleTabsShell
      navItems={NAV_ITEMS}
      roleName="Admin"
      avatarFallback="A"
    />
  );
}
