// app/(admin)/students.tsx
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: 'pending' | 'accepted';
  invite_link: string;
  expires_at: string;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  is_active: boolean;
}

export default function StudentsScreen() {
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStudents(), fetchInvitations()]);
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/api/v1/users?role=STUDENT');
      setStudents(res.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load students', position: 'top' });
    }
  };

  const fetchInvitations = async () => {
    try {
      const res = await api.get('/api/v1/invitations?role=STUDENT');
      setPendingInvites(res.data.filter((i: Invitation) => i.status === 'pending'));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load invitations', position: 'top' });
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter an email address', position: 'top' });
      return;
    }
    try {
      setInviting(true);
      const res = await api.post('/api/v1/invitations/invite', { email: email.trim(), role: 'STUDENT' });
      setEmail('');
      setPendingInvites(prev => [res.data, ...prev]);
      Toast.show({ type: 'success', text1: 'Student invited!', text2: res.data.email, position: 'top' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.detail || 'Failed to send invite', position: 'top' });
    } finally {
      setInviting(false);
    }
  };

  const handleCSVUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setUploading(true);
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: 'text/csv' } as any);
      const res = await api.post('/api/v1/invitations/invite/bulk?role=STUDENT', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchInvitations();
      Toast.show({
        type: 'success',
        text1: `${res.data.invited.length} student(s) invited`,
        text2: res.data.skipped.length > 0 ? `${res.data.skipped.length} skipped` : undefined,
        position: 'top',
        visibilityTime: 3000,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to upload CSV', position: 'top' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancelInvite = async (id: number) => {
    try {
      await api.delete(`/api/v1/invitations/${id}`);
      setPendingInvites(prev => prev.filter(i => i.id !== id));
      Toast.show({ type: 'success', text1: 'Invitation cancelled', position: 'top' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to cancel invitation', position: 'top' });
    }
  };

  const openRemoveModal = (student: Student) => {
    setSelectedStudent(student);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    try {
      setActionLoading(true);
      await api.delete(`/api/v1/users/${selectedStudent.id}`);
      setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
      Toast.show({ type: 'success', text1: 'Student deleted permanently', position: 'top' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete student', position: 'top' });
    } finally {
      setActionLoading(false);
      setModalVisible(false);
      setSelectedStudent(null);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedStudent) return;
    try {
      setActionLoading(true);
      await api.patch(`/api/v1/users/${selectedStudent.id}/deactivate`);
      setStudents(prev =>
        prev.map(s => s.id === selectedStudent.id ? { ...s, is_active: false } : s)
      );
      Toast.show({ type: 'success', text1: 'Student deactivated', position: 'top' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to deactivate student', position: 'top' });
    } finally {
      setActionLoading(false);
      setModalVisible(false);
      setSelectedStudent(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={styles.userRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() ?? '?'}</Text>
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          {!item.is_active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
      </View>
      <Pressable style={styles.removeBtn} onPress={() => openRemoveModal(item)}>
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.title}>Students</Text>
          <Text style={styles.subtitle}>Invite and manage student accounts</Text>
        </View>

        {/* Invite by Email */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="person-add-outline" size={22} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Invite Student</Text>
              <Text style={styles.cardSubtitle}>They'll join via Google login</Text>
            </View>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="student@gmail.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!inviting}
            />
            <Pressable
              style={[styles.inviteBtn, inviting && styles.btnDisabled]}
              onPress={handleInvite}
              disabled={inviting}
            >
              {inviting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.inviteBtnText}>Invite</Text>
              }
            </Pressable>
          </View>
        </View>

        {/* Bulk CSV */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="document-text-outline" size={22} color="#10B981" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Bulk Invite via CSV</Text>
              <Text style={styles.cardSubtitle}>One email per row</Text>
            </View>
          </View>
          <View style={styles.csvHint}>
            <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
            <Text style={styles.csvHintText}>
              CSV format: one email per row. Optional "email" header will be skipped.
            </Text>
          </View>
          <Pressable
            style={[styles.csvBtn, uploading && styles.btnDisabled]}
            onPress={handleCSVUpload}
            disabled={uploading}
          >
            {uploading
              ? <ActivityIndicator size="small" color="#10B981" />
              : <Ionicons name="cloud-upload-outline" size={18} color="#10B981" />
            }
            <Text style={styles.csvBtnText}>
              {uploading ? 'Uploading...' : 'Choose CSV File'}
            </Text>
          </Pressable>
        </View>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pending Invitations ({pendingInvites.length})</Text>
            {pendingInvites.map(inv => (
              <View key={inv.id} style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.avatarText, { color: '#D97706' }]}>
                    {inv.email.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{inv.email}</Text>
                  <Text style={styles.userEmail}>Invited {formatDate(inv.created_at)}</Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Pending</Text>
                </View>
                <Pressable style={styles.removeBtn} onPress={() => handleCancelInvite(inv.id)}>
                  <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Students List */}
        <View style={styles.card}>
          <View style={styles.listHeader}>
            <Text style={styles.cardTitle}>All Students ({filteredStudents.length})</Text>
            <Pressable onPress={fetchAll}>
              <Ionicons name="refresh-outline" size={18} color="#6B7280" />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 24 }} />
          ) : filteredStudents.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>{search ? 'No students match your search' : 'No students yet'}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={item => item.id}
              renderItem={renderStudent}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

      </ScrollView>

      {/* Remove Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => !actionLoading && setModalVisible(false)}>
          <Pressable style={styles.modalBox} onPress={e => e.stopPropagation()}>
            <View style={styles.modalIcon}>
              <Ionicons name="warning-outline" size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Remove Student</Text>
            <Text style={styles.modalSubtitle}>
              What would you like to do with{'\n'}
              <Text style={styles.modalEmail}>{selectedStudent?.name}</Text>?
            </Text>
            <Pressable
              style={[styles.modalBtn, styles.modalBtnDeactivate, actionLoading && styles.btnDisabled]}
              onPress={handleDeactivate}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator size="small" color="#D97706" />
                : <><Ionicons name="ban-outline" size={18} color="#D97706" /><View><Text style={styles.deactivateTitle}>Deactivate Account</Text><Text style={styles.modalBtnSub}>Blocked from login, data is kept</Text></View></>
              }
            </Pressable>
            <Pressable
              style={[styles.modalBtn, styles.modalBtnDelete, actionLoading && styles.btnDisabled]}
              onPress={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <><Ionicons name="trash-outline" size={18} color="#EF4444" /><View><Text style={styles.deleteTitle}>Delete Permanently</Text><Text style={styles.modalBtnSub}>This cannot be undone</Text></View></>
              }
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setModalVisible(false)} disabled={actionLoading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, gap: 20 },
  header: { marginBottom: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 24,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, gap: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, height: 44, borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, fontSize: 14,
    color: '#111827', backgroundColor: '#F9FAFB',
  },
  inviteBtn: {
    backgroundColor: '#2563EB', paddingHorizontal: 18, height: 44,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 80,
  },
  inviteBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  csvHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8,
  },
  csvHintText: { fontSize: 12, color: '#9CA3AF', flex: 1, lineHeight: 18 },
  csvBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: '#10B981',
    borderStyle: 'dashed', borderRadius: 10, paddingVertical: 14,
  },
  csvBtnText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  userEmail: { fontSize: 12, color: '#9CA3AF' },
  removeBtn: { padding: 8 },
  inactiveBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  inactiveBadgeText: { fontSize: 10, fontWeight: '600', color: '#EF4444' },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingBadgeText: { fontSize: 12, fontWeight: '600', color: '#D97706' },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, gap: 12 },
  modalIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  modalEmail: { fontWeight: '600', color: '#111827' },
  modalBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: 12, padding: 16 },
  modalBtnDeactivate: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  modalBtnDelete: { borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  deactivateTitle: { fontSize: 14, fontWeight: '600', color: '#D97706' },
  deleteTitle: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  modalBtnSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  modalCancel: { alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', marginTop: 4 },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
});