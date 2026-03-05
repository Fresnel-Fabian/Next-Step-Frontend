import { DataService, Poll, PollResults } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

// ─── Results Modal (same as admin but read-only) ──────────────────────────────

function ResultsModal({
  pollId,
  visible,
  onClose,
}: {
  pollId: number | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'chart' | 'voters'>('chart');

  useEffect(() => {
    if (visible && pollId) loadResults(pollId);
  }, [visible, pollId]);

  const loadResults = async (id: number) => {
    try {
      setLoading(true);
      const data = await DataService.getPollResults(id);
      setResults(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load results' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Poll Results</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          ) : results ? (
            <>
              <Text style={styles.resultsTitle}>{results.title}</Text>
              <Text style={styles.resultsMeta}>{results.total_votes} votes total</Text>

              {/* Tab switcher */}
              <View style={styles.tabRow}>
                <Pressable
                  style={[styles.tab, tab === 'chart' && styles.tabActive]}
                  onPress={() => setTab('chart')}
                >
                  <Text style={[styles.tabText, tab === 'chart' && styles.tabTextActive]}>
                    Results
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tab, tab === 'voters' && styles.tabActive]}
                  onPress={() => setTab('voters')}
                >
                  <Text style={[styles.tabText, tab === 'voters' && styles.tabTextActive]}>
                    Who Voted
                  </Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {tab === 'chart' ? (
                  <View style={styles.optionResults}>
                    {results.options.map(opt => (
                      <View key={opt.id} style={styles.optionResultRow}>
                        <View style={styles.optionResultHeader}>
                          <Text style={styles.optionResultText}>{opt.text}</Text>
                          <Text style={styles.optionResultCount}>
                            {opt.votes} ({opt.percentage}%)
                          </Text>
                        </View>
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${opt.percentage}%` }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View>
                    {results.voters.length === 0 ? (
                      <Text style={styles.emptyText}>No votes yet</Text>
                    ) : (
                      results.voters.map((v, i) => (
                        <View key={i} style={styles.voterRow}>
                          <View style={styles.voterAvatar}>
                            <Text style={styles.voterAvatarText}>
                              {v.user_name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.voterInfo}>
                            <Text style={styles.voterName}>{v.user_name}</Text>
                            <Text style={styles.voterChoice}>Voted: {v.option_text}</Text>
                          </View>
                          <Text style={styles.voterTime}>{v.voted_at}</Text>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </ScrollView>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// ─── Poll Card (view only) ────────────────────────────────────────────────────

function PollCard({
  poll,
  onViewResults,
}: {
  poll: Poll;
  onViewResults: (id: number) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{poll.title}</Text>
        <View style={[styles.badge, poll.isActive ? styles.badgeActive : styles.badgeClosed]}>
          <Text style={[styles.badgeText, poll.isActive ? styles.badgeTextActive : styles.badgeTextClosed]}>
            {poll.isActive ? 'Active' : 'Closed'}
          </Text>
        </View>
      </View>

      {poll.description && (
        <Text style={styles.cardDesc}>{poll.description}</Text>
      )}

      {/* Options preview with percentages */}
      <View style={styles.optionsPreview}>
        {poll.options.map(opt => (
          <View key={opt.id} style={styles.optionRow}>
            <Text style={styles.optionText}>{opt.text}</Text>
            <Text style={styles.optionPct}>{opt.percentage}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.voteCount}>
          <Ionicons name="people-outline" size={14} color="#6B7280" />
          <Text style={styles.voteCountText}>{poll.totalVotes} votes</Text>
        </View>
        <Text style={styles.timeLeft}>{poll.timeLeft}</Text>
      </View>

      {/* View results button only */}
      <Pressable style={styles.resultsBtn} onPress={() => onViewResults(poll.id)}>
        <Ionicons name="bar-chart-outline" size={16} color="#2563EB" />
        <Text style={styles.resultsBtnText}>View Results</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StaffPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [resultsId, setResultsId] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchPolls();
  }, [filter]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const data = await DataService.getPolls(status as any);
      setPolls(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load polls' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (id: number) => {
    setResultsId(id);
    setShowResults(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Polls</Text>
          <Text style={styles.headerSub}>View poll results</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : polls.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No polls yet</Text>
          <Text style={styles.emptyDesc}>Polls created by admin will appear here</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {polls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onViewResults={handleViewResults}
            />
          ))}
        </ScrollView>
      )}

      <ResultsModal
        pollId={resultsId}
        visible={showResults}
        onClose={() => {
          setShowResults(false);
          setResultsId(null);
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 2 },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: 'white' },

  list: { padding: 16, paddingTop: 4, gap: 12 },

  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  cardDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeClosed: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextClosed: { color: '#6B7280' },

  optionsPreview: { gap: 8, marginBottom: 12 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  optionPct: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  voteCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  voteCountText: { fontSize: 12, color: '#6B7280' },
  timeLeft: { fontSize: 12, color: '#6B7280' },

  resultsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: 8,
  },
  resultsBtnText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  resultsTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  resultsMeta: { fontSize: 13, color: '#6B7280', marginBottom: 16 },

  tabRow: {
    flexDirection: 'row', backgroundColor: '#F3F4F6',
    borderRadius: 8, padding: 4, marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: 'white' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#111827', fontWeight: '600' },

  optionResults: { gap: 12 },
  optionResultRow: { gap: 6 },
  optionResultHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  optionResultText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  optionResultCount: { fontSize: 13, color: '#6B7280' },
  barBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#2563EB', borderRadius: 4 },

  voterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  voterAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  voterAvatarText: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  voterInfo: { flex: 1 },
  voterName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  voterChoice: { fontSize: 12, color: '#6B7280' },
  voterTime: { fontSize: 11, color: '#9CA3AF' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },
});