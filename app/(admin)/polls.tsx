import { CreatePollData, DataService, Poll, PollResults } from '@/services/dataService';
import { handleApiError } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

// ─── Create Poll Modal ────────────────────────────────────────────────────────

function CreatePollModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const addOption = () => setOptions([...options, '']);
  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };
  const updateOption = (i: number, val: string) => {
    const updated = [...options];
    updated[i] = val;
    setOptions(updated);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    const filled = options.filter(o => o.trim());
    if (filled.length < 2) {
      Toast.show({ type: 'error', text1: 'Add at least 2 food options' });
      return;
    }
    try {
      setLoading(true);
      const data: CreatePollData = {
        title: title.trim(),
        description: description.trim() || undefined,
        options: filled.map((text, i) => ({ id: i + 1, text })),
      };
      await DataService.createPoll(data);
      Toast.show({ type: 'success', text1: 'Poll created!', text2: 'Students can now vote' });
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      onCreated();
      onClose();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to create poll' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setOptions(['', '']);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Food Poll</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Poll Question *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. What should we serve for lunch?"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Add more context..."
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.label}>Food Options *</Text>
            {options.map((opt, i) => (
              <View key={i} style={styles.optionRow}>
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>{i + 1}</Text>
                </View>
                <TextInput
                  style={styles.optionInput}
                  placeholder="e.g. Pizza, Burger, Salad..."
                  value={opt}
                  onChangeText={v => updateOption(i, v)}
                  placeholderTextColor="#9CA3AF"
                />
                {options.length > 2 && (
                  <Pressable onPress={() => removeOption(i)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable onPress={addOption} style={styles.addOptionBtn}>
              <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
              <Text style={styles.addOptionText}>Add Food Option</Text>
            </Pressable>
            <Pressable
              style={[styles.createBtn, loading && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createBtnText}>Create & Send to Students</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Results Modal ────────────────────────────────────────────────────────────

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
              <View style={styles.tabRow}>
                <Pressable
                  style={[styles.tab, tab === 'chart' && styles.tabActive]}
                  onPress={() => setTab('chart')}
                >
                  <Text style={[styles.tabText, tab === 'chart' && styles.tabTextActive]}>Results</Text>
                </Pressable>
                <Pressable
                  style={[styles.tab, tab === 'voters' && styles.tabActive]}
                  onPress={() => setTab('voters')}
                >
                  <Text style={[styles.tabText, tab === 'voters' && styles.tabTextActive]}>Who Voted</Text>
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {tab === 'chart' ? (
                  <View style={styles.optionResults}>
                    {results.options.map(opt => (
                      <View key={opt.id} style={styles.optionResultRow}>
                        <View style={styles.optionResultHeader}>
                          <Text style={styles.optionResultText}>{opt.text}</Text>
                          <Text style={styles.optionResultCount}>{opt.votes} ({opt.percentage}%)</Text>
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
                            <Text style={styles.voterAvatarText}>{v.user_name.charAt(0).toUpperCase()}</Text>
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

// ─── Poll Card ────────────────────────────────────────────────────────────────

function PollCard({
  poll,
  onClose,
  onViewResults,
  onDelete,
}: {
  poll: Poll;
  onClose: (id: number) => void;
  onViewResults: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const voteLine =
    poll.totalVotes === 0
      ? 'No responses'
      : `${poll.totalVotes} vote${poll.totalVotes !== 1 ? 's' : ''}`;

  const optionCount = poll.options?.length ?? 0;
  const optionsLine =
    optionCount === 1 ? '1 option' : `${optionCount} options`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTopRow}>
          <Ionicons name="bar-chart-outline" size={16} color="#9CA3AF" style={styles.cardTypeIcon} />
          <View style={styles.cardHeaderMain}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {poll.title}
              </Text>
              <View style={[styles.badge, poll.isActive ? styles.badgeActive : styles.badgeClosed]}>
                <Text style={[styles.badgeText, poll.isActive ? styles.badgeTextActive : styles.badgeTextClosed]}>
                  {poll.isActive ? 'Active' : 'Closed'}
                </Text>
              </View>
            </View>
            {poll.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {poll.description}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.optionsPreview}>
        <Text style={styles.voteCountText}>{optionsLine}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.voteCount}>
          <Ionicons name="stats-chart-outline" size={15} color="#6B7280" />
          <Text style={styles.voteCountText}>{voteLine}</Text>
        </View>
        <Text style={styles.timeLeft} numberOfLines={1}>
          {poll.timeLeft}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <Pressable style={styles.resultsBtn} onPress={() => onViewResults(poll.id)}>
          <Ionicons name="bar-chart-outline" size={18} color="#FFFFFF" />
          <Text style={styles.resultsBtnText}>View Results</Text>
        </Pressable>
        {poll.isActive ? (
          <Pressable style={styles.closeBtn} onPress={() => onClose(poll.id)}>
            <Ionicons name="stop-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.deleteBtn} onPress={() => onDelete(poll.id)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AdminPolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showCreate, setShowCreate] = useState(false);
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

  const handleClosePoll = async (id: number) => {
    try {
      await DataService.closePoll(id);
      Toast.show({
        type: 'success',
        text1: 'Poll closed',
        ...(filter === 'active'
          ? {
              text2: 'Switched to All — you can delete or manage the poll below.',
              visibilityTime: 2800,
            }
          : {}),
      });
      // Closed polls are no longer "active"; they disappear from the Active tab only.
      if (filter === 'active') {
        setFilter('all');
      } else {
        fetchPolls();
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to close poll' });
    }
  };

  const handleDeletePoll = (id: number) => {
    Alert.alert(
      'Delete Poll',
      'Are you sure you want to permanently delete this poll? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DataService.deletePoll(id);
              Toast.show({ type: 'success', text1: 'Poll deleted' });
              fetchPolls();
            } catch (e) {
              const err = handleApiError(e);
              Toast.show({
                type: 'error',
                text1: 'Failed to delete poll',
                text2: err.message,
              });
            }
          },
        },
      ],
    );
  };

  const handleViewResults = (id: number) => {
    setResultsId(id);
    setShowResults(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Food Polls</Text>
          <Text style={styles.headerSub}>Create and manage student polls</Text>
        </View>
        <Pressable style={styles.newPollBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.newPollText}>New Poll</Text>
        </Pressable>
      </View>

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
          <Text style={styles.emptyDesc}>Create a poll to get student feedback</Text>
          <Pressable style={styles.newPollBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.newPollText}>Create First Poll</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {polls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              onClose={handleClosePoll}
              onViewResults={handleViewResults}
              onDelete={handleDeletePoll}
            />
          ))}
        </ScrollView>
      )}

      <CreatePollModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchPolls}
      />
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
  newPollBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10,
  },
  newPollText: { color: 'white', fontWeight: '600', fontSize: 14 },
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1, minWidth: 0 },
  cardDesc: { fontSize: 14, color: '#6B7280', marginTop: 6, lineHeight: 20 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, flexShrink: 0 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeClosed: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#059669' },
  badgeTextClosed: { color: '#6B7280' },
  optionsPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  optionChip: {
    maxWidth: 160,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  optionChipText: { fontSize: 12, color: '#2563EB', fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  voteCount: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1, minWidth: 0 },
  voteCountText: { fontSize: 12, color: '#6B7280' },
  timeLeft: { fontSize: 12, color: '#6B7280', flexShrink: 0, textAlign: 'right' },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  resultsBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
  },
  resultsBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  closeBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  closeBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  deleteBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
    marginBottom: 16,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  optionBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
  },
  optionBadgeText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  optionInput: {
    flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  removeBtn: { padding: 4 },
  addOptionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, marginBottom: 8,
  },
  addOptionText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  createBtn: {
    backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 8, marginBottom: 20,
  },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
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