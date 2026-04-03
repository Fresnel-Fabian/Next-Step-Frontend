import { Ionicons } from '@expo/vector-icons';
import { Slot, useRouter, usePathname } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: 'grid-outline', route: '/(staff)/dashboard' },
  { label: 'Polls', icon: 'bar-chart-outline', route: '/(staff)/polls' },
  { label: 'Schedules', icon: 'calendar-outline', route: '/(staff)/schedules' },
  { label: 'Documents', icon: 'document-text-outline', route: '/(staff)/documents' },
  { label: 'Notifications', icon: 'notifications-outline', route: '/(staff)/notification' },
  { label: 'Settings', icon: 'settings-outline', route: '/(staff)/settings' },
];

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 68;

export default function StaffLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;
  const [collapsed, setCollapsed] = useState(isMobile);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = collapsed && !mobileOpen ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

  const isActive = (route: string) => {
    const clean = route.replace('/(staff)', '').replace('/(shared)', '');
    return pathname.includes(clean);
  };

  const navigate = (route: string) => {
    router.push(route as any);
    if (isMobile) setMobileOpen(false);
  };

  const SidebarContent = () => (
    <View style={[styles.sidebar, { width: isMobile && mobileOpen ? SIDEBAR_WIDTH : sidebarWidth }]}>
      {/* Logo / Brand */}
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Ionicons name="school" size={22} color="#fff" />
        </View>
        {(!collapsed || mobileOpen) && (
          <Text style={styles.brandText}>Next Step</Text>
        )}
      </View>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <Pressable style={styles.collapseBtn} onPress={() => setCollapsed(!collapsed)}>
          <Ionicons
            name={collapsed ? 'chevron-forward' : 'chevron-back'}
            size={18}
            color="#9CA3AF"
          />
        </Pressable>
      )}

      {/* Nav Items */}
      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.route);
          return (
            <Pressable
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => navigate(item.route)}
            >
              <Ionicons
                name={active ? (item.icon.replace('-outline', '') as any) : item.icon}
                size={20}
                color={active ? '#2563EB' : '#6B7280'}
              />
              {(!collapsed || mobileOpen) && (
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* User / Logout */}
      <View style={styles.sidebarFooter}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </Text>
          </View>
          {(!collapsed || mobileOpen) && (
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Staff'}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>Staff</Text>
            </View>
          )}
        </View>
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          {(!collapsed || mobileOpen) && (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Mobile hamburger */}
      {isMobile && !mobileOpen && (
        <Pressable style={styles.hamburger} onPress={() => setMobileOpen(true)}>
          <Ionicons name="menu" size={24} color="#374151" />
        </Pressable>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <Pressable style={styles.overlay} onPress={() => setMobileOpen(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <SidebarContent />
          </Pressable>
        </Pressable>
      )}

      {/* Desktop sidebar */}
      {!isMobile && <SidebarContent />}

      {/* Main content */}
      <View style={[styles.main, !isMobile && { marginLeft: sidebarWidth }]}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
  },
  sidebar: {
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingTop: 20,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 8,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  collapseBtn: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginBottom: 10,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  navList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  userRole: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
  hamburger: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 40,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 45,
  },
  main: {
    flex: 1,
  },
});