import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { ActivityLog, DataService, Poll, ScheduleDTO } from '@/services/dataService';
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

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [schedules, setSchedules] = useState<ScheduleDTO[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activityData, pollData, scheduleData] = await Promise.all([
        DataService.getRecentActivity(),
        DataService.getPolls('active'),
        DataService.getSchedules(),
      ]);
      setActivities(activityData);
      setActivePoll(pollData.length > 0 ? pollData[0] : null);
      setSchedules(scheduleData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!activePoll || selectedOption === null) return;
    try {
      setVoting(true);
      await DataService.votePoll(activePoll.id, selectedOption);
      setHasVoted(true);
      Toast.show({ type: 'success', text1: 'Vote submitted!', text2: 'Thanks for participating', position: 'top', visibilityTime: 2000 });
      const updated = await DataService.getPolls('active');
      setActivePoll(updated.length > 0 ? updated[0] : null);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('already voted')) {
        setHasVoted(true);
        Toast.show({ type: 'info', text1: 'Already voted', position: 'top', visibilityTime: 2000 });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to submit vote', position: 'top', visibilityTime: 2000 });
      }
    } finally {
      setVoting(false);
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

  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning, {firstName}</Text>
          <Text style={styles.department}>{user?.department || 'Student'}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#6B7280" />
        </Pressable>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={[styles.quickActionButton, { backgroundColor: '#2563EB' }]}
          onPress={() => router.push('/(student)/polls')}
        >
          <Ionicons name="bar-chart" size={28} color="white" />
          <Text style={styles.quickActionText}>Vote on Polls</Text>
        </Pressable>
        <Pressable
          style={[styles.quickActionButton, { backgroundColor: '#8B5CF6' }]}
          onPress={() => router.push('/(student)/notification')}
        >
          <Ionicons name="notifications" size={28} color="white" />
          <Text style={styles.quickActionText}>Notifications</Text>
        </Pressable>
      </View>

      {/* Active Poll Widget */}
      {activePoll ? (
        <View style={styles.pollCard}>
          <View style={styles.pollCardHeader}>
            <View style={styles.activeDot} />
            <Text style={styles.pollCardLabel}>Active Poll</Text>
            <Pressable onPress={() => router.push('/(student)/polls')}>
              <Text style={styles.viewAllText}>See all</Text>
            </Pressable>
          </View>
          <Text style={styles.pollQuestion}>{activePoll.title}</Text>
          {activePoll.description && <Text style={styles.pollDesc}>{activePoll.description}</Text>}
          <View style={styles.pollOptions}>
            {activePoll.options.map(opt => {
              const isSelected = selectedOption === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.pollOption,
                    isSelected && !hasVoted && styles.pollOptionSelected,
                    hasVoted && styles.pollOptionVoted,
                  ]}
                  onPress={() => !hasVoted && setSelectedOption(opt.id)}
                  disabled={hasVoted}
                >
                  <View style={styles.pollOptionInner}>
                    {!hasVoted && (
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    )}
                    <Text style={[styles.pollOptionText, isSelected && !hasVoted && styles.pollOptionTextSelected]}>
                      {opt.text}
                    </Text>
                    {hasVoted && <Text style={styles.pollOptionPct}>{opt.percentage}%</Text>}
                  </View>
                  {hasVoted && (
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${opt.percentage}%` }]} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          {hasVoted ? (
            <View style={styles.votedBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.votedText}>You voted · {activePoll.totalVotes} total votes</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.voteBtn, (!selectedOption || voting) && styles.voteBtnDisabled]}
              onPress={handleVote}
              disabled={!selectedOption || voting}
            >
              {voting ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.voteBtnText}>Submit Vote</Text>}
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.noPollCard}>
          <Ionicons name="bar-chart-outline" size={32} color="#D1D5DB" />
          <Text style={styles.noPollText}>No active polls right now</Text>
          <Text style={styles.noPollSub}>Check back later</Text>
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
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
          <View>
            {activities.slice(0, 4).map(activity => (
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  department: { fontSize: 14, color: '#6B7280' },
  logoutButton: { padding: 8 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickActionButton: { flex: 1, padding: 20, borderRadius: 12, alignItems: 'center', gap: 8, height: 100 },
  quickActionText: { color: 'white', fontSize: 13, fontWeight: '600' },
  pollCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  pollCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  pollCardLabel: { fontSize: 12, color: '#059669', fontWeight: '600', flex: 1 },
  viewAllText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  pollQuestion: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  pollDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  pollOptions: { gap: 8, marginBottom: 14 },
  pollOption: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, overflow: 'hidden' },
  pollOptionSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  pollOptionVoted: { borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  pollOptionInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#2563EB' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  pollOptionText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  pollOptionTextSelected: { color: '#2563EB', fontWeight: '600' },
  pollOptionPct: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  progressBg: { height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#2563EB', borderRadius: 2 },
  voteBtn: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  voteBtnDisabled: { backgroundColor: '#93C5FD' },
  voteBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  votedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', padding: 10, borderRadius: 8 },
  votedText: { fontSize: 13, color: '#059669', fontWeight: '500' },
  noPollCard: { backgroundColor: 'white', borderRadius: 12, padding: 24, marginBottom: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  noPollText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  noPollSub: { fontSize: 13, color: '#9CA3AF' },
  activityCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  clearAllButton: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityItemContainer: { flex: 1 },
  dismissBtn: { padding: 8 },
  emptyActivity: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyActivityText: { fontSize: 13, color: '#9CA3AF' },
  noActivity: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
});