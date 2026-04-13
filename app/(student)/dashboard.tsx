import { ActivityItem } from '@/components/dashboard/ActivityItem';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityLog, DataService, Poll, ScheduleDTO } from '@/services/dataService';
import { useDashboardCompact } from '@/lib/dashboardResponsive';
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
  const {
    isCompact,
    contentPaddingX,
    contentPaddingY,
    greetingFontSize,
    secondaryFontSize,
    cardPadding,
    sectionGap,
  } = useDashboardCompact();
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

  const handleDismissActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleClearAll = () => {
    setActivities([]);
    Toast.show({ type: 'success', text1: 'Activity cleared', position: 'top', visibilityTime: 1500 });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const totalClasses = schedules.reduce((a, sch) => a + sch.classCount, 0);

  const contentPad = {
    paddingHorizontal: contentPaddingX,
    paddingVertical: contentPaddingY,
    paddingBottom: contentPaddingY + 8,
  };

  const statCards = (
    <>
      <Pressable
        onPress={() => router.push('/(student)/schedules')}
        style={isCompact ? styles.statPress : styles.statPressFlex}
      >
        <StatsCard
          title="Classes"
          value={totalClasses}
          subtitle="Across your schedules"
          icon="calendar-outline"
          color="#3B82F6"
          compact={isCompact}
        />
      </Pressable>
      <Pressable
        onPress={() => router.push('/(student)/schedules')}
        style={isCompact ? styles.statPress : styles.statPressFlex}
      >
        <StatsCard
          title="Schedules"
          value={schedules.length}
          subtitle="Active"
          icon="today-outline"
          color="#10B981"
          compact={isCompact}
        />
      </Pressable>
      <Pressable
        onPress={() => router.push('/(student)/notification')}
        style={isCompact ? styles.statPress : styles.statPressFlex}
      >
        <StatsCard
          title="Updates"
          value={activities.length}
          subtitle="Recent items"
          icon="notifications-outline"
          color="#8B5CF6"
          compact={isCompact}
        />
      </Pressable>
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={contentPad}>
      <View style={[styles.header, { marginBottom: sectionGap }]}>
        <View style={isCompact ? styles.headerTextBlock : undefined}>
          <Text style={[styles.greeting, { fontSize: greetingFontSize }]}>
            {greeting}, {firstName}
          </Text>
          <Text style={[styles.subGreeting, { fontSize: secondaryFontSize }]}>
            {user?.department || 'Student Dashboard'}
          </Text>
        </View>
      </View>

      <View style={[styles.statsGrid, { marginBottom: sectionGap }]}>
        {isCompact ? <View style={styles.statsStack}>{statCards}</View> : <View style={styles.statRowThree}>{statCards}</View>}
      </View>

      <View style={[styles.quickColumn, { gap: isCompact ? 12 : 16, marginBottom: sectionGap }]}>
        <Pressable
          style={[styles.actionCard, { padding: cardPadding }]}
          onPress={() => router.push('/(student)/polls')}
        >
          <View style={styles.actionHeader}>
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="bar-chart" size={isCompact ? 22 : 24} color="#2563EB" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Vote on Polls</Text>
              <Text style={styles.actionSubtitle}>{activePoll ? '1 active poll' : 'No active polls'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        <Pressable
          style={[styles.actionCard, { padding: cardPadding }]}
          onPress={() => router.push('/(student)/schedules')}
        >
          <View style={styles.actionHeader}>
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="calendar" size={isCompact ? 22 : 24} color="#10B981" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>My Schedules</Text>
              <Text style={styles.actionSubtitle}>{schedules.length} active</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {activePoll ? (
        <View style={[styles.pollCard, { padding: isCompact ? 16 : 22, marginBottom: sectionGap }]}>
          <View style={styles.pollHeader}>
            <View style={styles.pollBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.pollBadgeText}>Live Poll</Text>
            </View>
            <Pressable onPress={() => router.push('/(student)/polls')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <Text style={[styles.pollQuestion, isCompact && styles.pollQuestionCompact]}>{activePoll.title}</Text>
          {activePoll.description ? (
            <Text style={[styles.pollDesc, isCompact && styles.pollDescCompact]}>{activePoll.description}</Text>
          ) : null}

          <View style={styles.pollOptions}>
            {activePoll.options.map(opt => {
              const sel = selectedOption === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.pollOpt, sel && !hasVoted && styles.pollOptSel, hasVoted && styles.pollOptVoted]}
                  onPress={() => !hasVoted && setSelectedOption(opt.id)}
                  disabled={hasVoted}
                >
                  <View style={styles.pollOptInner}>
                    {!hasVoted && (
                      <View style={[styles.radio, sel && styles.radioSel]}>
                        {sel && <View style={styles.radioDot} />}
                      </View>
                    )}
                    <Text style={[styles.pollOptText, sel && !hasVoted && styles.pollOptTextSel]}>{opt.text}</Text>
                    {hasVoted && <Text style={styles.pollPct}>{opt.percentage}%</Text>}
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
              <Text style={[styles.votedText, isCompact && styles.votedTextCompact]} numberOfLines={2}>
                You voted · {activePoll.totalVotes} total votes
              </Text>
            </View>
          ) : (
            <Pressable
              style={[styles.voteBtn, (!selectedOption || voting) && styles.voteBtnOff]}
              onPress={handleVote}
              disabled={!selectedOption || voting}
            >
              {voting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.voteBtnText}>Submit Vote</Text>}
            </Pressable>
          )}
        </View>
      ) : (
        <View style={[styles.emptyCard, { marginBottom: sectionGap, padding: isCompact ? 24 : 32 }]}>
          <Ionicons name="bar-chart-outline" size={36} color="#D1D5DB" />
          <Text style={styles.emptyCardTitle}>No active polls</Text>
          <Text style={styles.emptyCardSub}>Check back later for new polls</Text>
        </View>
      )}

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
            {activities.slice(0, 5).map(activity => (
              <View key={activity.id} style={styles.activityRow}>
                <View style={styles.activityItemContainer}>
                  <ActivityItem title={activity.title} author={activity.author} timestamp={activity.timestamp} />
                </View>
                <Pressable onPress={() => handleDismissActivity(activity.id)} style={styles.dismissBtn} hitSlop={8}>
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextBlock: { flex: 1, minWidth: 0 },
  greeting: { fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  subGreeting: { color: '#6B7280' },

  statsGrid: {},
  statsStack: { gap: 12 },
  statRowThree: { flexDirection: 'row', gap: 12 },
  statPress: { width: '100%' },
  statPressFlex: { flex: 1, minWidth: 0 },

  quickColumn: {},

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
  actionText: { gap: 2, flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  actionSubtitle: { fontSize: 14, color: '#6B7280' },

  pollCard: {
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
  pollHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  pollBadgeText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  seeAll: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  pollQuestion: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  pollQuestionCompact: { fontSize: 17 },
  pollDesc: { fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  pollDescCompact: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  pollOptions: { gap: 10, marginBottom: 16 },
  pollOpt: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  pollOptSel: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  pollOptVoted: { borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  pollOptInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSel: { borderColor: '#2563EB' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2563EB' },
  pollOptText: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  pollOptTextSel: { color: '#2563EB', fontWeight: '600' },
  pollPct: { fontSize: 14, color: '#6B7280', fontWeight: '700' },
  progressBg: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: '#2563EB', borderRadius: 3 },
  voteBtn: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  voteBtnOff: { backgroundColor: '#93C5FD' },
  voteBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  votedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
  },
  votedText: { fontSize: 14, color: '#059669', fontWeight: '600', flex: 1 },
  votedTextCompact: { fontSize: 13 },

  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyCardTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptyCardSub: { fontSize: 13, color: '#9CA3AF' },

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
  activityTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  clearAllButton: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  activityList: { gap: 0 },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityItemContainer: { flex: 1 },
  dismissBtn: { padding: 8 },
  emptyActivity: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyActivityText: { fontSize: 13, color: '#9CA3AF' },
});
