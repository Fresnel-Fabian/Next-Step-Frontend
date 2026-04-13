import { useDashboardCompact } from '@/lib/dashboardResponsive';
import { resolveFileOpenUrl } from '@/lib/resolveFileUrl';
import { DataService } from '@/services/dataService';
import { Ionicons } from '@expo/vector-icons';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { isCompact, contentPaddingX, contentPaddingY, sectionGap } = useDashboardCompact();
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
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to load notifications',
        text2: 'Pull down or try again in a moment.',
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
      Toast.show({ type: 'success', text1: 'Marked as read', position: 'top', visibilityTime: 1500 });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not mark as read', position: 'top', visibilityTime: 1500 });
    }
  };

  const markAllAsRead = async () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount === 0) {
      Toast.show({ type: 'info', text1: "You're all caught up", position: 'top', visibilityTime: 2000 });
      return;
    }
    try {
      await DataService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      Toast.show({
        type: 'success',
        text1: 'All read',
        text2: `${unreadCount} notification${unreadCount > 1 ? 's' : ''} marked`,
        position: 'top',
        visibilityTime: 2000,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not mark all as read', position: 'top', visibilityTime: 2000 });
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      await DataService.deleteNotification(Number(id));
      setNotifications(prev => prev.filter(n => n.id !== id));
      Toast.show({ type: 'success', text1: 'Removed', position: 'top', visibilityTime: 1500 });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not remove', position: 'top', visibilityTime: 1500 });
    }
  };

  const handleDownload = async (fileUrl: string) => {
    try {
      const fullUrl = resolveFileOpenUrl(fileUrl);
      await Linking.openURL(fullUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open file', position: 'top', visibilityTime: 2000 });
    }
  };

  /**
   * Icon tiles match student dashboard action rows (`actionIcon`):
   * 48×48, radius 12, soft background + colored glyph (not white-on-solid).
   */
  const getNotificationStyle = (notification: Notification) => {
    const entity = notification.entityType;

    if (entity === 'poll')
      return {
        iconBg: '#DBEAFE',
        iconColor: '#2563EB',
        labelBg: '#EFF6FF',
        labelColor: '#1D4ED8',
        icon: 'bar-chart-outline' as const,
        label: 'Poll',
      };
    if (entity === 'document')
      return {
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        labelBg: '#FFFBEB',
        labelColor: '#B45309',
        icon: 'document-text-outline' as const,
        label: 'Document',
      };
    if (entity === 'announcement')
      return {
        iconBg: '#D1FAE5',
        iconColor: '#10B981',
        labelBg: '#ECFDF5',
        labelColor: '#059669',
        icon: 'megaphone-outline' as const,
        label: 'Announcement',
      };
    if (notification.type === 'error')
      return {
        iconBg: '#FEE2E2',
        iconColor: '#EF4444',
        labelBg: '#FEF2F2',
        labelColor: '#B91C1C',
        icon: 'alert-circle-outline' as const,
        label: 'Alert',
      };
    return {
      iconBg: '#F1F5F9',
      iconColor: '#64748B',
      labelBg: '#F8FAFC',
      labelColor: '#475569',
      icon: 'notifications-outline' as const,
      label: 'Info',
    };
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'document':
        return notifications.filter(n => n.entityType === 'document');
      case 'poll':
        return notifications.filter(n => n.entityType === 'poll');
      case 'announcement':
        return notifications.filter(n => n.entityType === 'announcement');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const docCount = notifications.filter(n => n.entityType === 'document').length;
  const pollCount = notifications.filter(n => n.entityType === 'poll').length;
  const announcementCount = notifications.filter(n => n.entityType === 'announcement').length;

  const headerTop = Math.max(insets.top, 10) + (isCompact ? 6 : 10);

  const filterItems = (
    [
      { key: 'all' as const, label: `All (${notifications.length})`, short: `All (${notifications.length})` },
      { key: 'unread' as const, label: `Unread (${unreadCount})`, short: `Unread (${unreadCount})` },
      { key: 'announcement' as const, label: `Announcements (${announcementCount})`, short: `Ann. (${announcementCount})` },
      { key: 'document' as const, label: `Documents (${docCount})`, short: `Docs (${docCount})` },
      { key: 'poll' as const, label: `Polls (${pollCount})`, short: `Polls (${pollCount})` },
    ] as const
  ).map(f => ({
    ...f,
    display: isCompact ? f.short : f.label,
  }));

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingHorizontal: contentPaddingX }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingHint}>Loading your notifications…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          isCompact && styles.headerCompact,
          {
            paddingHorizontal: contentPaddingX,
            paddingTop: headerTop,
            paddingBottom: isCompact ? 12 : 16,
          },
        ]}
      >
        <View style={styles.headerTextBlock}>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>Notifications</Text>
          <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
            {unreadCount === 0
              ? 'No unread items'
              : `${unreadCount} unread`}
          </Text>
        </View>
        <Pressable
          onPress={markAllAsRead}
          style={[styles.markAllButton, isCompact && styles.markAllButtonCompact]}
          hitSlop={8}
        >
          <Text style={styles.markAllButtonText} numberOfLines={1}>
            {isCompact ? 'Read all' : 'Mark all read'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={[
          styles.filtersContent,
          { paddingHorizontal: contentPaddingX, gap: isCompact ? 6 : 8 },
        ]}
      >
        {filterItems.map(f => (
          <Pressable
            key={f.key}
            style={[
              styles.filterButton,
              isCompact && styles.filterButtonCompact,
              filter === f.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterButtonText, filter === f.key && styles.filterButtonTextActive]} numberOfLines={1}>
              {f.display}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: contentPaddingX,
          paddingTop: 4,
          paddingBottom: contentPaddingY + Math.max(insets.bottom, 12),
          gap: sectionGap,
        }}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={isCompact ? 52 : 64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>Nothing here</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'unread'
                ? "You're up to date — no unread notifications."
                : filter !== 'all'
                  ? 'Try another filter or check back later.'
                  : 'When something important happens, it will show up here.'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map(notification => {
            const st = getNotificationStyle(notification);
            return (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  isCompact && styles.notificationCardCompact,
                  !notification.read && styles.notificationCardUnread,
                ]}
              >
                <View style={[styles.notificationContent, isCompact && styles.notificationContentCompact]}>
                  <View style={[styles.iconContainer, { backgroundColor: st.iconBg }]}>
                    <Ionicons name={st.icon} size={isCompact ? 22 : 24} color={st.iconColor} />
                  </View>

                  <View style={styles.notificationText}>
                    <View style={styles.cardMetaRow}>
                      <View style={[styles.entityLabel, { backgroundColor: st.labelBg }]}>
                        <Text style={[styles.entityLabelText, { color: st.labelColor }]} numberOfLines={1}>
                          {st.label}
                        </Text>
                      </View>
                      <View style={styles.timePill}>
                        <Ionicons name="time-outline" size={12} color="#6B7280" />
                        <Text style={styles.timePillText} numberOfLines={1}>
                          {notification.time}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.notificationTitle,
                        isCompact && styles.notificationTitleCompact,
                        notification.read && styles.textMutedRead,
                      ]}
                      numberOfLines={3}
                    >
                      {notification.title}
                    </Text>

                    <Text
                      style={[
                        styles.notificationMessage,
                        isCompact && styles.notificationMessageCompact,
                        notification.read && styles.messageRead,
                      ]}
                      numberOfLines={6}
                    >
                      {notification.message}
                    </Text>

                    {notification.fileUrl ? (
                      <>
                        <View style={styles.divider} />
                        <Pressable
                          style={[styles.downloadBtn, isCompact && styles.downloadBtnCompact]}
                          onPress={() => handleDownload(notification.fileUrl!)}
                          hitSlop={6}
                        >
                          <Ionicons name="download-outline" size={isCompact ? 15 : 16} color="#2563EB" />
                          <Text style={styles.downloadBtnText} numberOfLines={1}>
                            Download file
                          </Text>
                        </Pressable>
                      </>
                    ) : null}

                    <View style={styles.divider} />
                    <View style={[styles.notificationActions, isCompact && styles.notificationActionsCompact]}>
                      {!notification.read && (
                        <Pressable onPress={() => markAsRead(notification.id)} hitSlop={8}>
                          <Text style={styles.actionButton}>Mark read</Text>
                        </Pressable>
                      )}
                      <Pressable onPress={() => archiveNotification(notification.id)} hitSlop={8}>
                        <Text style={[styles.actionButton, styles.actionButtonSecondary]}>Remove</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  loadingHint: { fontSize: 14, color: '#9CA3AF' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCompact: { alignItems: 'center' },
  headerTextBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  titleCompact: { fontSize: 20 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  subtitleCompact: { fontSize: 13 },
  markAllButton: { paddingHorizontal: 14, paddingVertical: 10, flexShrink: 0 },
  markAllButtonCompact: { paddingHorizontal: 10, paddingVertical: 8 },
  markAllButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  filtersScroll: { maxHeight: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filtersContent: { paddingVertical: 10, alignItems: 'center' },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonCompact: { paddingHorizontal: 10, paddingVertical: 7 },
  filterButtonActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  filterButtonText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  filterButtonTextActive: { color: '#2563EB' },
  content: { flex: 1 },
  /** Matches admin announcement / poll cards: single hairline border + soft shadow */
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationCardCompact: { padding: 12 },
  notificationCardUnread: {
    borderColor: '#DBEAFE',
    backgroundColor: '#FAFBFF',
  },
  notificationContent: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  notificationContentCompact: { gap: 10 },
  /** Same as student dashboard `actionIcon`: soft tile + colored icon */
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notificationText: { flex: 1, minWidth: 0 },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  entityLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    maxWidth: '58%',
  },
  entityLabelText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    maxWidth: '48%',
  },
  timePillText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  notificationTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  notificationTitleCompact: { fontSize: 14 },
  textMutedRead: { opacity: 0.88 },
  notificationMessage: { fontSize: 13.5, color: '#4B5563', lineHeight: 20, marginBottom: 4 },
  notificationMessageCompact: { fontSize: 13, lineHeight: 19 },
  messageRead: { color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  downloadBtnCompact: { paddingVertical: 9, paddingHorizontal: 10 },
  downloadBtnText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  notificationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 2,
  },
  notificationActionsCompact: { gap: 14 },
  actionButton: { fontSize: 13, fontWeight: '600', color: '#2563EB', paddingVertical: 4 },
  actionButtonSecondary: { color: '#9CA3AF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 8 },
  emptyStateTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptyStateText: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
});
