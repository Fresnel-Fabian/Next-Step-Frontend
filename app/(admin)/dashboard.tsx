import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { ScheduleItem } from '@/components/dashboard/ScheduleItem';
import { ActivityLog, DataService, StaffScheduleItem } from '@/services/dataService';
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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [schedule, setSchedule] = useState<StaffScheduleItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [scheduleData, activityData] = await Promise.all([
        DataService.getTodaySchedule(),
        DataService.getRecentActivity(),
      ]);
      setSchedule(scheduleData);
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

  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning, {firstName}</Text>
          <Text style={styles.department}>{user?.department || 'Administrator'}</Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutButton}>
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

      {/* Today's Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleList}>
          {schedule.map((item) => (
            <ScheduleItem
              key={item.id}
              time={item.time}
              title={item.title}
              location={item.location}
              isStartingSoon={item.isStartingSoon}
            />
          ))}
        </View>
      </View>

      {/* Notifications Widget */}
      <View style={styles.notificationsCard}>
        <View style={styles.notificationsHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>2 new</Text>
          </View>
        </View>
        <View style={styles.notificationsList}>
          {activities.slice(0, 2).map((activity) => (
            <ActivityItem
              key={activity.id}
              title={activity.title}
              author={activity.author}
              timestamp={activity.timestamp}
            />
          ))}
        </View>
        <Pressable style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View All Notifications</Text>
        </Pressable>
      </View>

      {/* Active Poll Widget */}
      <View style={styles.pollCard}>
        <Text style={styles.sectionTitle}>Active Poll</Text>
        <Text style={styles.pollQuestion}>What would you prefer for lunch today?</Text>

        <View style={styles.pollOptions}>
          {['Pizza', 'Salad Bar', 'Pasta'].map((option) => (
            <Pressable key={option} style={styles.pollOption}>
              <View style={styles.radioButton} />
              <Text style={styles.pollOptionText}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit Vote</Text>
        </Pressable>
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
  department: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 112,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  scheduleList: {
    gap: 0,
  },
  notificationsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  notificationsList: {
    marginBottom: 16,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  pollCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pollQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 16,
  },
  pollOptions: {
    gap: 12,
    marginBottom: 20,
  },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  pollOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
