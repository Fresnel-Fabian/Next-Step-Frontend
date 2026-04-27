import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { useDashboardCompact } from '@/lib/dashboardResponsive';
import { ActivityLog, DashboardStats, DataService } from '@/services/dataService';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

export default function StaffDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    isCompact,
    contentPaddingX,
    contentPaddingY,
    greetingFontSize,
    secondaryFontSize,
    cardPadding,
    sectionGap,
  } = useDashboardCompact();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [activePollsCount, setActivePollsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activityData, schedules, polls, notifications] = await Promise.all([
        DataService.getDashboardStats(),
        DataService.getRecentActivity(),
        DataService.getSchedules().catch(() => []),
        DataService.getPolls('active').catch(() => []),
        DataService.getNotifications().catch(() => []),
      ]);
      setStats(statsData);
      setActivities(activityData);

      // Upcoming classes — schedule events from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = (schedules || []).filter((s: any) => {
        const dateStr = s.startDate || s.start_date || s.date;
        if (!dateStr) return false;
        const scheduleDate = new Date(dateStr);
        return scheduleDate >= today;
      });
      setUpcomingCount(upcoming.length);

      // Active polls
      setActivePollsCount(polls?.length || 0);

      // Unread notifications
      const unread = (notifications || []).filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load dashboard',
        text2: 'Please check your connection and try again',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismissActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleClearAll = () => {
    setActivities([]);
    Toast.show({ type: 'success', text1: 'Activity cleared', position: 'top', visibilityTime: 1500 });
  };

  const handleLogout = () => {
    Toast.show({ type: 'info', text1: 'Logging out', text2: 'See you soon!', position: 'top', visibilityTime: 1500 });
    setTimeout(() => logout(), 500);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load dashboard</Text>
        <Pressable onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const contentPad = {
    paddingHorizontal: contentPaddingX,
    paddingVertical: contentPaddingY,
    paddingBottom: contentPaddingY + 8,
  };

  const deptLine = user?.department ? ` · ${user.department}` : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={contentPad}>
      <View style={[styles.header, { marginBottom: sectionGap }]}>
        <View style={isCompact ? styles.headerTextBlock : styles.headerMain}>
          <Text style={[styles.greeting, { fontSize: greetingFontSize }]}>Staff Dashboard</Text>
          <Text style={[styles.subGreeting, { fontSize: secondaryFontSize }]}>
            Welcome back, {user?.name || 'Staff'}
            {deptLine}
          </Text>
        </View>
        {!isCompact && (
          <Pressable onPress={handleLogout} style={styles.logoutButton} hitSlop={8}>
            <Ionicons name="log-out-outline" size={22} color="#6B7280" />
          </Pressable>
        )}
      </View>

      {/* ✅ NEW: Three real stats row */}
      <View style={[styles.statsRow, { marginBottom: sectionGap, gap: isCompact ? 8 : 12 }]}>
        <View style={[styles.statCard, { padding: isCompact ? 12 : 16 }]}>
          <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="calendar-outline" size={18} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Upcoming Classes</Text>
        </View>
        <View style={[styles.statCard, { padding: isCompact ? 12 : 16 }]}>
          <View style={[styles.statIcon, { backgroundColor: '#FED7AA' }]}>
            <Ionicons name="bar-chart-outline" size={18} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{activePollsCount}</Text>
          <Text style={styles.statLabel}>Active Polls</Text>
        </View>
        <View style={[styles.statCard, { padding: isCompact ? 12 : 16 }]}>
          <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="notifications-outline" size={18} color="#2563EB" />
          </View>
          <Text style={styles.statValue}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>

      <View style={[styles.mainContent, { gap: isCompact ? 16 : 20 }]}>
        <View style={[styles.leftColumn, { gap: isCompact ? 16 : 20 }]}>
          <Pressable
            style={[styles.actionCard, { padding: cardPadding }]}
            onPress={() => router.push('/(staff)/schedules')}
          >
            <View style={styles.actionHeader}>
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="calendar-outline" size={isCompact ? 22 : 24} color="#10B981" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>My schedule</Text>
                <Text style={styles.actionSubtitle}>View and manage your calendar</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

          <Pressable
            style={[styles.actionCard, { padding: cardPadding }]}
            onPress={() => router.push('/(staff)/documents')}
          >
            <View style={styles.actionHeader}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="document-text-outline" size={isCompact ? 22 : 24} color="#2563EB" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Documents</Text>
                <Text style={styles.actionSubtitle}>Policies, files, and resources</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

        </View>

        <View style={[styles.activityCard, { padding: cardPadding }]}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent activity</Text>
            {activities.length > 0 && (
              <Pressable onPress={handleClearAll}>
                <Text style={styles.clearAllButton}>Clear all</Text>
              </Pressable>
            )}
          </View>

          {activities.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyActivityText}>No recent activity</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {activities.map(activity => (
                <View key={activity.id} style={styles.activityRow}>
                  <View style={styles.activityItemContainer}>
                    <ActivityItem
                      title={activity.title}
                      author={activity.author}
                      timestamp={activity.timestamp}
                    />
                  </View>
                  <Pressable onPress={() => handleDismissActivity(activity.id)} style={styles.dismissBtn}>
                    <Ionicons name="close" size={16} color="#9CA3AF" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  subGreeting: {
    color: '#6B7280',
  },
  logoutButton: {
    padding: 8,
  },
  // ✅ NEW stats row styles
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  mainContent: {
    gap: 20,
  },
  leftColumn: {
    gap: 20,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  activityList: {
    gap: 0,
  },
  clearAllButton: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityItemContainer: { flex: 1 },
  dismissBtn: { padding: 8 },
  emptyActivity: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyActivityText: { fontSize: 13, color: '#9CA3AF' },
  errorText: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  retryButton: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: 'white', fontSize: 14, fontWeight: '600' },
});