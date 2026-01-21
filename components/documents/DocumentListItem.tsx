import { DocumentItem } from '@/types/document';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface DocumentListItemProps {
  document: DocumentItem;
  onPreview: () => void;
  onDownload: () => void;
}

export const DocumentListItem = ({ document, onPreview, onDownload }: DocumentListItemProps) => {
  const getDocumentColor = () => {
    switch (document.type) {
      case 'PDF': return { bg: '#FEE2E2', icon: '#DC2626' };
      case 'DOC': return { bg: '#DBEAFE', icon: '#2563EB' };
      case 'XLS': return { bg: '#FEF3C7', icon: '#D97706' };
      default: return { bg: '#F3F4F6', icon: '#6B7280' };
    }
  };

  const colors = getDocumentColor();
  const isAllStaff = document.access === 'All Staff';

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="document-text" size={24} color={colors.icon} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{document.title}</Text>
          <View style={[
            styles.accessBadge,
            { backgroundColor: isAllStaff ? '#D1FAE5' : '#E9D5FF' }
          ]}>
            <Text style={[
              styles.accessText,
              { color: isAllStaff ? '#059669' : '#7C3AED' }
            ]}>
              {document.access}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{document.category}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{document.type}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>{document.size}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>by {document.author} • {document.date}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={onPreview}>
          <Ionicons name="eye-outline" size={16} color="#2563EB" />
          <Text style={styles.actionButtonText}>Preview</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.downloadButton]} onPress={onDownload}>
          <Ionicons name="download-outline" size={16} color="#6B7280" />
          <Text style={[styles.actionButtonText, styles.downloadText]}>Download</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  accessText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  downloadButton: {
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  downloadText: {
    color: '#6B7280',
  },
});