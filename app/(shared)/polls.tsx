import { DataService, Poll } from '@/services/dataService';
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

export default function StudentPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<number | null>(null); // poll being voted on
  const [selectedOption, setSelectedOption] = useState<Record<number, number>>({}); // pollId -> optionId
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set()); // track voted polls

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const data = await DataService.getPolls();
      setPolls(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load polls' });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: number) => {
    const optionId = selectedOption[pollId];
    if (!optionId) {
      Toast.show({ type: 'error', text1: 'Please select an option first' });
      return;
    }

    try {
      setVotingId(pollId);
      await DataService.votePoll(pollId, optionId);
      setVotedPolls(prev => new Set([...prev, pollId]));
      Toast.show({ type: 'success', text1: 'Vote submitted!', text2: 'Thanks for participating' });
      fetchPolls(); // refresh to get updated percentages
    } catch (e: any) {
      const msg = e?.message || 'Failed to submit vote';
      // Already voted error comes from backend
      if (msg.includes('already voted')) {
        setVotedPolls(prev => new Set([...prev, pollId]));
        Toast.show({ type: 'info', text1: 'Already voted', text2: 'You have already voted on this poll' });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to submit vote' });
      }
    } finally {
      setVotingId(null);
    }
  };

  const activePolls = polls.filter(p => p.isActive);
  const pastPolls = polls.filter(p => !p.isActive);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Polls</Text>
        <Text style={styles.headerSub}>Share your food preferences</Text>
      </View>

      {/* Active Polls */}
      {activePolls.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No active polls</Text>
          <Text style={styles.emptyDesc}>Check back later for new polls from your admin</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Active Polls</Text>
          {activePolls.map(poll => {
            const hasVoted = votedPolls.has(poll.id);
            const selected = selectedOption[poll.id];

            return (
              <View key={poll.id} style={styles.card}>
                {/* Poll header */}
                <View style={styles.cardHeader}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeLabel}>Active</Text>
                  <Text style={styles.timeLeft}>{poll.timeLeft}</Text>
                </View>

                <Text style={styles.pollTitle}>{poll.title}</Text>
                {poll.description && (
                  <Text style={styles.pollDesc}>{poll.description}</Text>
                )}

                {/* Options */}
                <View style={styles.optionsList}>
                  {poll.options.map(opt => {
                    const isSelected = selected === opt.id;
                    const showResult = hasVoted;

                    return (
                      <Pressable
                        key={opt.id}
                        style={[
                          styles.optionBtn,
                          isSelected && !hasVoted && styles.optionBtnSelected,
                          hasVoted && styles.optionBtnVoted,
                        ]}
                        onPress={() => {
                          if (!hasVoted) {
                            setSelectedOption(prev => ({ ...prev, [poll.id]: opt.id }));
                          }
                        }}
                        disabled={hasVoted}
                      >
                        <View style={styles.optionBtnInner}>
                          {/* Selection indicator */}
                          {!hasVoted && (
                            <View style={[styles.radio, isSelected && styles.radioSelected]}>
                              {isSelected && <View style={styles.radioDot} />}
                            </View>
                          )}

                          <Text
                            style={[
                              styles.optionText,
                              isSelected && !hasVoted && styles.optionTextSelected,
                            ]}
                          >
                            {opt.text}
                          </Text>

                          {/* Show vote count after voting */}
                          {showResult && (
                            <Text style={styles.optionPct}>{opt.percentage}%</Text>
                          )}
                        </View>

                        {/* Progress bar (shown after voting) */}
                        {showResult && (
                          <View style={styles.progressBg}>
                            <View
                              style={[styles.progressFill, { width: `${opt.percentage}%` }]}
                            />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Vote button or voted state */}
                {hasVoted ? (
                  <View style={styles.votedBanner}>
                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                    <Text style={styles.votedText}>You voted · {poll.totalVotes} total votes</Text>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.voteBtn, (!selected || votingId === poll.id) && styles.voteBtnDisabled]}
                    onPress={() => handleVote(poll.id)}
                    disabled={!selected || votingId === poll.id}
                  >
                    {votingId === poll.id ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.voteBtnText}>Submit Vote</Text>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Past Polls */}
      {pastPolls.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Past Polls</Text>
          {pastPolls.map(poll => (
            <View key={poll.id} style={[styles.card, styles.cardClosed]}>
              <View style={styles.cardHeader}>
                <View style={styles.closedDot} />
                <Text style={styles.closedLabel}>Closed</Text>
              </View>

              <Text style={styles.pollTitle}>{poll.title}</Text>

              {/* Show results for past polls */}
              <View style={styles.optionsList}>
                {poll.options.map(opt => (
                  <View key={opt.id} style={[styles.optionBtn, styles.optionBtnVoted]}>
                    <View style={styles.optionBtnInner}>
                      <Text style={styles.optionText}>{opt.text}</Text>
                      <Text style={styles.optionPct}>{opt.percentage}%</Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, styles.progressFillClosed, { width: `${opt.percentage}%` }]} />
                    </View>
                  </View>
                ))}
              </View>

              <Text style={styles.totalVotes}>{poll.totalVotes} total votes</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Card
  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  cardClosed: { opacity: 0.85 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  closedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  activeLabel: { fontSize: 12, color: '#059669', fontWeight: '600', flex: 1 },
  closedLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', flex: 1 },
  timeLeft: { fontSize: 12, color: '#6B7280' },

  pollTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  pollDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12 },

  // Options
  optionsList: { gap: 8, marginBottom: 16 },
  optionBtn: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, overflow: 'hidden',
  },
  optionBtnSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  optionBtnVoted: { borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' },
  optionBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: '#2563EB' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB' },
  optionText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  optionTextSelected: { color: '#2563EB', fontWeight: '600' },
  optionPct: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

  // Progress bar
  progressBg: { height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#2563EB', borderRadius: 2 },
  progressFillClosed: { backgroundColor: '#9CA3AF' },

  // Vote button
  voteBtn: {
    backgroundColor: '#2563EB', paddingVertical: 12,
    borderRadius: 10, alignItems: 'center',
  },
  voteBtnDisabled: { backgroundColor: '#93C5FD' },
  voteBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },

  votedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ECFDF5', padding: 10, borderRadius: 8,
  },
  votedText: { fontSize: 13, color: '#059669', fontWeight: '500' },

  totalVotes: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});