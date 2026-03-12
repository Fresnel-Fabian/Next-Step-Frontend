import { DataService, ScheduleDTO } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SchedulesScreen() {
  const [schedules, setSchedules] = useState<ScheduleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await DataService.getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    Alert.alert('Coming Soon', 'Create schedule feature');
  };

  const handleExport = () => {
    Alert.alert('Export', 'Exporting schedule data...');
  };

  const handleFilter = () => {
    Alert.alert('Coming Soon', 'Filter options');
  };

  const handleEdit = (id: string) => {
    Alert.alert('Edit', `Edit schedule ID: ${id}`);
  };

  const handleView = (id: string) => {
    Alert.alert('View', `View details for ID: ${id}`);
  };

  const handleSync = (id: string) => {
    Alert.alert('Sync', `Syncing schedule ${id} to staff devices...`);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await DataService.deleteSchedule(id);
            setSchedules(prev => prev.filter(s => s.id !== id));
          },
        },
      ]
    );
  };

  const filteredSchedules = schedules.filter(s =>
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClasses = schedules.reduce((acc, s) => acc + s.classCount, 0);
  const totalStaff = schedules.reduce((acc, s) => acc + s.staffCount, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Schedule Management</Text>
            <Text style={styles.subtitle}>Create and manage class schedules</Text>
          </View>
          <Pressable style={styles.createButton} onPress={handleCreate}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.createButtonText}>Create</Text>
          </Pressable>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Schedules</Text>
            <Text style={styles.statValue}>{schedules.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Classes</Text>
            <Text style={styles.statValue}>{totalClasses}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Staff Assigned</Text>
            <Text style={styles.statValue}>{totalStaff}</Text>
          </View>
        </View>

        {/* Search & Actions */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search schedules..."
              placeholderTextColor="#9CA3AF"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable style={styles.actionButton} onPress={handleFilter}>
            <Ionicons name="options-outline" size={16} color="#6B7280" />
            <Text style={styles.actionButtonText}>Filter</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleExport}>
            <Ionicons name="download-outline" size={16} color="#6B7280" />
            <Text style={styles.actionButtonText}>Export</Text>
          </Pressable>
        </View>

        {/* Schedule List */}
        <View style={styles.scheduleList}>
          {filteredSchedules.map((schedule) => (
            <View key={schedule.id} style={styles.scheduleCard}>
              {/* Header */}
              <View style={styles.scheduleHeader}>
                <View style={styles.scheduleHeaderLeft}>
                  <Text style={styles.scheduleDepartment}>{schedule.department}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      schedule.status === 'Active'
                        ? styles.statusBadgeActive
                        : styles.statusBadgeDraft,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        schedule.status === 'Active'
                          ? styles.statusTextActive
                          : styles.statusTextDraft,
                      ]}
                    >
                      {schedule.status}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleDelete(schedule.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>

              {/* Info */}
              <View style={styles.scheduleInfo}>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.infoText}>{schedule.classCount} classes</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.infoText}>{schedule.staffCount} staff</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                  <Text style={styles.infoText}>Updated {schedule.lastUpdated}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.scheduleActions}>
                <Pressable
                  style={styles.scheduleActionButton}
                  onPress={() => handleEdit(schedule.id)}
                >
                  <Ionicons name="create-outline" size={16} color="#2563EB" />
                  <Text style={styles.scheduleActionText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={styles.scheduleActionButton}
                  onPress={() => handleView(schedule.id)}
                >
                  <Ionicons name="eye-outline" size={16} color="#6B7280" />
                  <Text style={[styles.scheduleActionText, styles.scheduleActionTextSecondary]}>
                    View
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.scheduleActionButton}
                  onPress={() => handleSync(schedule.id)}
                >
                  <Ionicons name="sync-outline" size={16} color="#3B82F6" />
                  <Text style={[styles.scheduleActionText, styles.scheduleActionTextBlue]}>
                    Sync
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scheduleList: {
    gap: 16,
  },
  scheduleCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  scheduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  scheduleDepartment: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeDraft: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextDraft: {
    color: '#D97706',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
  scheduleInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  scheduleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  scheduleActionTextSecondary: {
    color: '#6B7280',
  },
  scheduleActionTextBlue: {
    color: '#3B82F6',
  },
});