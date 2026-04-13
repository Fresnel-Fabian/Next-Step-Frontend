import { DocumentListItem } from '@/components/documents/DocumentListItem';
import { useDashboardCompact } from '@/lib/dashboardResponsive';
import { DataService, DocumentItem } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { isCompact, contentPaddingX, contentPaddingY, sectionGap } = useDashboardCompact();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await DataService.getDocuments();
      setDocuments(data);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to load documents',
        text2: 'Check your connection and try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const headerTop = Math.max(insets.top, 10) + (isCompact ? 6 : 10);

  const handlePreview = (doc: DocumentItem) => {
    setPreviewDoc(doc);
  };

  const handleDownload = (doc: DocumentItem) => {
    console.log('Download:', doc.title);
    Toast.show({
      type: 'success',
      text1: 'Download started',
      text2: doc.title,
      position: 'top',
      visibilityTime: 2000,
    });
  };

  const handleShare = (doc: DocumentItem) => {
    Toast.show({
      type: 'success',
      text1: 'Ready to share',
      text2: doc.title,
      position: 'top',
      visibilityTime: 2000,
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingHorizontal: contentPaddingX }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingHint}>Loading documents…</Text>
      </View>
    );
  }

  const modalTop = Math.max(insets.top, 12);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          isCompact && styles.headerCompact,
          {
            paddingHorizontal: contentPaddingX,
            paddingTop: headerTop,
            paddingBottom: isCompact ? 12 : 14,
          },
        ]}
      >
        <View style={styles.headerTextBlock}>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>Document Center</Text>
          <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
            Access and manage important documents
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: contentPaddingX,
          paddingTop: isCompact ? 8 : 12,
          paddingBottom: contentPaddingY + Math.max(insets.bottom, 12),
          gap: sectionGap,
        }}
      >
        <View style={[styles.searchContainer, isCompact && styles.searchContainerCompact]}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents…"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={isCompact ? 44 : 48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No documents found</Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try a different search term' : 'Documents will appear here when available'}
            </Text>
          </View>
        ) : (
          filteredDocuments.map(doc => (
            <DocumentListItem
              key={doc.id}
              document={doc}
              compact={isCompact}
              onPreview={() => handlePreview(doc)}
              onDownload={() => handleDownload(doc)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!previewDoc}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setPreviewDoc(null)}
      >
        {previewDoc ? (
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalHeader,
                isCompact && styles.modalHeaderCompact,
                { paddingTop: modalTop + 8, paddingHorizontal: contentPaddingX },
              ]}
            >
              <View style={styles.modalHeaderLeft}>
                <Pressable onPress={() => setPreviewDoc(null)} style={styles.closeButton} hitSlop={12}>
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
                <Text style={[styles.modalTitle, isCompact && styles.modalTitleCompact]} numberOfLines={1}>
                  {previewDoc.title}
                </Text>
                <View style={styles.modalSizeBadge}>
                  <Text style={styles.modalSizeText}>{previewDoc.size}</Text>
                </View>
              </View>
              <View style={[styles.modalHeaderRight, isCompact && styles.modalHeaderRightCompact]}>
                <Pressable style={styles.modalIconButton} onPress={() => handleDownload(previewDoc)} hitSlop={8}>
                  <Ionicons name="download-outline" size={20} color="white" />
                </Pressable>
                <Pressable style={styles.modalIconButton} onPress={() => handleShare(previewDoc)} hitSlop={8}>
                  <Ionicons name="share-outline" size={20} color="white" />
                </Pressable>
                <Pressable style={styles.modalOpenButton}>
                  <Text style={styles.modalOpenButtonText}>Open</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={[
                styles.modalContentInner,
                { paddingHorizontal: contentPaddingX, paddingBottom: contentPaddingY + Math.max(insets.bottom, 16) },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.previewDocument, isCompact && styles.previewDocumentCompact]}>
                <Text style={styles.previewTitle}>{previewDoc.title}</Text>
                <Text style={styles.previewCategory}>{previewDoc.category}</Text>

                <View style={styles.previewTOC}>
                  <Text style={styles.previewTOCTitle}>Table of Contents — Page 1</Text>
                  <View style={styles.previewTOCList}>
                    <View style={styles.previewTOCItem}>
                      <Text style={styles.previewTOCText}>1. Introduction</Text>
                      <Text style={styles.previewTOCPage}>Page 1</Text>
                    </View>
                    <View style={styles.previewTOCItem}>
                      <Text style={styles.previewTOCText}>2. Mission and Values</Text>
                      <Text style={styles.previewTOCPage}>Page 3</Text>
                    </View>
                    <View style={styles.previewTOCItem}>
                      <Text style={styles.previewTOCText}>3. Policies and Procedures</Text>
                      <Text style={styles.previewTOCPage}>Page 5</Text>
                    </View>
                    <View style={styles.previewTOCItem}>
                      <Text style={styles.previewTOCText}>4. Code of Conduct</Text>
                      <Text style={styles.previewTOCPage}>Page 8</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.previewNote}>
                  <Text style={styles.previewNoteText}>
                    Note: This is a preview. Download the full file to view all content.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  loadingHint: { fontSize: 14, color: '#9CA3AF' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerCompact: { alignItems: 'center' },
  headerTextBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  titleCompact: { fontSize: 20 },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  subtitleCompact: { fontSize: 13 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    minHeight: 44,
    paddingVertical: 8,
  },
  searchContainerCompact: {
    paddingHorizontal: 10,
    minHeight: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    paddingHorizontal: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    backgroundColor: '#1E293B',
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  modalHeaderCompact: {
    paddingBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 160,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  modalHeaderRightCompact: {
    width: '100%',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    minWidth: 0,
  },
  modalTitleCompact: { fontSize: 15 },
  modalSizeBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    flexShrink: 0,
  },
  modalSizeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '500',
  },
  modalIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalOpenButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalOpenButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    paddingTop: 20,
  },
  previewDocument: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewDocumentCompact: {
    padding: 16,
    gap: 12,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  previewCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewTOC: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewTOCTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  previewTOCList: {
    gap: 8,
  },
  previewTOCItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  previewTOCText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  previewTOCPage: {
    fontSize: 12,
    color: '#9CA3AF',
    flexShrink: 0,
  },
  previewNote: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  previewNoteText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
});
