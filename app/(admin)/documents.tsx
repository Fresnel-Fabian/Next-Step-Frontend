import { DocumentListItem } from "@/components/documents/DocumentListItem";
import {
  downloadFile,
  listAllFiles,
  listRecentFiles,
  listSharedWithMe,
  openSharingSettings,
  previewFile,
  searchFiles,
  SORT_LABELS,
  sortDocuments,
  SortOption,
  uploadFile,
} from "@/services/googleDriveService";
import { DocumentItem } from "@/types/document";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DriveCategory = "all" | "recent" | "shared with me";

const CATEGORIES: { label: string; value: DriveCategory; icon: string }[] = [
  { label: "All Files", value: "all", icon: "grid-outline" },
  { label: "Recent", value: "recent", icon: "time-outline" },
  { label: "Shared with me", value: "shared with me", icon: "people-outline" },
];

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<DriveCategory>("all");
  const [sortOption, setSortOption] = useState<SortOption>("viewedByMe_desc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      setSearch("");

      let data: DocumentItem[];
      if (selectedCategory === "shared with me") {
        data = await listSharedWithMe();
      } else if (selectedCategory === "recent") {
        data = await listRecentFiles();
      } else {
        data = await listAllFiles();
      }

      setDocuments(sortDocuments(data, sortOption));
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
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

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await downloadFile(doc);
    } catch (err: any) {
      Alert.alert("Download failed", err.message);
    }
  };

  const handleShare = async (doc: DocumentItem) => {
    try {
      await openSharingSettings(doc);
    } catch (err: any) {
      Alert.alert("Could not open sharing", err.message);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);

      const uploaded = await uploadFile(
        file.name,
        file.uri,
        file.mimeType ?? "application/octet-stream",
      );

      // Add to top of list and ask if user wants to open sharing settings
      setDocuments((prev) => sortDocuments([uploaded, ...prev], sortOption));

      Alert.alert(
        "Upload successful",
        `"${file.name}" was uploaded to your Drive. Would you like to set sharing permissions now?`,
        [
          { text: "Later", style: "cancel" },
          { text: "Share now", onPress: () => handleShare(uploaded) },
        ],
      );
    } catch (err: any) {
      Alert.alert("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  // ─── Filtered list ────────────────────────────────────────────────────────
  const displayedDocuments =
    search.length > 0
      ? documents.filter((d) =>
          d.title.toLowerCase().includes(search.toLowerCase()),
        )
      : documents;

  // ─── Header ───────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View>
      {/* Page title + Upload + Sort */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Documents</Text>
          <Text style={styles.pageSubtitle}>
            {documents.length} file{documents.length !== 1 ? "s" : ""}
            {selectedCategory !== "all" ? ` · ${selectedCategory}` : ""}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Upload button */}
          <Pressable
            style={[styles.uploadButton, uploading && { opacity: 0.6 }]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={18} color="white" />
            )}
            <Text style={styles.uploadButtonText}>
              {uploading ? "Uploading…" : "Upload"}
            </Text>
          </Pressable>

          {/* Sort dropdown trigger */}
          <View>
            <Pressable
              style={styles.sortButton}
              onPress={() => setSortMenuOpen((v) => !v)}
            >
              <Ionicons name="funnel-outline" size={16} color="#374151" />
              <Ionicons
                name={sortMenuOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color="#374151"
              />
            </Pressable>

            {/* Dropdown menu */}
            {sortMenuOpen && (
              <Animated.View
                style={[
                  styles.sortDropdown,
                  {
                    opacity: dropdownAnim,
                    transform: [
                      {
                        translateY: dropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-6, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                  ([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.sortOption,
                        sortOption === key && styles.sortOptionActive,
                      ]}
                      onPress={() => handleSortChange(key)}
                    >
                      {sortOption === key && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#2563EB"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.sortOptionText,
                          sortOption === key && styles.sortOptionTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </Animated.View>
            )}
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={18}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Drive..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
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

      {!loading && displayedDocuments.length > 0 && (
        <Text style={styles.summaryText}>
          {displayedDocuments.length} result
          {displayedDocuments.length !== 1 ? "s" : ""} ·{" "}
          {SORT_LABELS[sortOption]}
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cloud-outline" size={52} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No documents found</Text>
        <Text style={styles.emptySubtitle}>
          {search
            ? `No Drive files matching "${search}"`
            : selectedCategory === "shared with me"
              ? "No files have been shared with you yet"
              : selectedCategory === "recent"
                ? "No recently viewed files"
                : "Upload a file or ask someone to share one with you"}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading from Google Drive…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadDocuments()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={() => setSortMenuOpen(false)}>
      <FlatList
        data={displayedDocuments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DocumentListItem
            document={item}
            onPreview={() => handlePreview(item)}
            onDownload={() => handleDownload(item)}
            onDelete={() => handleShare(item)} // Admins manage via Drive sharing
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        onRefresh={() => loadDocuments(true)}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
      />
    </Pressable>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    gap: 12,
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
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
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
  },
  sortDropdown: {
    position: "absolute",
    top: 44,
    right: 0,
    width: 220,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    overflow: "hidden",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sortOptionActive: {
    backgroundColor: "#EFF6FF",
  },
  sortOptionText: {
    fontSize: 13,
    color: "#374151",
  },
  sortOptionTextActive: {
    color: "#2563EB",
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
