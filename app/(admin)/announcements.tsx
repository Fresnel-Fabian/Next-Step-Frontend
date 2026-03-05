import { Announcement, CreateAnnouncementData, DataService } from '@/services/dataService';
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
      console.log('File asset:', JSON.stringify(file));
      console.log('File object:', (file as any).file);

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
              placeholder="e.g. Staff Meeting Tomorrow"
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

            {/* File attachment */}
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

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({
  announcement,
  onDelete,
}: {
  announcement: Announcement;
  onDelete: (id: number) => void;
}) {
  const handleOpenFile = async () => {
    if (!announcement.fileUrl) return;
    const url = announcement.fileUrl.startsWith('http')
      ? announcement.fileUrl
      : `http://localhost:8000${announcement.fileUrl}`;
    await Linking.openURL(url);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{announcement.title}</Text>
          <Pressable onPress={() => onDelete(announcement.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>
        <Text style={styles.cardTime}>{announcement.time}</Text>
      </View>
      <Text style={styles.cardMessage}>{announcement.message}</Text>
      {announcement.fileUrl && (
        <Pressable style={styles.fileChip} onPress={handleOpenFile}>
          <Ionicons name="document-attach-outline" size={16} color="#2563EB" />
          <Text style={styles.fileChipText}>{announcement.fileName || 'Attached Document'}</Text>
          <Ionicons name="open-outline" size={14} color="#2563EB" />
        </Pressable>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

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

  const handleDelete = (id: number) => {
    const confirmed = window.confirm('Delete this announcement? This cannot be undone.');
    if (!confirmed) return;
    DataService.deleteAnnouncement(id)
      .then(() => {
        Toast.show({ type: 'success', text1: 'Announcement deleted' });
        fetchAnnouncements();
      })
      .catch(() => Toast.show({ type: 'error', text1: 'Failed to delete' }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Text style={styles.headerSub}>Send announcements to all users</Text>
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
          <Ionicons name="megaphone-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No announcements yet</Text>
          <Text style={styles.emptyDesc}>Create one to notify all users</Text>
          <Pressable style={styles.newBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.newBtnText}>Create First Announcement</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {announcements.map(a => (
            <AnnouncementCard key={a.id} announcement={a} onDelete={handleDelete} />
          ))}
        </ScrollView>
      )}

      <CreateAnnouncementModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchAnnouncements}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10,
  },
  newBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  list: { padding: 16, paddingTop: 4, gap: 12 },
  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  cardHeader: { marginBottom: 8 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  cardTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardMessage: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  deleteBtn: { padding: 4 },
  fileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  fileChipText: { fontSize: 13, color: '#2563EB', fontWeight: '500' },
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
});