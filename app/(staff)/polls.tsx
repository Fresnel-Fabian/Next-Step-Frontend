import { useDashboardCompact } from '@/lib/dashboardResponsive';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// ─── Results Modal (same as admin but read-only) ──────────────────────────────

function ResultsModal({
  pollId,
  visible,
  onClose,
  modalPaddingX,
  modalPaddingBottom,
  isCompact,
}: {
  pollId: number | null;
  visible: boolean;
  onClose: () => void;
  modalPaddingX: number;
  modalPaddingBottom: number;
  isCompact: boolean;
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

  const tabLabelResults = isCompact ? 'Chart' : 'Results';
  const tabLabelVoters = isCompact ? 'Voters' : 'Who Voted';

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalSheet,
            {
              paddingHorizontal: modalPaddingX,
              paddingBottom: modalPaddingBottom,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isCompact && styles.modalTitleCompact]}>Poll Results</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
          ) : results ? (
            <>
              <Text style={[styles.resultsTitle, isCompact && styles.resultsTitleCompact]} numberOfLines={3}>
                {results.title}
              </Text>
              <Text style={styles.resultsMeta}>{results.total_votes} votes total</Text>

              <View style={styles.tabRow}>
                <Pressable
                  style={[styles.tab, tab === 'chart' && styles.tabActive]}
                  onPress={() => setTab('chart')}
                >
                  <Text style={[styles.tabText, tab === 'chart' && styles.tabTextActive]}>{tabLabelResults}</Text>
                </Pressable>
                <Pressable
                  style={[styles.tab, tab === 'voters' && styles.tabActive]}
                  onPress={() => setTab('voters')}
                >
                  <Text style={[styles.tabText, tab === 'voters' && styles.tabTextActive]}>{tabLabelVoters}</Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                {tab === 'chart' ? (
                  <View style={styles.optionResults}>
                    {results.options.map(opt => (
                      <View key={opt.id} style={styles.optionResultRow}>
                        <View style={styles.optionResultHeader}>
                          <Text style={styles.optionResultText} numberOfLines={3}>
                            {opt.text}
                          </Text>
                          <Text style={styles.optionResultCount}>
                            {opt.votes} ({opt.percentage}%)
                          </Text>
                        </View>
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${Math.min(100, opt.percentage)}%` }]} />
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
                            <Text style={styles.voterName} numberOfLines={1}>
                              {v.user_name}
                            </Text>
                            <Text style={styles.voterChoice} numberOfLines={2}>
                              Voted: {v.option_text}
                            </Text>
                          </View>
                          <Text style={[styles.voterTime, isCompact && styles.voterTimeCompact]} numberOfLines={2}>
                            {v.voted_at}
                          </Text>
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
  isCompact,
  cardPadding,
}: {
  poll: Poll;
  onViewResults: (id: number) => void;
  isCompact: boolean;
  cardPadding: number;
}) {
  const iconSize = isCompact ? 15 : 16;
  const titleSize = isCompact ? 16 : 17;

  return (
    <View style={[styles.card, { padding: cardPadding, borderRadius: isCompact ? 12 : 14 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTopRow}>
          <Ionicons name="bar-chart-outline" size={iconSize + 1} color="#9CA3AF" style={styles.cardTypeIcon} />
          <View style={styles.cardHeaderMain}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { fontSize: titleSize }]} numberOfLines={3}>
                {poll.title}
              </Text>
              <View style={[styles.badge, poll.isActive ? styles.badgeActive : styles.badgeClosed]}>
                <Text style={[styles.badgeText, poll.isActive ? styles.badgeTextActive : styles.badgeTextClosed]}>
                  {poll.isActive ? 'Active' : 'Closed'}
                </Text>
              </View>
            </View>
            {poll.description ? (
              <Text style={styles.cardDesc} numberOfLines={isCompact ? 2 : 3}>
                {poll.description}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.optionsPreview}>
        {poll.options.map(opt => (
          <View key={opt.id} style={styles.optionRow}>
            <Text style={styles.optionText} numberOfLines={2}>
              {opt.text}
            </Text>
            <Text style={styles.optionPct}>{opt.percentage}%</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.voteCount}>
          <Ionicons name="people-outline" size={iconSize} color="#6B7280" />
          <Text style={styles.voteCountText} numberOfLines={1}>
            {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.timeLeft} numberOfLines={2}>
          {poll.timeLeft}
        </Text>
      </View>

      <Pressable style={styles.resultsBtn} onPress={() => onViewResults(poll.id)}>
        <Ionicons name="bar-chart-outline" size={isCompact ? 17 : 18} color="#FFFFFF" />
        <Text style={styles.resultsBtnText}>View Results</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StaffPolls() {
  const insets = useSafeAreaInsets();
  const {
    isCompact,
    contentPaddingX,
    contentPaddingY,
    sectionGap,
    cardPadding,
    greetingFontSize,
    secondaryFontSize,
  } = useDashboardCompact();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [resultsId, setResultsId] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const headerTop = Math.max(insets.top, 10) + (isCompact ? 6 : 10);
  const bottomPad = Math.max(insets.bottom, 12);

  const scrollContentStyle = {
    paddingHorizontal: contentPaddingX,
    paddingTop: 4,
    paddingBottom: contentPaddingY + bottomPad + 8,
    gap: isCompact ? 12 : 14,
  };

  const filterLabel = (f: 'all' | 'active' | 'completed') => {
    if (f === 'all') return 'All';
    if (f === 'active') return 'Active';
    return isCompact ? 'Closed' : 'Completed';
  };

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
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: contentPaddingX,
            paddingTop: headerTop,
            marginBottom: sectionGap * 0.45,
          },
        ]}
      >
        <View style={styles.headerTextBlock}>
          <Text style={[styles.headerTitle, { fontSize: greetingFontSize }]}>Polls</Text>
          <Text style={[styles.headerSub, { fontSize: secondaryFontSize }]}>
            View results for school polls
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.filterRow,
          {
            paddingHorizontal: contentPaddingX,
            marginBottom: isCompact ? 10 : 12,
            gap: isCompact ? 6 : 8,
          },
        ]}
      >
        {(['all', 'active', 'completed'] as const).map(f => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive, isCompact && styles.filterBtnCompact]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
                isCompact && styles.filterTextCompact,
              ]}
              numberOfLines={1}
            >
              {filterLabel(f)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : polls.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            { paddingHorizontal: contentPaddingX, paddingBottom: bottomPad + 16 },
          ]}
        >
          <Ionicons name="bar-chart-outline" size={isCompact ? 44 : 48} color="#D1D5DB" />
          <Text style={[styles.emptyTitle, isCompact && styles.emptyTitleCompact]}>No polls yet</Text>
          <Text style={styles.emptyDesc}>Polls created by admin will appear here</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={scrollContentStyle} showsVerticalScrollIndicator={false}>
          {polls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onViewResults={handleViewResults}
              isCompact={isCompact}
              cardPadding={cardPadding}
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
        modalPaddingX={contentPaddingX}
        modalPaddingBottom={Math.max(20, bottomPad + 8)}
        isCompact={isCompact}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextBlock: { flex: 1, minWidth: 0 },
  headerTitle: { fontWeight: 'bold', color: '#111827' },
  headerSub: { color: '#6B7280', marginTop: 4, lineHeight: 20 },

  filterRow: { flexDirection: 'row', alignItems: 'stretch' },
  filterBtn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBtnCompact: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { fontSize: 13, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  filterTextCompact: { fontSize: 12 },
  filterTextActive: { color: 'white' },

  card: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { marginBottom: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTypeIcon: { marginTop: 2 },
  cardHeaderMain: { flex: 1, minWidth: 0 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: { fontWeight: '700', color: '#111827', flex: 1, minWidth: 0 },
  cardDesc: { fontSize: 14, color: '#6B7280', marginTop: 6, lineHeight: 20 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, flexShrink: 0 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeClosed: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextClosed: { color: '#6B7280' },

  optionsPreview: { gap: 8, marginBottom: 12 },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  optionPct: { fontSize: 13, color: '#6B7280', fontWeight: '600', flexShrink: 0, marginTop: 1 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  voteCount: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 },
  voteCountText: { fontSize: 12, color: '#6B7280', flexShrink: 1 },
  timeLeft: {
    fontSize: 12,
    color: '#6B7280',
    flexShrink: 0,
    maxWidth: '46%',
    textAlign: 'right',
  },

  resultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
  },
  resultsBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyTitleCompact: { fontSize: 15 },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21, maxWidth: 320 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },
  modalTitleCompact: { fontSize: 17 },
  resultsTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  resultsTitleCompact: { fontSize: 15 },
  resultsMeta: { fontSize: 13, color: '#6B7280', marginBottom: 16 },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: 'white' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#111827', fontWeight: '600' },

  optionResults: { gap: 12 },
  optionResultRow: { gap: 6 },
  optionResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  optionResultText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  optionResultCount: { fontSize: 13, color: '#6B7280', flexShrink: 0, marginTop: 1 },
  barBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#2563EB', borderRadius: 4 },

  voterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  voterAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  voterAvatarText: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  voterInfo: { flex: 1, minWidth: 0 },
  voterName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  voterChoice: { fontSize: 12, color: '#6B7280' },
  voterTime: { fontSize: 11, color: '#9CA3AF', flexShrink: 0, maxWidth: 100, textAlign: 'right' },
  voterTimeCompact: { maxWidth: 88, fontSize: 10 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },
});