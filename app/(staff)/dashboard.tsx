import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { ScheduleItem } from '@/components/dashboard/ScheduleItem';
import { ActivityLog, DataService, StaffScheduleItem } from '@/services/dataService';
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

const POLL_OPTIONS = ['Pizza', 'Salad Bar', 'Pasta'];

export default function StaffDashboard() {
  const { user, logout } = useAuthStore();
  const [schedule, setSchedule] = useState<StaffScheduleItem[]>([]);
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

        {/* Stat Cards — 2×2 grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Today's Shifts</Text>
              <View style={[styles.statIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="calendar" size={18} color="white" />
              </View>
            </View>
            <Text style={styles.statValue}>{schedule.length}</Text>
            <Text style={styles.statSub}>Scheduled today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Starting Soon</Text>
              <View style={[styles.statIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="time" size={18} color="white" />
              </View>
            </View>
            <Text style={styles.statValue}>{soonCount}</Text>
            <Text style={styles.statSub}>In next 30 min</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Notifications</Text>
              <View style={[styles.statIcon, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="notifications" size={18} color="white" />
              </View>
            </View>
            <Text style={styles.statValue}>{activities.length}</Text>
            <Text style={styles.statSub}>Unread</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Documents</Text>
              <View style={[styles.statIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="document-text" size={18} color="white" />
              </View>
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statSub}>Added recently</Text>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {schedule.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>No shifts scheduled today</Text>
            </View>
          ) : (
            schedule.map((item) => (
              <ScheduleItem
                key={item.id}
                time={item.time}
                title={item.title}
                location={item.location}
                isStartingSoon={item.isStartingSoon}
              />
            ))
          )}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {activities.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activities.length} new</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            {activities.slice(0, 3).map((a) => (
              <ActivityItem
                key={a.id}
                title={a.title}
                author={a.author}
                timestamp={a.timestamp}
              />
            ))}
            <Pressable style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Notifications</Text>
              <Ionicons name="chevron-forward" size={14} color="#2563EB" />
            </Pressable>
          </View>
        </View>

        {/* Active Poll */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Poll</Text>
          <View style={styles.card}>
            {/* Poll header */}
            <View style={styles.pollHeader}>
              <View style={styles.pollIconWrap}>
                <Ionicons name="bar-chart" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.pollQuestion}>
                What would you prefer for lunch today?
              </Text>
            </View>

            {/* Options */}
            <View style={styles.pollOptions}>
              {POLL_OPTIONS.map((opt) => {
                const selected = selectedPoll === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.pollOption, selected && styles.pollOptionSelected]}
                    onPress={() => !pollSubmitted && setSelectedPoll(opt)}
                    disabled={pollSubmitted}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.pollOptionText, selected && styles.pollOptionTextSelected]}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {pollSubmitted ? (
              <View style={styles.votedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.votedText}>Vote submitted!</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.submitButton, !selectedPoll && styles.submitButtonDisabled]}
                onPress={() => selectedPoll && setPollSubmitted(true)}
                disabled={!selectedPoll}
              >
                <Text style={styles.submitButtonText}>Submit Vote</Text>
              </Pressable>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  pageHeader: { marginBottom: 20 },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  department: { fontSize: 13, color: '#6B7280' },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    width: '47.5%',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statLabel: { fontSize: 11, color: '#6B7280', flex: 1, marginRight: 6 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  statSub: { fontSize: 11, color: '#9CA3AF' },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },

  // Generic card
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Empty state
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: { fontSize: 13, color: '#9CA3AF' },

  // View all
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  viewAllText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },

  // Poll
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  pollIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  pollOptions: { gap: 10, marginBottom: 16 },
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  pollOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: '#8B5CF6' },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  pollOptionText: { fontSize: 14, color: '#374151' },
  pollOptionTextSelected: { color: '#7C3AED', fontWeight: '600' },
  submitButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#C4B5FD' },
  submitButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  votedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  votedText: { fontSize: 14, color: '#10B981', fontWeight: '600' },
});