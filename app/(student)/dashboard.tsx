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
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [schedules, setSchedules] = useState<ScheduleDTO[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

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
    } finally { setVoting(false); }
  };

  const handleDismissActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleClearAll = () => {
    setActivities([]);
    Toast.show({ type: 'success', text1: 'Activity cleared', position: 'top', visibilityTime: 1500 });
  };

  if (loading) {
    return <View style={s.loading}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const totalClasses = schedules.reduce((a, s) => a + s.classCount, 0);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting}, {firstName}</Text>
          <Text style={s.subtitle}>{user?.department || 'Student Dashboard'}</Text>
        </View>
        <View style={s.headerBadge}>
          <Ionicons name="school" size={20} color="#2563EB" />
        </View>
      </View>

      {/* Overview Cards */}
      <View style={s.overviewRow}>
        <Pressable style={[s.overviewCard, { backgroundColor: '#EFF6FF' }]} onPress={() => router.push('/(student)/schedules')}>
          <View style={[s.overviewIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="calendar" size={22} color="#2563EB" />
          </View>
          <Text style={s.overviewValue}>{totalClasses}</Text>
          <Text style={s.overviewLabel}>Classes</Text>
        </Pressable>

        <Pressable style={[s.overviewCard, { backgroundColor: '#F0FDF4' }]} onPress={() => router.push('/(student)/documents')}>
          <View style={[s.overviewIcon, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="document-text" size={22} color="#16A34A" />
          </View>
          <Text style={[s.overviewValue, { color: '#16A34A' }]}>{schedules.length}</Text>
          <Text style={s.overviewLabel}>Schedules</Text>
        </Pressable>

        <Pressable style={[s.overviewCard, { backgroundColor: '#FDF4FF' }]} onPress={() => router.push('/(student)/notification')}>
          <View style={[s.overviewIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="notifications" size={22} color="#9333EA" />
          </View>
          <Text style={[s.overviewValue, { color: '#9333EA' }]}>{activities.length}</Text>
          <Text style={s.overviewLabel}>Updates</Text>
        </Pressable>
      </View>

      {/* Quick Actions */}
      <View style={s.quickRow}>
        <Pressable style={s.quickBtn} onPress={() => router.push('/(student)/polls')}>
          <View style={[s.quickIcon, { backgroundColor: '#2563EB' }]}>
            <Ionicons name="bar-chart" size={24} color="#fff" />
          </View>
          <View style={s.quickText}>
            <Text style={s.quickTitle}>Vote on Polls</Text>
            <Text style={s.quickSub}>{activePoll ? '1 active poll' : 'No active polls'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        <Pressable style={s.quickBtn} onPress={() => router.push('/(student)/schedules')}>
          <View style={[s.quickIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="calendar" size={24} color="#fff" />
          </View>
          <View style={s.quickText}>
            <Text style={s.quickTitle}>My Schedules</Text>
            <Text style={s.quickSub}>{schedules.length} active</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Active Poll */}
      {activePoll ? (
        <View style={s.pollCard}>
          <View style={s.pollHeader}>
            <View style={s.pollBadge}>
              <View style={s.liveDot} />
              <Text style={s.pollBadgeText}>Live Poll</Text>
            </View>
            <Pressable onPress={() => router.push('/(student)/polls')}>
              <Text style={s.seeAll}>See all</Text>
            </Pressable>
          </View>
          <Text style={s.pollQuestion}>{activePoll.title}</Text>
          {activePoll.description ? <Text style={s.pollDesc}>{activePoll.description}</Text> : null}

          <View style={s.pollOptions}>
            {activePoll.options.map(opt => {
              const sel = selectedOption === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[s.pollOpt, sel && !hasVoted && s.pollOptSel, hasVoted && s.pollOptVoted]}
                  onPress={() => !hasVoted && setSelectedOption(opt.id)}
                  disabled={hasVoted}
                >
                  <View style={s.pollOptInner}>
                    {!hasVoted && (
                      <View style={[s.radio, sel && s.radioSel]}>
                        {sel && <View style={s.radioDot} />}
                      </View>
                    )}
                    <Text style={[s.pollOptText, sel && !hasVoted && s.pollOptTextSel]}>{opt.text}</Text>
                    {hasVoted && <Text style={s.pollPct}>{opt.percentage}%</Text>}
                  </View>
                  {hasVoted && (
                    <View style={s.progressBg}>
                      <View style={[s.progressFill, { width: `${opt.percentage}%` }]} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {hasVoted ? (
            <View style={s.votedBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={s.votedText}>You voted · {activePoll.totalVotes} total votes</Text>
            </View>
          ) : (
            <Pressable
              style={[s.voteBtn, (!selectedOption || voting) && s.voteBtnOff]}
              onPress={handleVote}
              disabled={!selectedOption || voting}
            >
              {voting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.voteBtnText}>Submit Vote</Text>
              }
            </Pressable>
          )}
        </View>
      ) : (
        <View style={s.noPoll}>
          <Ionicons name="bar-chart-outline" size={36} color="#D1D5DB" />
          <Text style={s.noPollTitle}>No active polls</Text>
          <Text style={s.noPollSub}>Check back later for new polls</Text>
        </View>
      )}

      {/* Recent Activity */}
      <View style={s.actCard}>
        <View style={s.actHeader}>
          <View style={s.actTitleRow}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={s.actTitle}>Recent Activity</Text>
          </View>
          {activities.length > 0 && (
            <Pressable onPress={handleClearAll} style={s.clearBtn}>
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text style={s.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>

        {activities.length === 0 ? (
          <View style={s.emptyAct}>
            <Ionicons name="checkmark-circle-outline" size={36} color="#D1D5DB" />
            <Text style={s.emptyActTitle}>All caught up!</Text>
            <Text style={s.emptyActSub}>No recent activity to show</Text>
          </View>
        ) : (
          <View style={s.actList}>
            {activities.slice(0, 5).map(activity => (
              <View key={activity.id} style={s.actRow}>
                <View style={s.actItem}>
                  <ActivityItem
                    title={activity.title}
                    author={activity.author}
                    timestamp={activity.timestamp}
                  />
                </View>
                <Pressable onPress={() => handleDismissActivity(activity.id)} style={s.dismissBtn} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  headerBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },

  // Overview Cards
  overviewRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  overviewCard: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center', gap: 8 },
  overviewIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  overviewValue: { fontSize: 28, fontWeight: '800', color: '#2563EB' },
  overviewLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Quick Actions
  quickRow: { gap: 12, marginBottom: 24 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 18, borderRadius: 14, gap: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  quickIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  quickSub: { fontSize: 13, color: '#9CA3AF' },

  // Poll
  pollCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 22, marginBottom: 24,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  pollHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pollBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  pollBadgeText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  seeAll: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  pollQuestion: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  pollDesc: { fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  pollOptions: { gap: 10, marginBottom: 16 },
  pollOpt: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },
  pollOptSel: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  pollOptVoted: { borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  pollOptInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioSel: { borderColor: '#2563EB' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2563EB' },
  pollOptText: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  pollOptTextSel: { color: '#2563EB', fontWeight: '600' },
  pollPct: { fontSize: 14, color: '#6B7280', fontWeight: '700' },
  progressBg: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: '#2563EB', borderRadius: 3 },
  voteBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  voteBtnOff: { backgroundColor: '#93C5FD' },
  voteBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  votedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 10 },
  votedText: { fontSize: 14, color: '#059669', fontWeight: '600' },

  noPoll: { backgroundColor: '#fff', borderRadius: 16, padding: 32, marginBottom: 24, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  noPollTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  noPollSub: { fontSize: 13, color: '#9CA3AF' },

  // Activity
  actCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 22,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  actHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  actTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FEF2F2', borderRadius: 8 },
  clearText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  actList: { gap: 4 },
  actRow: { flexDirection: 'row', alignItems: 'center' },
  actItem: { flex: 1 },
  dismissBtn: { padding: 6 },
  emptyAct: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyActTitle: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  emptyActSub: { fontSize: 13, color: '#9CA3AF' },
});