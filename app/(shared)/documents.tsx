import { DocumentListItem } from '@/components/documents/DocumentListItem';
import { DataService, type DocumentItem } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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


export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const categories = ['All Documents', 'Policies', 'Forms', 'Handbooks', 'Resources'];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await DataService.getDocuments();
      setDocuments(data);
      // NEW: Success toast when documents load
      Toast.show({
        type: 'success',
        text1: 'Documents Loaded',
        text2: `${data.length} documents available`,
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      // NEW: Error toast when fetch fails
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

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  //  UPDATED: Download with toast notification
  const handleDownload = (doc: DocumentItem) => {
    console.log('Download:', doc.title);
    
    Toast.show({
      type: 'success',
      text1: 'Download Started',
      text2: `Downloading ${doc.title}`,
      position: 'top',
      visibilityTime: 2000,
    });
    
    // TODO: Implement actual download
    // Simulate download completion after 2 seconds
    setTimeout(() => {
      Toast.show({
        type: 'success',
        text1: 'Download Complete',
        text2: `${doc.title} saved to your device`,
        position: 'top',
        visibilityTime: 2000,
      });
    }, 2000);
  };
  // NEW: Preview handler with toast
  const handlePreview = (doc: DocumentItem) => {
    setPreviewDoc(doc);
    
    Toast.show({
      type: 'info',
      text1: 'Opening Preview',
      text2: doc.title,
      position: 'top',
      visibilityTime: 1500,
    });
  };

  // NEW: Share handler with toast
  const handleShare = (doc: DocumentItem) => {
    Toast.show({
      type: 'success',
      text1: 'Ready to Share',
      text2: `${doc.title} can now be shared`,
      position: 'top',
      visibilityTime: 2000,
    });
    // TODO: Implement actual share functionality
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - UPDATED */}
      <View style={styles.header}>
        {/*  ADD BACK BUTTON */}
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Document Center</Text>
            <Text style={styles.subtitle}>Access and manage important documents</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat, idx) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryButton,
                selectedCategory === idx && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(idx)}
            >
              {selectedCategory === idx && <View style={styles.categoryDot} />}
              <Text style={[
                styles.categoryText,
                selectedCategory === idx && styles.categoryTextActive
              ]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{documents.length}</Text>
            <Text style={styles.statLabel}>Total Documents</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>6</Text>
            <Text style={styles.statLabel}>Added This Week</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Document List */}
        <View style={styles.documentList}>
          {filteredDocuments.map((doc) => (
            <DocumentListItem
              key={doc.id}
              document={doc}
              onPreview={() => handlePreview(doc)}
              onDownload={() => handleDownload(doc)}
            />
          ))}
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
  // ADD THESE NEW STYLES
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
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
  content: {
    flex: 1,
  },
  categoriesScroll: {
    maxHeight: 50,
    marginTop: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#2563EB',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  documentList: {
    padding: 16,
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
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    flex: 1,
  },
  modalSizeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalSizeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalIconButton: {
    padding: 4,
  },
  modalOpenButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalOpenButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 32,
    alignItems: 'center',
  },
  previewDocument: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 600,
    padding: 48,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  previewCategory: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 32,
  },
  previewTOC: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 32,
    marginVertical: 32,
  },
  previewTOCTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  previewTOCList: {
    gap: 16,
  },
  previewTOCItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewTOCText: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewTOCPage: {
    fontSize: 14,
    color: '#6B7280',
  },
  previewNote: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
  },
  previewNoteText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
  },
});