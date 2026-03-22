import { DocumentItem } from "@/types/document";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface DocumentListItemProps {
  document: DocumentItem;
  onPreview: () => void;
  onDownload: () => void;
  onDelete?: () => void; // Only shown when provided (admin only)
}

const TYPE_COLORS: Record<string, { bg: string; icon: string }> = {
  PDF: { bg: "#FEE2E2", icon: "#DC2626" },
  DOC: { bg: "#DBEAFE", icon: "#2563EB" },
  XLS: { bg: "#D1FAE5", icon: "#059669" },
  FILE: { bg: "#F3F4F6", icon: "#6B7280" },
};

export const DocumentListItem = ({
  document,
  onPreview,
  onDownload,
  onDelete,
}: DocumentListItemProps) => {
  const colors = TYPE_COLORS[document.type] ?? TYPE_COLORS.FILE;
  const isAllStaff = document.access === "All Staff";

  return (
    <View style={styles.container}>
      {/* File icon */}
      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="document-text" size={24} color={colors.icon} />
        <Text style={[styles.typeLabel, { color: colors.icon }]}>
          {document.type}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {document.title}
          </Text>
          <View
            style={[
              styles.accessBadge,
              { backgroundColor: isAllStaff ? "#D1FAE5" : "#E9D5FF" },
            ]}
          >
            <Text
              style={[
                styles.accessText,
                { color: isAllStaff ? "#059669" : "#7C3AED" },
              ]}
            >
              {document.access}
            </Text>
          </View>
        </View>

        <Text style={styles.metaText}>
          {document.category} · {document.size} · {document.author} ·{" "}
          {document.date}
        </Text>

        {document.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {document.description}
          </Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={onPreview}>
          <Ionicons name="eye-outline" size={16} color="#2563EB" />
          <Text style={styles.previewText}>Preview</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.downloadButton]}
          onPress={onDownload}
        >
          <Ionicons name="download-outline" size={16} color="#6B7280" />
          <Text style={styles.downloadText}>Download</Text>
        </Pressable>

        {onDelete && (
          <Pressable
            style={[styles.actionButton, styles.deleteButton]}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  accessText: {
    fontSize: 10,
    fontWeight: "600",
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  description: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  downloadButton: {
    backgroundColor: "#F3F4F6",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
  },
  previewText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  downloadText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
});
