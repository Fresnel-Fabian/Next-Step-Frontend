import { DocumentListItem } from '@/components/documents/DocumentListItem';
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
import Toast from 'react-native-toast-message';


export default function AdminDocuments() {
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
      Toast.show({
        type: 'success',
        text1: 'Documents Loaded',
        text2: `${data.length} documents available`,
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Documents',
        text2: 'Please check your connection',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (doc: DocumentItem) => {
    setPreviewDoc(doc);
  };

  const handleDownload = (doc: DocumentItem) => {
    console.log('Download:', doc.title);
    Toast.show({
      type: 'success',
      text1: 'Download Started',
      text2: `Downloading ${doc.title}`,
      position: 'top',
      visibilityTime: 2000,
    });
  };

  const handleShare = (doc: DocumentItem) => {
    Toast.show({
      type: 'success',
      text1: 'Ready to Share',
      text2: `${doc.title} can now be shared`,
      position: 'top',
      visibilityTime: 2000,
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Document Center</Text>
            <Text style={styles.subtitle}>Access and manage important documents</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Document List */}
        <View style={styles.documentList}>
          {filteredDocuments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No documents found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try a different search term' : 'Documents will appear here'}
              </Text>
            </View>
          ) : (
            filteredDocuments.map((doc) => (
              <DocumentListItem
                key={doc.id}
                document={doc}
                onPreview={() => handlePreview(doc)}
                onDownload={() => handleDownload(doc)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={!!previewDoc}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setPreviewDoc(null)}
      >
        {previewDoc && (
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Pressable onPress={() => setPreviewDoc(null)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {previewDoc.title}
                </Text>
                <View style={styles.modalSizeBadge}>
                  <Text style={styles.modalSizeText}>{previewDoc.size}</Text>
                </View>
              </View>
              <View style={styles.modalHeaderRight}>
                <Pressable style={styles.modalIconButton} onPress={() => handleDownload(previewDoc)}>
                  <Ionicons name="download-outline" size={20} color="white" />
                </Pressable>
                <Pressable style={styles.modalIconButton} onPress={() => handleShare(previewDoc)}>
                  <Ionicons name="share-outline" size={20} color="white" />
                </Pressable>
                <Pressable style={styles.modalOpenButton}>
                  <Text style={styles.modalOpenButtonText}>Open</Text>
                </Pressable>
              </View>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentInner}>
              <View style={styles.previewDocument}>
                <Text style={styles.previewTitle}>{previewDoc.title}</Text>
                <Text style={styles.previewCategory}>{previewDoc.category}</Text>

                <View style={styles.previewTOC}>
                  <Text style={styles.previewTOCTitle}>Table of Contents - Page 1</Text>
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
                    Note: This is a preview of the document. Download the full PDF to view all content and features.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerContent: {
    flex: 1,
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  documentList: {
    gap: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
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
    paddingHorizontal: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    backgroundColor: '#1E293B',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 16,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  modalSizeBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
    paddingHorizontal: 16,
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
    padding: 24,
  },
  previewDocument: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    gap: 16,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  },
  previewTOCText: {
    fontSize: 13,
    color: '#4B5563',
  },
  previewTOCPage: {
    fontSize: 12,
    color: '#9CA3AF',
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
