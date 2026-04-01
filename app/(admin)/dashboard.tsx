import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { StatsCard } from '@/components/dashboard/StatsCard';
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
  const { user, logout } = useAuthStore();
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

  // Dismiss a single activity item from the feed
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
  const handleLogout = () => {
    Toast.show({ type: 'info', text1: 'Logging Out', text2: 'See you soon!', position: 'top', visibilityTime: 2000 });
    setTimeout(() => logout(), 500);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.subGreeting}>Welcome back, {user?.name || 'Administrator'}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <View style={styles.statHalf}>
            <StatsCard title="Total Staff" value={stats.totalStaff} subtitle={stats.staffTrend} icon="people-outline" color="#3B82F6" />
          </View>
          <View style={styles.statHalf}>
            <StatsCard title="Active Schedules" value={stats.activeSchedules} subtitle={stats.schedulesTrend} icon="calendar-outline" color="#10B981" />
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statHalf}>
            <StatsCard title="Notifications Sent" value={stats.notificationsSent} subtitle={stats.notificationsTrend} icon="notifications-outline" color="#8B5CF6" />
          </View>
          <View style={styles.statHalf}>
            <StatsCard title="Documents" value={stats.totalDocuments} subtitle={stats.documentsTrend} icon="document-text-outline" color="#F59E0B" />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <View style={styles.leftColumn}>
          {/* Documents Card */}
          <Pressable style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="document-text" size={24} color="#10B981" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Documents</Text>
                <Text style={styles.actionSubtitle}>48 files pending review</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

          {/* Analytics Card */}
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <View style={styles.actionHeader}>
                <View style={[styles.actionIcon, { backgroundColor: '#FED7AA' }]}>
                  <Ionicons name="bar-chart" size={24} color="#F59E0B" />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Analytics</Text>
                  <Text style={styles.actionSubtitle}>Activity stats</Text>
                </View>
              </View>
            </View>

            {/* Chart - with safe guard */}
            {stats.chartData && stats.chartData.length > 0 ? (
              <View style={styles.chartContainer}>
                <Text style={{ color: '#9CA3AF' }}>Chart loaded</Text>
              </View>
            ) : (
              <View style={styles.chartContainer}>
                <Text style={{ color: '#9CA3AF', marginTop: 40 }}>No chart data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            {/* ✅ Clear all button */}
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
                // ✅ Wrap each item with dismiss button
                <View key={activity.id} style={styles.activityRow}>
                  <View style={styles.activityItemContainer}>
                    <ActivityItem
                      title={activity.title}
                      author={activity.author}
                      timestamp={activity.timestamp}
                    />
                  </View>
                  <Pressable
                    onPress={() => handleDismissActivity(activity.id)}
                    style={styles.dismissBtn}
                  >
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
  content: {
    padding: 24,
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
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    marginBottom: 28,
  },
  statRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statHalf: {
    flex: 1,
  },
  mainContent: {
    gap: 20,
  },
  leftColumn: {
    gap: 20,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 24,
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
    padding: 24,
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
  activityCard: {
    backgroundColor: 'white',
    padding: 24,
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
  viewAllButton: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  activityList: {
    gap: 0,
  },
  clearAllButton: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  // ✅ New styles for dismiss
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityItemContainer: { flex: 1 },
  dismissBtn: { padding: 8 },
  emptyActivity: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyActivityText: { fontSize: 13, color: '#9CA3AF' },
  errorText: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  retryButton: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
