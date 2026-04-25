// app/(admin)/documents.tsx
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

const BASE_URL = 'http://127.0.0.1:8000';

type Tab = 'general' | 'announcements';
type AccessLevel = 'ALL' | 'TEACHERS' | 'STUDENTS';

interface PickedFile {
  uri: string;
  name: string;
  size: number;
  nativeFile?: globalThis.File;
}

interface Document {
  id: number;
  title: string;
  category: string;
  description: string | null;
  fileUrl: string;
  fileSize: number;
  uploadedBy: number;
  accessLevel: AccessLevel;
  createdAt: string;
}

interface AnnouncementAttachment {
  id: number;
  title: string;
  message: string;
  file_url: string;
  file_name: string | null;
  created_at: string;
}

const ACCESS_LABELS: Record<AccessLevel, { label: string; color: string; bg: string }> = {
  ALL:      { label: 'Everyone',  color: '#059669', bg: '#D1FAE5' },
  TEACHERS: { label: 'Teachers',  color: '#7C3AED', bg: '#F5F3FF' },
  STUDENTS: { label: 'Students',  color: '#2563EB', bg: '#EFF6FF' },
};

const CATEGORIES = ['General', 'Policies', 'Forms', 'Handbooks', 'Reports', 'Other'];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  visible,
  onClose,
  onUploaded,
}: {
  visible: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('ALL');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    setFile({
      uri: asset.uri,
      name: asset.name,
      size: asset.size || 0,
      nativeFile: (asset as any).file ?? undefined,
    });
    if (!title) setTitle(asset.name.replace(/\.[^.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required', position: 'top' });
      return;
    }
    if (!file) {
      Toast.show({ type: 'error', text1: 'Please select a file', position: 'top' });
      return;
    }
    try {
      setUploading(true);

      // Step 1: upload file using native fetch so browser sets correct multipart boundary
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const token = await AsyncStorage.getItem('auth_token');

      const formData = new FormData();
      if (file.nativeFile) {
        formData.append('file', file.nativeFile, file.name);
      } else {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name);
      }

      const uploadRes = await fetch(`${BASE_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const { fileUrl, fileSize } = await uploadRes.json();

      // Step 2: create document record
      await api.post('/api/v1/documents', {
        title: title.trim(),
        category,
        description: description.trim() || null,
        file_url: fileUrl,
        file_size: fileSize,
        access_level: accessLevel,
      });

      Toast.show({ type: 'success', text1: 'Document uploaded!', position: 'top' });
      setTitle(''); setCategory('General'); setDescription('');
      setAccessLevel('ALL'); setFile(null);
      onUploaded();
      onClose();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message || 'Upload failed', position: 'top' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Document</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Document title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={styles.chipRow}>
                {CATEGORIES.map(c => (
                  <Pressable
                    key={c}
                    style={[styles.chip, category === c && styles.chipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Brief description..."
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Visible to</Text>
            <View style={styles.accessRow}>
              {(['ALL', 'TEACHERS', 'STUDENTS'] as AccessLevel[]).map(level => {
                const info = ACCESS_LABELS[level];
                return (
                  <Pressable
                    key={level}
                    style={[styles.accessBtn, accessLevel === level && { backgroundColor: info.bg, borderColor: info.color }]}
                    onPress={() => setAccessLevel(level)}
                  >
                    <Text style={[styles.accessBtnText, accessLevel === level && { color: info.color }]}>
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>File *</Text>
            <Pressable style={styles.filePicker} onPress={pickFile}>
              <Ionicons name="attach-outline" size={20} color="#6B7280" />
              <Text style={[styles.filePickerText, file ? { color: '#111827' } : {}]}>
                {file ? file.name : 'Choose a file...'}
              </Text>
              {file && <Text style={styles.fileSize}>{formatSize(file.size)}</Text>}
            </Pressable>

            <Pressable
              style={[styles.uploadBtn, uploading && styles.btnDisabled]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? <ActivityIndicator color="#fff" />
                : <><Ionicons name="cloud-upload-outline" size={18} color="#fff" /><Text style={styles.uploadBtnText}>Upload Document</Text></>
              }
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminDocumentsScreen() {
  const [tab, setTab] = useState<Tab>('general');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchDocuments(), fetchAttachments()]);
    setLoading(false);
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/api/v1/documents');
      setDocuments(res.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load documents', position: 'top' });
    }
  };

  const fetchAttachments = async () => {
    try {
      const res = await api.get('/api/v1/documents/announcement-attachments');
      setAttachments(res.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load attachments', position: 'top' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/api/v1/documents/${deleteId}`);
      setDocuments(prev => prev.filter(d => d.id !== deleteId));
      Toast.show({ type: 'success', text1: 'Document deleted', position: 'top' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete document', position: 'top' });
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handleOpen = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    if (typeof window !== 'undefined') window.open(fullUrl, '_blank');
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAttachments = attachments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const renderDocument = ({ item }: { item: Document }) => {
    const access = ACCESS_LABELS[item.accessLevel] || ACCESS_LABELS.ALL;
    return (
      <View style={styles.docRow}>
        <View style={styles.docIcon}>
          <Ionicons name="document-text-outline" size={22} color="#2563EB" />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.docMeta}>
            <Text style={styles.docMetaText}>{item.category}</Text>
            <Text style={styles.docMetaDot}>·</Text>
            <Text style={styles.docMetaText}>{formatSize(item.fileSize)}</Text>
            <Text style={styles.docMetaDot}>·</Text>
            <Text style={styles.docMetaText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.accessBadge, { backgroundColor: access.bg }]}>
            <Text style={[styles.accessBadgeText, { color: access.color }]}>{access.label}</Text>
          </View>
        </View>
        <View style={styles.docActions}>
          <Pressable style={styles.docBtn} onPress={() => handleOpen(item.fileUrl)}>
            <Ionicons name="open-outline" size={18} color="#2563EB" />
          </Pressable>
          <Pressable style={styles.docBtn} onPress={() => setDeleteId(item.id)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderAttachment = ({ item }: { item: AnnouncementAttachment }) => (
    <View style={styles.docRow}>
      <View style={[styles.docIcon, { backgroundColor: '#FEF3C7' }]}>
        <Ionicons name="megaphone-outline" size={22} color="#D97706" />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.docMetaText} numberOfLines={1}>{item.message}</Text>
        <Text style={[styles.docMetaText, { marginTop: 2 }]}>{formatDate(item.created_at)}</Text>
      </View>
      <Pressable style={styles.docBtn} onPress={() => handleOpen(item.file_url)}>
        <Ionicons name="open-outline" size={18} color="#2563EB" />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.subtitle}>Manage and share documents</Text>
        </View>
        <Pressable style={styles.uploadHeaderBtn} onPress={() => setShowUpload(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.uploadHeaderBtnText}>Upload</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['general', 'announcements'] as Tab[]).map(t => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => { setTab(t); setSearch(''); }}
          >
            <Ionicons
              name={t === 'general' ? 'folder-outline' : 'megaphone-outline'}
              size={15}
              color={tab === t ? '#fff' : '#6B7280'}
            />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'general' ? 'General' : 'From Announcements'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder={tab === 'general' ? 'Search documents...' : 'Search announcements...'}
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
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : tab === 'general' ? (
        filteredDocs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>{search ? 'No documents match your search' : 'No documents yet'}</Text>
            {!search && (
              <Pressable style={styles.uploadEmptyBtn} onPress={() => setShowUpload(true)}>
                <Text style={styles.uploadEmptyBtnText}>Upload First Document</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredDocs}
            keyExtractor={item => String(item.id)}
            renderItem={renderDocument}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )
      ) : (
        filteredAttachments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>{search ? 'No attachments match your search' : 'No announcement attachments yet'}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAttachments}
            keyExtractor={item => String(item.id)}
            renderItem={renderAttachment}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )
      )}

      {/* Upload Modal */}
      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={fetchDocuments}
      />

      {/* Delete Confirmation */}
      <Modal visible={!!deleteId} transparent animationType="fade">
        <Pressable style={styles.confirmOverlay} onPress={() => setDeleteId(null)}>
          <Pressable style={styles.confirmBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.confirmTitle}>Delete Document?</Text>
            <Text style={styles.confirmMsg}>The file will be permanently removed.</Text>
            <View style={styles.confirmBtns}>
              <Pressable style={styles.confirmCancel} onPress={() => setDeleteId(null)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmDelete, deleteLoading && styles.btnDisabled]}
                onPress={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.confirmDeleteText}>Delete</Text>
                }
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingBottom: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#6B7280' },
  uploadHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  uploadHeaderBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  tabs: {
    flexDirection: 'row', backgroundColor: '#F3F4F6',
    margin: 16, marginBottom: 0, borderRadius: 12, padding: 4, gap: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 9,
  },
  tabActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, margin: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  list: { padding: 16, paddingTop: 8 },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 14,
  },
  docIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  docInfo: { flex: 1, gap: 3 },
  docTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docMetaText: { fontSize: 11, color: '#9CA3AF' },
  docMetaDot: { fontSize: 11, color: '#D1D5DB' },
  docActions: { flexDirection: 'row', gap: 4 },
  docBtn: { padding: 8 },
  accessBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  accessBadgeText: { fontSize: 10, fontWeight: '600' },
  separator: { height: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  uploadEmptyBtn: {
    backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8,
  },
  uploadEmptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: '#111827', marginBottom: 16,
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#2563EB', fontWeight: '600' },
  accessRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  accessBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  accessBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed',
    borderRadius: 10, padding: 14, marginBottom: 20, backgroundColor: '#F9FAFB',
  },
  filePickerText: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  fileSize: { fontSize: 12, color: '#9CA3AF' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, marginBottom: 20,
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, gap: 12 },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  confirmMsg: { fontSize: 14, color: '#6B7280' },
  confirmBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  confirmCancel: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  confirmCancelText: { fontWeight: '600', color: '#6B7280' },
  confirmDelete: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center' },
  confirmDeleteText: { fontWeight: '600', color: '#fff' },
});