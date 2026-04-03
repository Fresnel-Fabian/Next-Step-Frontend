import { DataService } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

type FilterType = 'all' | 'unread' | 'document' | 'poll' | 'announcement';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  entityType?: string;
  fileUrl?: string;
  read: boolean;
  time: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await DataService.getNotifications();
      setNotifications(data as any);
      const unreadCount = data.filter(n => !n.read).length;
      if (unreadCount > 0) {
        Toast.show({
          type: 'info',
          text1: 'Notifications Loaded',
          text2: `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`,
          position: 'top',
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Notifications',
        text2: 'Please try again',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
  try {
    await DataService.markNotificationRead(Number(id));
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    Toast.show({ type: 'success', text1: 'Marked as Read', position: 'top', visibilityTime: 1500 });
  } catch {
    Toast.show({ type: 'error', text1: 'Failed to mark as read', position: 'top', visibilityTime: 1500 });
  }
};

const markAllAsRead = async () => {
  const unreadCount = notifications.filter(n => !n.read).length;
  if (unreadCount === 0) {
    Toast.show({ type: 'info', text1: 'No Unread Notifications', position: 'top', visibilityTime: 2000 });
    return;
  }
  try {
    await DataService.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    Toast.show({
      type: 'success',
      text1: 'All Marked as Read',
      text2: `${unreadCount} notification${unreadCount > 1 ? 's' : ''} marked`,
      position: 'top',
      visibilityTime: 2000,
    });
  } catch {
    Toast.show({ type: 'error', text1: 'Failed to mark all as read', position: 'top', visibilityTime: 2000 });
  }
};

  const archiveNotification = async (id: string) => {
  try {
    await DataService.deleteNotification(Number(id));
    setNotifications(prev => prev.filter(n => n.id !== id));
    Toast.show({ type: 'success', text1: 'Notification Archived', position: 'top', visibilityTime: 1500 });
  } catch {
    Toast.show({ type: 'error', text1: 'Failed to archive', position: 'top', visibilityTime: 1500 });
  }
};

  const handleDownload = async (fileUrl: string) => {
    try {
      // Build full URL if it's a relative path
      const fullUrl = fileUrl.startsWith('http')
        ? fileUrl
        : `http://localhost:8000${fileUrl}`;
      await Linking.openURL(fullUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open file', position: 'top', visibilityTime: 2000 });
    }
  };

  const getNotificationStyle = (notification: Notification) => {
    const entity = notification.entityType;

    if (entity === 'poll') return {
      borderColor: '#8B5CF6',
      iconBg: '#EDE9FE',
      iconColor: '#8B5CF6',
      icon: 'bar-chart' as const,
      label: 'Poll',
    };
    if (entity === 'document') return {
      borderColor: '#3B82F6',
      iconBg: '#DBEAFE',
      iconColor: '#3B82F6',
      icon: 'document-text' as const,
      label: 'Document',
    };
    if (entity === 'announcement') return {
      borderColor: '#F59E0B',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      icon: 'megaphone' as const,
      label: 'Announcement',
    };
    if (notification.type === 'error') return {
      borderColor: '#EF4444',
      iconBg: '#FEE2E2',
      iconColor: '#EF4444',
      icon: 'alert-circle' as const,
      label: 'Alert',
    };
    return {
      borderColor: '#E5E7EB',
      iconBg: '#F3F4F6',
      iconColor: '#6B7280',
      icon: 'notifications' as const,
      label: 'Info',
    };
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread': return notifications.filter(n => !n.read);
      case 'document': return notifications.filter(n => n.entityType === 'document');
      case 'poll': return notifications.filter(n => n.entityType === 'poll');
      case 'announcement': return notifications.filter(n => n.entityType === 'announcement');
      default: return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const docCount = notifications.filter(n => n.entityType === 'document').length;
  const pollCount = notifications.filter(n => n.entityType === 'poll').length;
  const announcementCount = notifications.filter(n => n.entityType === 'announcement').length;

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
        <View style={styles.headerContent}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>{unreadCount} unread</Text>
        </View>
        <Pressable onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllButtonText}>Mark All</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {([
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'announcement', label: `Announcements (${announcementCount})` },
          { key: 'document', label: `Documents (${docCount})` },
          { key: 'poll', label: `Polls (${pollCount})` },
        ] as const).map(f => (
          <Pressable
            key={f.key}
            style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterButtonText, filter === f.key && styles.filterButtonTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No notifications</Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => {
            const s = getNotificationStyle(notification);
            return (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  { borderLeftColor: s.borderColor },
                  notification.read && styles.notificationCardRead,
                ]}
              >
                {!notification.read && <View style={styles.unreadDot} />}

                <View style={styles.notificationContent}>
                  <View style={[styles.iconContainer, { backgroundColor: s.iconBg }]}>
                    <Ionicons name={s.icon} size={24} color={s.iconColor} />
                  </View>

                  <View style={styles.notificationText}>
                    {/* Entity type label */}
                    <View style={[styles.entityLabel, { backgroundColor: s.iconBg }]}>
                      <Text style={[styles.entityLabelText, { color: s.iconColor }]}>{s.label}</Text>
                    </View>

                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationMeta}>{notification.time}</Text>

                    {/* Download button if file attached */}
                    {notification.fileUrl && (
                      <Pressable
                        style={styles.downloadBtn}
                        onPress={() => handleDownload(notification.fileUrl!)}
                      >
                        <Ionicons name="download-outline" size={16} color="#2563EB" />
                        <Text style={styles.downloadBtnText}>Download File</Text>
                      </Pressable>
                    )}

                    {/* Actions */}
                    <View style={styles.notificationActions}>
                      {!notification.read && (
                        <Pressable onPress={() => markAsRead(notification.id)}>
                          <Text style={styles.actionButton}>Mark as Read</Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => archiveNotification(notification.id)}>
                        <Text style={[styles.actionButton, styles.actionButtonSecondary]}>Archive</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 8 },
  headerContent: { flex: 1, marginLeft: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  markAllButton: { paddingHorizontal: 12, paddingVertical: 6 },
  markAllButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  filtersScroll: { maxHeight: 60, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filtersContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' },
  filterButtonActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  filterButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  filterButtonTextActive: { color: '#2563EB' },
  content: { flex: 1 },
  contentInner: { padding: 16, gap: 12 },
  notificationCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    borderLeftWidth: 4, borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1,
    borderRightColor: '#F3F4F6', borderTopColor: '#F3F4F6', borderBottomColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
    position: 'relative',
  },
  notificationCardRead: { opacity: 0.7 },
  unreadDot: { position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  notificationContent: { flexDirection: 'row', gap: 12 },
  iconContainer: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  notificationText: { flex: 1 },
  entityLabel: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  entityLabelText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  notificationTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  notificationMessage: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 6 },
  notificationMeta: { fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, marginBottom: 10, alignSelf: 'flex-start',
  },
  downloadBtnText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  notificationActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  actionButton: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  actionButtonSecondary: { color: '#9CA3AF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyStateText: { fontSize: 16, color: '#9CA3AF', marginTop: 16 },
});