import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { DataService, DashboardStats, ActivityLog } from '@/services/dataService';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const { user } = useAuthStore();
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
    } finally {
      setLoading(false);
    }
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
        <Text>Failed to load dashboard</Text>
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
            <StatsCard
              title="Total Staff"
              value={stats.totalStaff}
              subtitle={stats.staffTrend}
              icon="people-outline"
              color="#3B82F6"
            />
          </View>
          <View style={styles.statHalf}>
            <StatsCard
              title="Active Schedules"
              value={stats.activeSchedules}
              subtitle={stats.schedulesTrend}
              icon="calendar-outline"
              color="#10B981"
            />
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statHalf}>
            <StatsCard
              title="Notifications Sent"
              value={stats.notificationsSent}
              subtitle={stats.notificationsTrend}
              icon="notifications-outline"
              color="#8B5CF6"
            />
          </View>
          <View style={styles.statHalf}>
            <StatsCard
              title="Documents"
              value={stats.totalDocuments}
              subtitle={stats.documentsTrend}
              icon="document-text-outline"
              color="#F59E0B"
            />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Left Column - Quick Actions & Analytics */}
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
                <BarChart
                  data={{
                    labels: stats.chartData.map(d => d.name),
                    datasets: [{
                      data: stats.chartData.map(d => d.active),
                    }],
                  }}
                  width={Dimensions.get('window').width - 80}
                  height={160}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: { borderRadius: 16 },
                    barPercentage: 0.5,
                  }}
                  style={{ marginVertical: 8, borderRadius: 16 }}
                  showValuesOnTopOfBars
                  withInnerLines={false}
                />
              </View>
            ) : (
              <View style={styles.chartContainer}>
                <Text style={{ color: '#9CA3AF', marginTop: 40 }}>No chart data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Column - Recent Activity */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <Pressable>
              <Text style={styles.viewAllButton}>View All</Text>
            </Pressable>
          </View>
          <View style={styles.activityList}>
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                title={activity.title}
                author={activity.author}
                timestamp={activity.timestamp}
              />
            ))}
          </View>
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
    padding: 16,
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
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statHalf: {
    flex: 1,
  },
  mainContent: {
    gap: 16,
  },
  leftColumn: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
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
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  analyticsHeader: {
    marginBottom: 16,
  },
  chartContainer: {
    height: 180,
    marginTop: 8,
    alignItems: 'center',
  },
  activityCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
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
    marginBottom: 16,
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
});