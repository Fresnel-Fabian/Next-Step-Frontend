import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { DataService } from '@/services/dataService';
import { Poll } from '@/types/poll';

export default function PollsScreen() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const data = await DataService.getPolls();
      setPolls(data);
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = () => {
    Alert.alert('Coming Soon', 'Create poll feature');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share poll feature');
  };

  const handleVote = (pollId: string, optionLabel: string) => {
    Alert.alert('Vote', `You voted for: ${optionLabel}`);
    // Update local state to mark as voted
    setPolls(prev =>
      prev.map(p => (p.id === pollId ? { ...p, voted: true } : p))
    );
  };

  const activePolls = polls.filter(p => p.status === 'active');
  const completedPolls = polls.filter(p => p.status === 'completed');
  const votedCount = polls.filter(p => p.voted).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const featuredPoll = activePolls[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Interactive Polls</Text>
            <Text style={styles.subtitle}>Vote on important decisions</Text>
          </View>
          <View style={styles.headerButtons}>
            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#374151" />
            </Pressable>
            <Pressable style={styles.createButton} onPress={handleCreatePoll}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createButtonText}>Create</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="bar-chart-outline" size={24} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Active Polls</Text>
              <Text style={styles.statValue}>{activePolls.length}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.statLabel}>Your Votes</Text>
              <Text style={styles.statValue}>{votedCount}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="trending-up-outline" size={24} color="#10B981" />
            </View>
            <View>
              <Text style={styles.statLabel}>Participation</Text>
              <Text style={styles.statValue}>78%</Text>
            </View>
          </View>
        </View>

        {/* Featured Active Poll */}
        {featuredPoll && (
          <View style={styles.featuredPoll}>
            <View style={styles.featuredHeader}>
              <Text style={styles.featuredQuestion}>{featuredPoll.question}</Text>
              {featuredPoll.voted && (
                <View style={styles.votedBadge}>
                  <Ionicons name="checkmark" size={12} color="#059669" />
                  <Text style={styles.votedBadgeText}>Voted</Text>
                </View>
              )}
            </View>

            <View style={styles.featuredMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{featuredPoll.timeLeft}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{featuredPoll.totalVotes} votes</Text>
              </View>
            </View>

            {/* Results/Options */}
            <View style={styles.pollOptions}>
              {featuredPoll.options.map((option, idx) => (
                <View key={idx} style={styles.pollOption}>
                  <View style={styles.pollOptionHeader}>
                    <Text style={styles.pollOptionLabel}>{option.label}</Text>
                    <Text style={styles.pollOptionVotes}>
                      {option.votes} votes ({option.percentage}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${option.percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.featuredCreator}>Created by {featuredPoll.creator}</Text>
          </View>
        )}

        {/* Other Active Polls */}
        {activePolls.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More Active Polls</Text>
            {activePolls.slice(1).map((poll) => (
              <View key={poll.id} style={styles.pollCard}>
                <Text style={styles.pollCardQuestion}>{poll.question}</Text>
                <Text style={styles.pollCardMeta}>
                  {poll.timeLeft} • {poll.totalVotes} votes
                </Text>
                <View style={styles.pollCardOptions}>
                  {poll.options.map((option, idx) => (
                    <Pressable
                      key={idx}
                      style={styles.pollCardOption}
                      onPress={() => !poll.voted && handleVote(poll.id, option.label)}
                      disabled={poll.voted}
                    >
                      <View style={styles.radioButton}>
                        {poll.voted && idx === 0 && <View style={styles.radioButtonSelected} />}
                      </View>
                      <Text style={styles.pollCardOptionText}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
                {!poll.voted && (
                  <Pressable style={styles.voteButton}>
                    <Text style={styles.voteButtonText}>Submit Vote</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Completed Polls */}
        {completedPolls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Polls</Text>
            {completedPolls.map((poll) => (
              <View key={poll.id} style={styles.completedPollCard}>
                <View style={styles.completedIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#6B7280" />
                </View>
                <View style={styles.completedPollContent}>
                  <Text style={styles.completedPollQuestion}>{poll.question}</Text>
                  <Text style={styles.completedPollWinner}>
                    Winner: {poll.options[0].label}
                  </Text>
                  <View style={styles.completedPollMeta}>
                    <Text style={styles.completedPollMetaText}>
                      {poll.totalVotes} total votes
                    </Text>
                    <Text style={styles.completedPollMetaText}>•</Text>
                    <Text style={styles.completedPollMetaText}>{poll.timeLeft}</Text>
                  </View>
                </View>
                <Pressable>
                  <Text style={styles.viewButton}>View</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingTop: 60,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  featuredPoll: {
    backgroundColor: 'white',
    padding: 24,
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
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featuredQuestion: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  votedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pollOptions: {
    gap: 16,
    marginBottom: 16,
  },
  pollOption: {
    gap: 8,
  },
  pollOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  pollOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  pollOptionVotes: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E9D5FF',
    borderRadius: 8,
  },
  featuredCreator: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
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
  pollCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
  },
  pollCardQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  pollCardMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  pollCardOptions: {
    gap: 8,
    marginBottom: 12,
  },
  pollCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  pollCardOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  voteButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  voteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  completedPollCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    opacity: 0.85,
  },
  completedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedPollContent: {
    flex: 1,
  },
  completedPollQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  completedPollWinner: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  completedPollMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  completedPollMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});