import { resolveFileOpenUrl } from '@/lib/resolveFileUrl';
import { Announcement, CreateAnnouncementData, DataService } from '@/services/dataService';
import { handleApiError } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
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
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [fileUrl, setFileUrl]   = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [titleError, setTitleError]     = useState('');
  const [messageError, setMessageError] = useState('');

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
      Toast.show({ type: 'info', text1: 'Uploading file…', position: 'top', visibilityTime: 2000 });
      const uploaded = await DataService.uploadFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
      setFileUrl(uploaded.fileUrl);
      setFileName(file.name);
      Toast.show({ type: 'success', text1: 'File attached', text2: file.name, position: 'top', visibilityTime: 2000 });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to upload file', position: 'top', visibilityTime: 2000 });
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    let valid = true;
    if (!title.trim()) { setTitleError('Please enter a title'); valid = false; }
    else setTitleError('');
    if (!message.trim()) { setMessageError('Please write a message'); valid = false; }
    else setMessageError('');
    if (!valid) return;

    try {
      setLoading(true);
      await DataService.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        file_url: fileUrl || undefined,
        file_name: fileName || undefined,
      } as CreateAnnouncementData);
      Toast.show({ type: 'success', text1: 'Announcement sent!', text2: 'All users have been notified' });
      handleClose();
      onCreated();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to send announcement' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle(''); setMessage(''); setFileUrl(''); setFileName('');
    setTitleError(''); setMessageError('');
    onClose();
  };

  const canSend = title.trim().length > 0 && message.trim().length > 0 && !uploading;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={ms.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={ms.sheet}>
          {/* Drag handle */}
          <View style={ms.handle} />

          {/* Header */}
          <View style={ms.header}>
            <Text style={ms.title}>New Announcement</Text>
            <Pressable onPress={handleClose} style={ms.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Title field */}
            <Text style={ms.label}>Title <Text style={ms.req}>*</Text></Text>
            <TextInput
              style={[ms.input, !!titleError && ms.inputError]}
              placeholder="e.g. Staff Meeting Tomorrow"
              value={title}
              onChangeText={t => { setTitle(t); if (titleError) setTitleError(''); }}
              placeholderTextColor="#9CA3AF"
              returnKeyType="next"
              maxLength={100}
            />
            {!!titleError && (
              <View style={ms.errorRow}>
                <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                <Text style={ms.errorText}>{titleError}</Text>
              </View>
            )}

            {/* Message field */}
            <View style={ms.labelRow}>
              <Text style={ms.label}>Message <Text style={ms.req}>*</Text></Text>
              <Text style={[ms.charCount, message.length > 450 && ms.charCountWarn]}>
                {message.length}/500
              </Text>
            </View>
            <TextInput
              style={[ms.input, ms.textArea, !!messageError && ms.inputError]}
              placeholder="Write your announcement here…"
              value={message}
              onChangeText={t => { setMessage(t.slice(0, 500)); if (messageError) setMessageError(''); }}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            {!!messageError && (
              <View style={ms.errorRow}>
                <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
                <Text style={ms.errorText}>{messageError}</Text>
              </View>
            )}

            {/* File attachment */}
            <Text style={ms.label}>Attachment <Text style={ms.opt}>(optional)</Text></Text>
            {fileUrl ? (
              <View style={ms.attachedRow}>
                <View style={ms.attachedIconWrap}>
                  <Ionicons name="document-text-outline" size={18} color="#2563EB" />
                </View>
                <Text style={ms.attachedName} numberOfLines={1}>{fileName}</Text>
                <Pressable onPress={() => { setFileUrl(''); setFileName(''); }} hitSlop={8} style={ms.removeBtn}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[ms.uploadBtn, uploading && ms.disabled]}
                onPress={handlePickFile}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#2563EB" />
                    <View>
                      <Text style={ms.uploadLabel}>Pick a file</Text>
                      <Text style={ms.uploadHint}>PDF, Word, Excel, Image</Text>
                    </View>
                  </>
                )}
              </Pressable>
            )}

            {/* Notice */}
            <View style={ms.notice}>
              <Ionicons name="notifications-outline" size={15} color="#2563EB" />
              <Text style={ms.noticeText}>
                A push notification will be sent to all users right away.
              </Text>
            </View>

            {/* Send button */}
            <Pressable
              style={[ms.sendBtn, (!canSend || loading) && ms.sendBtnDisabled]}
              onPress={handleCreate}
              disabled={!canSend || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={16} color="white" />
                  <Text style={ms.sendText}>Send to All Users</Text>
                </>
              )}
            </Pressable>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Helpers (aligned with staff announcements cards) ────────────────────────

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

// ─── Announcement Card (same layout as staff) ────────────────────────────────

