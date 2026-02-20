import { DocumentListItem } from "@/components/documents/DocumentListItem";
import { DataService } from "@/services/dataService";
import { DocumentCategory, DocumentItem } from "@/types/document";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const CATEGORIES: { label: string; value: DocumentCategory }[] = [
  { label: "All", value: "all" },
  { label: "Policies", value: "policies" },
  { label: "Forms", value: "forms" },
  { label: "Handbooks", value: "handbooks" },
  { label: "Resources", value: "resources" },
];

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory]);

  const loadDocuments = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const data = await DataService.getDocuments(
        selectedCategory !== "all" ? selectedCategory : undefined,
      );
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearch(text);
    if (text.length === 0 || text.length >= 2) {
      try {
        const data = await DataService.getDocuments(
          selectedCategory !== "all" ? selectedCategory : undefined,
          text || undefined,
        );
        setDocuments(data);
      } catch {
        // silently fail on search errors
      }
    }
  };

  const handlePreview = (doc: DocumentItem) => {
    // Phase 2: open with expo-web-browser using doc.fileUrl or doc.driveFileId
    Alert.alert("Preview", `Opening: ${doc.title}\n\nURL: ${doc.fileUrl}`);
  };

  const handleDownload = (doc: DocumentItem) => {
    // Phase 2: use expo-file-system to download
    Alert.alert("Download", `Downloading: ${doc.title}`);
  };

  const handleDelete = (doc: DocumentItem) => {
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete "${doc.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await DataService.deleteDocument(doc.id);
              setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete document");
            }
          },
        },
      ],
    );
  };

  const filteredDocuments = documents.filter((doc) =>
    search.length > 0
      ? doc.title.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const renderHeader = () => (
    <View>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Documents</Text>
          <Text style={styles.pageSubtitle}>
            {documents.length} file{documents.length !== 1 ? "s" : ""} total
          </Text>
        </View>
        <Pressable style={styles.uploadButton}>
          <Ionicons name="cloud-upload-outline" size={18} color="white" />
          <Text style={styles.uploadButtonText}>Upload</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category Filter */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === item.value && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.value)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item.value &&
                  styles.categoryChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
        style={styles.categoriesList}
      />

      {/* Summary row */}
      {!loading && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            Showing {filteredDocuments.length} document
            {filteredDocuments.length !== 1 ? "s" : ""}
            {selectedCategory !== "all" ? ` in ${selectedCategory}` : ""}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No documents found</Text>
        <Text style={styles.emptySubtitle}>
          {search
            ? `No results for "${search}"`
            : selectedCategory !== "all"
              ? `No documents in ${selectedCategory}`
              : "Upload your first document to get started"}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadDocuments()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDocuments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DocumentListItem
            document={item}
            onPreview={() => handlePreview(item)}
            onDownload={() => handleDownload(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        onRefresh={() => loadDocuments(true)}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
    fontSize: 14,
    color: "#111827",
  },
  categoriesList: {
    marginBottom: 12,
  },
  categoriesContainer: {
    gap: 8,
    paddingRight: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
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
  summaryRow: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 12,
    color: "#9CA3AF",
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
  },
});
