import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { ActivityLog, DataService } from '@/services/dataService';
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

const POLL_OPTIONS = ['Pizza', 'Salad Bar', 'Pasta'];

export default function StaffDashboard() {
  const { user, logout } = useAuthStore();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [pollSubmitted, setPollSubmitted] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const activityData = await DataService.getRecentActivity();
      setActivities(activityData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Dismiss a single activity
  const handleDismissActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  // ✅ Clear all activities
  const handleClearAll = () => {
    setActivities([]);
    Toast.show({ type: 'success', text1: 'Activity cleared', position: 'top', visibilityTime: 1500 });
  };

  const handleLogout = () => {
    Toast.show({ type: 'info', text1: 'Logging Out', text2: 'See you soon!', position: 'top', visibilityTime: 1500 });
    setTimeout(() => logout(), 500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Staff';
  const soonCount = schedule.filter((s) => s.isStartingSoon).length;

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.greeting}>Good Morning, {firstName} 👋</Text>
          <Text style={styles.department}>{user?.department || 'Staff Member'}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#6B7280" />
        </Pressable>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActions}>
        <Pressable style={[styles.quickActionButton, { backgroundColor: '#3B82F6' }]}>
          <Ionicons name="calendar" size={32} color="white" />
          <Text style={styles.quickActionText}>My Schedule</Text>
        </Pressable>
        <Pressable style={[styles.quickActionButton, { backgroundColor: '#10B981' }]}>
          <Ionicons name="document-text" size={32} color="white" />
          <Text style={styles.quickActionText}>Documents</Text>
        </Pressable>
      </View>

      {/* Notifications Widget */}
      <View style={styles.notificationsCard}>
        <View style={styles.notificationsHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
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
          <View style={styles.notificationsList}>
            {activities.slice(0, 4).map((activity) => (
              // ✅ Each item with dismiss button
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  department: { fontSize: 14, color: '#6B7280' },
  logoutButton: { padding: 8 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickActionButton: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, height: 112 },
  quickActionText: { color: 'white', fontSize: 14, fontWeight: '600' },
  notificationsCard: {
    backgroundColor: 'white', padding: 20, borderRadius: 12,
    borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  notificationsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  clearAllButton: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  notificationsList: { gap: 0 },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityItemContainer: { flex: 1 },
  dismissBtn: { padding: 8 },
  emptyActivity: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyActivityText: { fontSize: 13, color: '#9CA3AF' },
});