function AnnouncementCard({
  announcement,
  onDelete,
}: {
  announcement: Announcement;
  onDelete: (id: number) => void;
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
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.cardIconWrap}>
          <Ionicons name="megaphone-outline" size={24} color="#2563EB" />
        </View>
        <View style={s.cardTopMain}>
          <View style={s.cardTitleRow}>
            <View style={s.cardTitleWrap}>
              <Text style={s.cardTitle} numberOfLines={3}>
                {announcement.title}
              </Text>
            </View>
            <View style={s.cardMetaRight}>
              <View style={s.cardStatusRow}>
                {recent && (
                  <View style={s.recentBadge}>
                    <Text style={s.recentBadgeText}>New</Text>
                  </View>
                )}
                <Pressable onPress={() => onDelete(announcement.id)} style={s.deleteIconBtn} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Text style={s.cardMessage}>{announcement.message}</Text>

      {announcement.fileUrl ? (
        <Pressable style={s.fileRow} onPress={handleOpenFile}>
          <View style={s.fileIconBox}>
            <Ionicons name="document-text-outline" size={18} color="#2563EB" />
          </View>
          <View style={s.fileRowText}>
            <Text style={s.fileRowLabel}>Open attachment</Text>
            <Text style={s.fileRowName} numberOfLines={1}>
              {announcement.fileName || 'Document'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>
      ) : null}

      <Text style={s.postedLine}>Posted {formatCalendarDate(announcement.createdAt)}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showCreate, setShowCreate]       = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState<number | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [search, setSearch]               = useState('');

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setAnnouncements(await DataService.getAnnouncements());
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load announcements' });
    } finally {
      setLoading(false);
    }
  };

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

  const filtered = search.trim()
    ? announcements.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.message.toLowerCase().includes(search.toLowerCase())
      )
    : announcements;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Announcements</Text>
          <Text style={s.headerSub}>
            {loading ? 'Loading…' : `${announcements.length} announcement${announcements.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <Pressable style={s.newBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={s.newBtnText}>New</Text>
        </Pressable>
      </View>

      {/* Search — only when list has items */}
      {!loading && announcements.length > 0 && (
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search announcements…"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      )}

      {/* Body */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={s.loadingText}>Loading announcements…</Text>
        </View>

      ) : announcements.length === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconCircle}>
            <Ionicons name="megaphone-outline" size={36} color="#2563EB" />
          </View>
          <Text style={s.emptyTitle}>No announcements yet</Text>
          <Text style={s.emptyDesc}>
            Tap the button below to send your first announcement to all users.
          </Text>
          <Pressable style={s.newBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={18} color="white" />
            <Text style={s.newBtnText}>Create Announcement</Text>
          </Pressable>
        </View>

      ) : filtered.length === 0 ? (
        <View style={s.centered}>
          <Ionicons name="search-outline" size={36} color="#D1D5DB" />
          <Text style={s.emptyTitle}>No results for "{search}"</Text>
          <Pressable onPress={() => setSearch('')}>
            <Text style={s.clearSearch}>Clear search</Text>
          </Pressable>
        </View>

      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {filtered.map(a => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onDelete={id => setDeleteTarget(id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Create modal */}
      <CreateAnnouncementModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchAnnouncements}
      />

      {/* Delete confirm */}
      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View style={s.delOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !deleting && setDeleteTarget(null)} />
          <View style={s.delSheet}>
            <View style={s.delIconCircle}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </View>
            <Text style={s.delTitle}>Delete this announcement?</Text>
            <Text style={s.delDesc}>
              This cannot be undone and users will no longer see it.
            </Text>
            <View style={s.delActions}>
              <Pressable
                style={s.cancelBtn}
                onPress={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.confirmBtn, deleting && s.disabled]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.confirmText}>Delete</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSub:   { fontSize: 13, color: '#6B7280', marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10,
  },
  newBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },

  // Search bar
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },

  // List
  list: { padding: 16, paddingTop: 4, gap: 14 },

  // Card (matches staff announcements)
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
  recentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentBadgeText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8', letterSpacing: 0.3 },
  deleteIconBtn: { padding: 2 },
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

  // States
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
  emptyWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyDesc:   { fontSize: 13.5, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  clearSearch: { fontSize: 14, color: '#2563EB', fontWeight: '600', marginTop: 4 },

  // Delete modal
  delOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  delSheet: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
    width: '100%', maxWidth: 340, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 16,
  },
  delIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  delTitle:  { fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' },
  delDesc:   { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  delActions:{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center',
  },
  cancelText:  { fontSize: 14, fontWeight: '600', color: '#374151' },
  confirmBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#EF4444', alignItems: 'center',
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  disabled:    { opacity: 0.55 },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingTop: 12, maxHeight: '92%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  title:   { fontSize: 17, fontWeight: '700', color: '#111827' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },

  // Form
  labelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  label:         { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  req:           { color: '#EF4444' },
  opt:           { fontWeight: '400', color: '#9CA3AF' },
  charCount:     { fontSize: 11, color: '#9CA3AF' },
  charCountWarn: { color: '#F59E0B' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: '#111827', marginBottom: 4,
    backgroundColor: '#FAFAFA',
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FFF9F9' },
  textArea:   { height: 110, paddingTop: 11, textAlignVertical: 'top', marginBottom: 4 },
  errorRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  errorText:  { fontSize: 12, color: '#EF4444' },

  // Upload
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#DBEAFE', borderStyle: 'dashed',
    borderRadius: 10, padding: 14, marginBottom: 16,
    backgroundColor: '#F8FAFF',
  },
  uploadLabel: { fontSize: 13.5, color: '#2563EB', fontWeight: '600' },
  uploadHint:  { fontSize: 11.5, color: '#9CA3AF', marginTop: 1 },
  attachedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 16,
  },
  attachedIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
  },
  attachedName: { flex: 1, fontSize: 13, color: '#1E40AF', fontWeight: '500' },
  removeBtn:    { padding: 2 },

  // Notice
  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 18,
  },
  noticeText: { flex: 1, fontSize: 12.5, color: '#1D4ED8', lineHeight: 18 },

  // Send button
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12,
  },
  sendBtnDisabled: { backgroundColor: '#93C5FD' },
  sendText: { color: 'white', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.55 },
});