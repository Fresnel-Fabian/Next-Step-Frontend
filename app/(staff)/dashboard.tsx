import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { useDashboardCompact } from '@/lib/dashboardResponsive';
import { ActivityLog, DashboardStats, DataService } from '@/services/dataService';
import { useLogout, useUser } from '@/store/authStore';
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
  const user = useUser();
  const logout = useLogout();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        DataService.getDashboardStats(),
        DataService.getRecentActivity(),
      ]);
      setStats(statsData);
      setActivities(activityData);
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

          <View style={[styles.analyticsCard, { padding: cardPadding }]}>
            <View style={styles.analyticsHeader}>
              <View style={styles.actionHeader}>
                <View style={[styles.actionIcon, { backgroundColor: '#FED7AA' }]}>
                  <Ionicons name="bar-chart-outline" size={isCompact ? 22 : 24} color="#F59E0B" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Analytics</Text>
                  <Text style={styles.actionSubtitle}>Activity overview</Text>
                </View>
              </View>
            </View>

            {stats.chartData && stats.chartData.length > 0 ? (
              <View style={[styles.chartContainer, isCompact && styles.chartContainerCompact]}>
                <Text style={{ color: '#9CA3AF' }}>Chart loaded</Text>
              </View>
            ) : (
              <View style={[styles.chartContainer, isCompact && styles.chartContainerCompact]}>
                <Text style={{ color: '#9CA3AF', marginTop: 40 }}>No chart data available</Text>
              </View>
            )}
          </View>
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
  analyticsCard: {
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
  analyticsHeader: {
    marginBottom: 20,
  },
  chartContainer: {
    height: 180,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainerCompact: {
    height: 140,
    marginTop: 4,
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
