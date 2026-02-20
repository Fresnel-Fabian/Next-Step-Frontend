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

const CATEGORIES: { label: string; value: DocumentCategory; icon: string }[] = [
  { label: "All", value: "all", icon: "grid-outline" },
  { label: "Policies", value: "policies", icon: "shield-checkmark-outline" },
  { label: "Forms", value: "forms", icon: "create-outline" },
  { label: "Handbooks", value: "handbooks", icon: "book-outline" },
  { label: "Resources", value: "resources", icon: "folder-outline" },
];

export default function StaffDocuments() {
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
        // silently fail
      }
    }
  };

  const handlePreview = (doc: DocumentItem) => {
    // Phase 2: expo-web-browser
    Alert.alert("Preview", `Opening: ${doc.title}`);
  };

  const handleDownload = (doc: DocumentItem) => {
    // Phase 2: expo-file-system + expo-sharing
    Alert.alert("Download", `Downloading: ${doc.title}`);
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
        <Text style={styles.pageTitle}>Documents</Text>
        <Text style={styles.pageSubtitle}>
          {documents.length} file{documents.length !== 1 ? "s" : ""} available
        </Text>
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

      {/* Category Filter — scrollable chips with icons */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.categoriesContainer}
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
        style={styles.categoriesList}
      />

      {!loading && filteredDocuments.length > 0 && (
        <Text style={styles.summaryText}>
          {filteredDocuments.length} document
          {filteredDocuments.length !== 1 ? "s" : ""}
          {selectedCategory !== "all" ? ` · ${selectedCategory}` : ""}
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={52} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No documents found</Text>
        <Text style={styles.emptySubtitle}>
          {search
            ? `No results for "${search}"`
            : selectedCategory !== "all"
              ? `No ${selectedCategory} documents available`
              : "No documents have been shared yet"}
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
            // No onDelete — staff cannot delete documents
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
  },
});
