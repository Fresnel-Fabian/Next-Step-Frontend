// app/(shared)/documents.tsx
// Used by both teachers (staff) and students
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

const BASE_URL = 'http://127.0.0.1:8000';

type Tab = 'general' | 'announcements';

interface Document {
  id: number;
  title: string;
  category: string;
  description: string | null;
  fileUrl: string;
  fileSize: number;
  accessLevel: string;
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function DocumentsScreen() {
  const [tab, setTab] = useState<Tab>('general');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const renderDocument = ({ item }: { item: Document }) => (
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
        {item.description ? (
          <Text style={styles.docDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>
      <Pressable style={styles.openBtn} onPress={() => handleOpen(item.fileUrl)}>
        <Ionicons name="open-outline" size={18} color="#2563EB" />
      </Pressable>
    </View>
  );

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
      <Pressable style={styles.openBtn} onPress={() => handleOpen(item.file_url)}>
        <Ionicons name="open-outline" size={18} color="#2563EB" />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.subtitle}>Access your documents and announcements</Text>
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
            <Text style={styles.emptyText}>
              {search ? 'No documents match your search' : 'No documents available yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredDocs}
            keyExtractor={item => String(item.id)}
            renderItem={renderDocument}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        filteredAttachments.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {search ? 'No attachments match your search' : 'No announcement attachments yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredAttachments}
            keyExtractor={item => String(item.id)}
            renderItem={renderAttachment}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    padding: 20, paddingBottom: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#6B7280' },
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
  docDesc: { fontSize: 11, color: '#9CA3AF' },
  openBtn: { padding: 8 },
  separator: { height: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});