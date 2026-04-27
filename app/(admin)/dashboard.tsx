import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useDashboardCompact } from '@/lib/dashboardResponsive';
import { ActivityLog, DashboardStats, DataService } from '@/services/dataService';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
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

export default function AdminDashboard() {
  const { user } = useAuthStore();
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
      Toast.show({
        type: 'success',
        text1: 'Dashboard Updated',
        text2: 'Latest data loaded successfully',
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Data',
        text2: 'Please check your connection and try again',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismissActivity = async (id: string) => {
    try {
      await DataService.deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete activity' });
    }
  };

  const handleClearAll = async () => {
    try {
      await DataService.deleteAllActivity();
      setActivities([]);
      Toast.show({ type: 'success', text1: 'Activity cleared', position: 'top', visibilityTime: 1500 });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to clear activity' });
    }
  };

  const handleRefresh = () => {
    Toast.show({ type: 'info', text1: 'Refreshing Dashboard', text2: 'Getting latest data...', position: 'top', visibilityTime: 1500 });
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={contentPad}>
      {/* Header */}
      <View style={[styles.header, { marginBottom: sectionGap }]}>
        <View style={isCompact ? styles.headerTextBlock : undefined}>
          <Text style={[styles.greeting, { fontSize: greetingFontSize }]}>Admin Dashboard</Text>
          <Text style={[styles.subGreeting, { fontSize: secondaryFontSize }]}>
            Welcome back, {user?.name || 'Administrator'}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={[styles.statsGrid, { marginBottom: sectionGap }]}>
        {isCompact ? (
          <View style={styles.statsStack}>
            <StatsCard title="Teachers" value={stats.totalTeachers} subtitle={stats.teachersTrend} icon="people-outline" color="#7C3AED" compact />
            <StatsCard title="Students" value={stats.totalStudents} subtitle={stats.studentsTrend} icon="school-outline" color="#2563EB" compact />
            <StatsCard title="Active Schedules" value={stats.activeSchedules} subtitle={stats.schedulesTrend} icon="calendar-outline" color="#10B981" compact />
            <StatsCard title="Active Polls" value={stats.activePolls} subtitle={stats.pollsTrend} icon="bar-chart-outline" color="#F59E0B" compact />
          </View>
        ) : (
          <>
            <View style={styles.statRow}>
              <View style={styles.statHalf}>
                <StatsCard title="Teachers" value={stats.totalTeachers} subtitle={stats.teachersTrend} icon="people-outline" color="#7C3AED" />
              </View>
              <View style={styles.statHalf}>
                <StatsCard title="Students" value={stats.totalStudents} subtitle={stats.studentsTrend} icon="school-outline" color="#2563EB" />
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statHalf}>
                <StatsCard title="Active Schedules" value={stats.activeSchedules} subtitle={stats.schedulesTrend} icon="calendar-outline" color="#10B981" />
              </View>
              <View style={styles.statHalf}>
                <StatsCard title="Active Polls" value={stats.activePolls} subtitle={stats.pollsTrend} icon="bar-chart-outline" color="#F59E0B" />
              </View>
            </View>
          </>
        )}
      </View>

      {/* Recent Activity */}
      <View style={[styles.activityCard, { padding: cardPadding }]}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {activities.length > 0 && (
            <Pressable onPress={handleClearAll}>
              <Text style={styles.clearAllButton}>Clear All</Text>
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
            {activities.map((activity) => (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTextBlock: { flex: 1, minWidth: 0 },
  greeting: { fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  subGreeting: { color: '#6B7280' },
  statsGrid: {},
  statsStack: { gap: 12 },
  statRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statHalf: { flex: 1 },
  activityCard: {
    backgroundColor: 'white', borderRadius: 14, borderWidth: 1,
    borderColor: '#F3F4F6', shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 2, elevation: 2,
  },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  activityTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  activityList: { gap: 0 },
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