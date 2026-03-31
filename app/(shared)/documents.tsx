import { DocumentListItem } from '@/components/documents/DocumentListItem';
import { DataService, DocumentItem } from '@/services/dataService';
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


export default function AdminDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<DriveCategory>("all");
  const [sortOption, setSortOption] = useState<SortOption>("viewedByMe_desc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Animate sort dropdown
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: sortMenuOpen ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [sortMenuOpen]);

  // ─── Load documents by category ──────────────────────────────────────────
  useEffect(() => {
    loadDocuments();
  }, [selectedCategory]);

  const loadDocuments = async (isRefresh = false) => {
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
      setRefreshing(false);
    }
  };

  // ─── Re-sort in place without refetching ─────────────────────────────────
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setSortMenuOpen(false);
    setDocuments((prev) => sortDocuments(prev, option));
  };

  // ─── Search ───────────────────────────────────────────────────────────────
  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.length === 0) {
      loadDocuments();
      return;
    }
    if (text.length >= 2) {
      try {
        const results = await searchFiles(text);
        setDocuments(sortDocuments(results, sortOption));
      } catch {
        // fail silently on search
      }
    }
  };

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handlePreview = async (doc: DocumentItem) => {
    try {
      await previewFile(doc);
    } catch (err: any) {
      Alert.alert("Preview failed", err.message);
    }
  };

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
        <View style={styles.headerTop}>
          
          <View style={styles.headerContent}>
            <Text style={styles.title}>Document Center</Text>
            <Text style={styles.subtitle}>Access and manage important documents</Text>
          </View>
        </View>
      </View>

      {/* Category chips */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesList}
        renderItem={({ item }) => {
          const isActive = selectedCategory === item.value;
          return (
            <Pressable
              style={[
                styles.categoryChip,
                isActive && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.value)}
            >
              <Ionicons
                name={item.icon as any}
                size={14}
                color={isActive ? "white" : "#6B7280"}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
  categoriesList: {
    marginBottom: 12,
  },
  categoriesContainer: {
    gap: 8,
    paddingRight: 4,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  categoryChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  categoryChipTextActive: {
    color: "white",
  },
  summaryText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
