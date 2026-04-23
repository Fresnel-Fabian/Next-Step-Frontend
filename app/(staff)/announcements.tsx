import { Announcement, CreateAnnouncementData, DataService } from '@/services/dataService';
import { handleApiError } from '@/services/api';
import { resolveFileOpenUrl } from '@/lib/resolveFileUrl';
import { useUser } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

// ─── Create Announcement Modal ────────────────────────────────────────────────

function CreateAnnouncementModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      setUploading(true);
      Toast.show({ type: 'info', text1: 'Uploading file...', position: 'top', visibilityTime: 2000 });

      const uploaded = await DataService.uploadFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });

      setFileUrl(uploaded.fileUrl);
      setFileName(file.name);
      Toast.show({ type: 'success', text1: 'File uploaded', text2: file.name, position: 'top', visibilityTime: 2000 });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to upload file', position: 'top', visibilityTime: 2000 });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFileUrl('');
    setFileName('');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    if (!message.trim()) {
      Toast.show({ type: 'error', text1: 'Message is required' });
      return;
    }
    try {
      setLoading(true);
      const data: CreateAnnouncementData = {
        title: title.trim(),
        message: message.trim(),
        file_url: fileUrl || undefined,
        file_name: fileName || undefined,
      };
      await DataService.createAnnouncement(data);
      Toast.show({ type: 'success', text1: 'Announcement sent', text2: 'All users have been notified' });
      setTitle('');
      setMessage('');
      setFileUrl('');
      setFileName('');
      onCreated();
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to create announcement' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    setFileUrl('');
    setFileName('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Announcement</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Class Rescheduled"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your announcement here..."
              value={message}
              onChangeText={setMessage}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Attach File (optional)</Text>
            {fileUrl ? (
              <View style={styles.attachedFile}>
                <Ionicons name="document-attach-outline" size={20} color="#2563EB" />
                <Text style={styles.attachedFileName} numberOfLines={1}>{fileName}</Text>
                <Pressable onPress={handleRemoveFile} style={styles.removeFileBtn}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.uploadBtn, uploading && styles.btnDisabled]}
                onPress={handlePickFile}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#2563EB" />
                    <Text style={styles.uploadBtnText}>Pick File from Device</Text>
                  </>
                )}
              </Pressable>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color="#2563EB" />
              <Text style={styles.infoText}>
                This announcement will be sent as a notification to all users immediately.
              </Text>
            </View>

            <Pressable
              style={[styles.createBtn, (loading || uploading) && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={loading || uploading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createBtnText}>Send Announcement</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Announcement Card (reader-first: time, title, body, attachment) ─────────

function isWithinLastHours(iso: string, hours: number): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < hours * 60 * 60 * 1000;
}

function formatCalendarDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function AnnouncementCard({
  announcement,
  onDelete,
  canDelete,
}: {
  announcement: Announcement;
  onDelete: (id: number) => void;
  canDelete: boolean;
}) {
  const handleOpenFile = async () => {
    if (!announcement.fileUrl) return;
    const url = resolveFileOpenUrl(announcement.fileUrl);
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Toast.show({ type: 'error', text1: 'Cannot open this link' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open file' });
    }
  };

  const recent = isWithinLastHours(announcement.createdAt, 48);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIconWrap}>
          <Ionicons name="megaphone-outline" size={24} color="#2563EB" />
        </View>
        <View style={styles.cardTopMain}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle} numberOfLines={3}>
                {announcement.title}
              </Text>
            </View>
            {(recent || canDelete) && (
              <View style={styles.cardMetaRight}>
                <View style={styles.cardStatusRow}>
                  {recent && (
                    <View style={styles.recentBadge}>
                      <Text style={styles.recentBadgeText}>New</Text>
                    </View>
                  )}
                  {canDelete && (
                    <Pressable onPress={() => onDelete(announcement.id)} style={styles.deleteIconBtn} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text style={styles.cardMessage}>{announcement.message}</Text>

      {announcement.fileUrl && (
        <Pressable style={styles.fileRow} onPress={handleOpenFile}>
          <View style={styles.fileIconBox}>
            <Ionicons name="document-text-outline" size={18} color="#2563EB" />
          </View>
          <View style={styles.fileRowText}>
            <Text style={styles.fileRowLabel}>Open attachment</Text>
            <Text style={styles.fileRowName} numberOfLines={1}>
              {announcement.fileName || 'Document'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>
      )}

      <Text style={styles.postedLine}>Posted {formatCalendarDate(announcement.createdAt)}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function StaffAnnouncements() {
  const user = useUser();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await DataService.getAnnouncements();
      setAnnouncements(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load announcements' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q)
    );
  }, [announcements, search]);

  const firstName = user?.name?.split(/\s+/)[0];
  const headerSub = firstName
    ? `${firstName}, here's what's new from your school`
    : 'Updates from your school — stay in the loop';

  const canDeleteAnnouncement = (a: Announcement) =>
    user != null && Number(user.id) === a.createdBy;

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    try {
      setDeleting(true);
      await DataService.deleteAnnouncement(deleteTarget);
      Toast.show({ type: 'success', text1: 'Announcement deleted' });
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (e) {
      const err = handleApiError(e);
      Toast.show({ type: 'error', text1: 'Failed to delete', text2: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Text style={styles.headerSub}>{headerSub}</Text>
        </View>
        <Pressable style={styles.newBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.newBtnText}>New</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : announcements.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="newspaper-outline" size={36} color="#2563EB" />
          </View>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptyDesc}>
            When your school shares an update, it will show up here. You’ll also get a notification.
          </Text>
          <Pressable style={styles.newBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.newBtnText}>Post an announcement</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your updates…"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {filtered.length === 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={36} color="#D1D5DB" />
              <Text style={styles.noResultsTitle}>No matches for "{search.trim()}"</Text>
              <Pressable onPress={() => setSearch('')}>
                <Text style={styles.clearSearch}>Clear search</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {filtered.map(a => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  onDelete={id => setDeleteTarget(id)}
                  canDelete={canDeleteAnnouncement(a)}
                />
              ))}
            </ScrollView>
          )}
        </>
      )}

      <CreateAnnouncementModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchAnnouncements}
      />

      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View style={styles.delOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !deleting && setDeleteTarget(null)} />
          <View style={styles.delSheet}>
            <View style={styles.delIconCircle}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </View>
            <Text style={styles.delTitle}>Delete this announcement?</Text>
            <Text style={styles.delDesc}>This cannot be undone and users will no longer see it.</Text>
            <View style={styles.delActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, deleting && styles.btnDisabled]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 20,
    gap: 12,
  },
  headerTextBlock: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10,
  },
  newBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchIcon: { marginTop: 1 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  noResultsTitle: { fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'center' },
  clearSearch: { fontSize: 14, color: '#2563EB', fontWeight: '600', marginTop: 4 },
  list: { padding: 16, paddingTop: 4, gap: 14 },
  /** Matches staff dashboard `activityCard` / `analyticsCard` */
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  /** Same size and treatment as dashboard `actionIcon` (e.g. documents row) */
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopMain: { flex: 1, minWidth: 0 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  cardMetaRight: {
    flexShrink: 0,
    paddingTop: 2,
    justifyContent: 'flex-end',
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteIconBtn: { padding: 2 },
  recentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentBadgeText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8', letterSpacing: 0.3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', lineHeight: 24 },
  cardMessage: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 12,
    marginBottom: 10,
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileRowText: { flex: 1, minWidth: 0 },
  fileRowLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 2 },
  fileRowName: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  postedLine: { fontSize: 12, color: '#9CA3AF' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
    maxWidth: 300,
  },
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
  textArea: { height: 120, paddingTop: 12 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#2563EB', borderStyle: 'dashed',
    borderRadius: 8, paddingVertical: 14, marginBottom: 16,
  },
  uploadBtnText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  attachedFile: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, marginBottom: 16,
  },
  attachedFileName: { flex: 1, fontSize: 13, color: '#2563EB', fontWeight: '500' },
  removeFileBtn: { padding: 2 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, marginBottom: 16,
  },
  infoText: { fontSize: 13, color: '#2563EB', flex: 1, lineHeight: 18 },
  createBtn: {
    backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', marginBottom: 20,
  },
  btnDisabled: { opacity: 0.6 },
  createBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },

  delOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  delSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  delIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  delTitle: { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' },
  delDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  delActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});