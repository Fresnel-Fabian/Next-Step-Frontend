import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuthStore } from '@/store/authStore';

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuthStore();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? 'S'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? 'Staff'}</Text>
        <Text style={styles.userRole}>{user?.role ?? 'Staff'}</Text>
      </View>

      {/* Nav Items */}
      <View style={styles.navItems}>
        <DrawerItemList {...props} />
      </View>

      {/* Logout at bottom */}
      <Pressable style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}

export default function StaffLayout() {
  const router = useRouter();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#2563EB' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#2563EB',
        drawerInactiveTintColor: '#6B7280',
        drawerActiveBackgroundColor: '#EFF6FF',
        drawerStyle: {
          backgroundColor: 'white',
          width: 260,
        },
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
        },
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="schedules"
        options={{
          title: 'Schedules',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            router.push('/(shared)/schedules');
          },
        }}
      />
      <Drawer.Screen
        name="documents"
        options={{
          title: 'Documents',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            router.push('/(shared)/documents');
          },
        }}
      />
      <Drawer.Screen
        name="notification"
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            router.push('/(shared)/notification');
          },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            router.push('/(shared)/settings');
          },
        }}
      />
      <Drawer.Screen
        name="polls"
        options={{
          title: 'Polls',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    padding: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    color: '#BFDBFE',
    textTransform: 'capitalize',
  },
  navItems: {
    flex: 1,
    paddingTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },
});