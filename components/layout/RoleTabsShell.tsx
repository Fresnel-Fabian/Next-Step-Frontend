import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { isSidebarRouteActive } from '@/lib/sidebarNav';
import { MOBILE_BREAKPOINT } from '@/lib/breakpoints';

export interface RoleNavItem {
  /** Must match the route file name (e.g. dashboard.tsx → "dashboard") */
  segment: string;
  label: string;
  /** Short label for bottom tab bar */
  tabShort: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 68;

/** Frosted glass overlay (used on top of BlurView) */
const GLASS_TINT = 'rgba(255, 255, 255, 0.48)';
const GLASS_EDGE_TOP = 'rgba(255, 255, 255, 0.65)';
const GLASS_EDGE_BOTTOM = 'rgba(15, 23, 42, 0.08)';

function GlassUnderlay() {
  return (
    <>
      <BlurView intensity={72} tint="light" style={StyleSheet.absoluteFillObject} />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: GLASS_TINT }]}
      />
    </>
  );
}

function MobileGlassTopBar({
  paddingTop,
  children,
}: {
  paddingTop: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.mobileTopGlassOuter}>
      <GlassUnderlay />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: GLASS_EDGE_BOTTOM,
          },
        ]}
      />
      <View style={[styles.mobileTopGlassInner, { paddingTop }]}>{children}</View>
    </View>
  );
}

type RoleTabsShellProps = {
  navItems: RoleNavItem[];
  roleName: string;
  avatarFallback: string;
};

export function RoleTabsShell({ navItems, roleName, avatarFallback }: RoleTabsShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuthStore();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < MOBILE_BREAKPOINT;
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;

  const isActive = (route: string) => isSidebarRouteActive(pathname, route);

  const navigate = (route: string) => {
    router.replace(route as any);
  };

  const SidebarContent = () => (
    <View
      style={[
        styles.sidebar,
        {
          width: sidebarWidth,
          paddingTop: Math.max(16, insets.top + 8),
        },
      ]}
    >
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Ionicons name="school" size={22} color="#fff" />
        </View>
        {!collapsed && <Text style={styles.brandText}>Next Step</Text>}
      </View>

      <Pressable style={styles.collapseBtn} onPress={() => setCollapsed(!collapsed)}>
        <Ionicons
          name={collapsed ? 'chevron-forward' : 'chevron-back'}
          size={18}
          color="#9CA3AF"
        />
      </Pressable>

      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {navItems.map(item => {
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
              {!collapsed && (
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : avatarFallback}
            </Text>
          </View>
          {!collapsed && (
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || roleName}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>
                {roleName}
              </Text>
            </View>
          )}
        </View>
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          {!collapsed && <Text style={styles.logoutText}>Logout</Text>}
        </Pressable>
      </View>
    </View>
  );

  const tabBarBottomPad = Math.max(insets.bottom, 8);

  const notificationItem = navItems.find(i => i.segment === 'notification');
  const settingsItem = navItems.find(i => i.segment === 'settings');
  const dashboardItem = navItems.find(i => i.segment === 'dashboard');

  const notifActive = notificationItem ? isActive(notificationItem.route) : false;
  const settingsActive = settingsItem ? isActive(settingsItem.route) : false;

  return (
    <View style={styles.root}>
      {!isMobile && <SidebarContent />}

      <View
        style={[
          styles.tabsHost,
          !isMobile && { marginLeft: sidebarWidth },
          isMobile && styles.tabsHostColumn,
        ]}
      >
        {isMobile && notificationItem && settingsItem && (
          <MobileGlassTopBar paddingTop={insets.top + 6}>
            {dashboardItem && (
              <Pressable
                onPress={() => navigate(dashboardItem.route)}
                style={styles.mobileLogoCluster}
                accessibilityRole="button"
                accessibilityLabel="Next Step, go to home"
              >
                <View style={styles.brandIcon}>
                  <Ionicons name="school" size={22} color="#fff" />
                </View>
                <Text style={styles.mobileBrandText} numberOfLines={1}>
                  Next Step
                </Text>
              </Pressable>
            )}
            <View style={styles.mobileTopBarSpacer} />
            <Pressable
              onPress={() => navigate(notificationItem.route)}
              style={styles.cornerIconBtn}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons
                name={notifActive ? 'notifications' : 'notifications-outline'}
                size={24}
                color={notifActive ? '#2563EB' : '#374151'}
              />
            </Pressable>
            <Pressable
              onPress={() => navigate(settingsItem.route)}
              style={styles.cornerIconBtn}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Ionicons
                name={settingsActive ? 'settings' : 'settings-outline'}
                size={24}
                color={settingsActive ? '#2563EB' : '#374151'}
              />
            </Pressable>
          </MobileGlassTopBar>
        )}

        <View style={styles.tabsFlex}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#2563EB',
              tabBarInactiveTintColor: '#6B7280',
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
                marginBottom: 2,
              },
              tabBarIconStyle: { marginTop: 4 },
              tabBarStyle: isMobile
                ? {
                    paddingTop: 6,
                    paddingBottom: tabBarBottomPad,
                    paddingHorizontal: 2,
                    minHeight: 52 + tabBarBottomPad,
                    backgroundColor: 'transparent',
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: GLASS_EDGE_TOP,
                    elevation: 0,
                  }
                : {
                    height: 0,
                    minHeight: 0,
                    opacity: 0,
                    overflow: 'hidden',
                  },
              tabBarBackground: isMobile
                ? () => (
                    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                      <BlurView
                        intensity={76}
                        tint="light"
                        style={StyleSheet.absoluteFillObject}
                      />
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          {
                            backgroundColor: GLASS_TINT,
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: GLASS_EDGE_TOP,
                          },
                        ]}
                      />
                    </View>
                  )
                : undefined,
              tabBarItemStyle: {
                paddingVertical: 4,
                minHeight: 48,
              },
              tabBarHideOnKeyboard: true,
            }}
          >
            {navItems.map(item => {
              const hideFromTabBar =
                item.segment === 'notification' || item.segment === 'settings';
              return (
                <Tabs.Screen
                  key={item.segment}
                  name={item.segment}
                  options={{
                    title: item.tabShort,
                    tabBarLabel: item.tabShort,
                    tabBarIcon: ({ color, size }) => (
                      <Ionicons name={item.icon} size={size ?? 22} color={color} />
                    ),
                    href: hideFromTabBar ? null : undefined,
                  }}
                />
              );
            })}
          </Tabs>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
  },
  tabsHost: {
    flex: 1,
  },
  tabsHostColumn: {
    flexDirection: 'column',
  },
  tabsFlex: {
    flex: 1,
    minHeight: 0,
  },
  mobileTopGlassOuter: {
    overflow: 'hidden',
    zIndex: 10,
  },
  mobileTopGlassInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  mobileTopBarSpacer: {
    flex: 1,
  },
  cornerIconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  mobileLogoCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 8,
    maxWidth: 170,
    flexShrink: 0,
  },
  mobileBrandText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flexShrink: 1,
  },
  sidebar: {
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
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
});
