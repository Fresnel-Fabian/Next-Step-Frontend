import { DocumentItem } from "@/types/document";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface DocumentListItemProps {
  document: DocumentItem;
  onPreview: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  /** Narrow width — tighter padding and typography (matches dashboard breakpoint) */
  compact?: boolean;
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
  compact = false,
}: DocumentListItemProps) => {
  const colors = TYPE_COLORS[document.type] ?? TYPE_COLORS.FILE;
  const isAllStaff = document.access === "All Staff";

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.bg }, compact && styles.iconContainerCompact]}>
        <Ionicons name="document-text" size={compact ? 22 : 24} color={colors.icon} />
        <Text style={[styles.typeLabel, { color: colors.icon }]}>
          {document.type}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.titleRow, compact && styles.titleRowCompact]}>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
            {document.title}
          </Text>
          <View
            style={[
              styles.accessBadge,
              compact && styles.accessBadgeCompact,
              { backgroundColor: isAllStaff ? "#D1FAE5" : "#E9D5FF" },
            ]}
          >
            <Text
              style={[
                styles.accessText,
                compact && styles.accessTextCompact,
                { color: isAllStaff ? "#059669" : "#7C3AED" },
              ]}
              numberOfLines={1}
            >
              {document.access}
            </Text>
          </View>
        </View>

        <Text style={[styles.metaText, compact && styles.metaTextCompact]} numberOfLines={compact ? 3 : 2}>
          {document.category} · {document.size} · {document.author} · {document.date}
        </Text>

        {document.description ? (
          <Text style={[styles.description, compact && styles.descriptionCompact]} numberOfLines={compact ? 2 : 1}>
            {document.description}
          </Text>
        ) : null}
      </View>

      <View style={[styles.actions, compact && styles.actionsCompact]}>
        <Pressable style={[styles.actionButton, compact && styles.actionButtonCompact]} onPress={onPreview} hitSlop={6}>
          <Ionicons name="eye-outline" size={compact ? 15 : 16} color="#2563EB" />
          <Text style={styles.previewText}>Preview</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.downloadButton, compact && styles.actionButtonCompact]}
          onPress={onDownload}
          hitSlop={6}
        >
          <Ionicons name="download-outline" size={compact ? 15 : 16} color="#6B7280" />
          <Text style={styles.downloadText}>Download</Text>
        </Pressable>

        {onDelete ? (
          <Pressable
            style={[styles.actionButton, styles.deleteButton, compact && styles.deleteButtonCompact]}
            onPress={onDelete}
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={compact ? 15 : 16} color="#DC2626" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  containerCompact: {
    padding: 12,
    gap: 10,
    borderRadius: 12,
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
  iconContainerCompact: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  content: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  titleRowCompact: {
    flexWrap: "wrap",
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    minWidth: 0,
  },
  titleCompact: {
    fontSize: 14,
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexShrink: 0,
  },
  accessBadgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  accessText: {
    fontSize: 10,
    fontWeight: "600",
  },
  accessTextCompact: {
    fontSize: 9,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  metaTextCompact: {
    fontSize: 11,
    lineHeight: 17,
  },
  description: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  descriptionCompact: {
    fontSize: 11,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 2,
  },
  actionsCompact: {
    gap: 6,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  actionButtonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  downloadButton: {
    backgroundColor: "#F3F4F6",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
  },
  deleteButtonCompact: {
    paddingHorizontal: 9,
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
