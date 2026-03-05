import { DataService } from '@/services/dataService';
import { Notification, NotificationType } from '@/types/notification';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type FilterType = 'all' | 'unread' | 'emergency';

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
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'emergency':
        return notifications.filter(n => n.type === 'emergency');
      default:
        return notifications;
    }
  };

  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case 'emergency':
        return {
          borderColor: '#EF4444',
          iconBg: '#FEE2E2',
          iconColor: '#EF4444',
          icon: 'alert-circle' as const,
        };
      case 'document':
        return {
          borderColor: '#3B82F6',
          iconBg: '#DBEAFE',
          iconColor: '#3B82F6',
          icon: 'document-text' as const,
        };
      case 'schedule':
        return {
          borderColor: '#8B5CF6',
          iconBg: '#EDE9FE',
          iconColor: '#8B5CF6',
          icon: 'calendar' as const,
        };
      default:
        return {
          borderColor: '#E5E7EB',
          iconBg: '#F3F4F6',
          iconColor: '#6B7280',
          icon: 'notifications' as const,
        };
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const emergencyCount = notifications.filter(n => n.type === 'emergency').length;

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
        {/* <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable> */}
        <View style={styles.headerContent}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>{unreadCount} unread messages</Text>
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
        <Pressable
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All ({notifications.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterButtonText, filter === 'unread' && styles.filterButtonTextActive]}>
            Unread ({unreadCount})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterButton, filter === 'emergency' && styles.filterButtonActive]}
          onPress={() => setFilter('emergency')}
        >
          <Text style={[styles.filterButtonText, filter === 'emergency' && styles.filterButtonTextActive]}>
            Emergency ({emergencyCount})
          </Text>
        </Pressable>
      </ScrollView>

      {/* Notifications List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {filteredNotifications.map((notification) => {
          const style = getNotificationStyle(notification.type);

          return (
            <View
              key={notification.id}
              style={[
                styles.notificationCard,
                { borderLeftColor: style.borderColor },
                notification.type === 'emergency' && styles.notificationCardEmergency,
                notification.type === 'document' && styles.notificationCardDocument,
                notification.read && styles.notificationCardRead,
              ]}
            >
              {!notification.read && <View style={styles.unreadDot} />}

              <View style={styles.notificationContent}>
                <View style={[styles.iconContainer, { backgroundColor: style.iconBg }]}>
                  <Ionicons name={style.icon} size={24} color={style.iconColor} />
                </View>

                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationMeta}>
                    {notification.sender} • {notification.time}
                  </Text>

                  {/* Actions */}
                  <View style={styles.notificationActions}>
                    <Pressable onPress={() => console.log('View:', notification.id)}>
                      <Text style={styles.actionButton}>View</Text>
                    </Pressable>
                    {!notification.read && (
                      <Pressable onPress={() => markAsRead(notification.id)}>
                        <Text style={[styles.actionButton, styles.actionButtonSecondary]}>
                          Mark as Read
                        </Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => archiveNotification(notification.id)}>
                      <Text style={[styles.actionButton, styles.actionButtonSecondary]}>
                        Archive
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No notifications</Text>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  filtersScroll: {
    maxHeight: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#2563EB',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 16,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightColor: '#F3F4F6',
    borderTopColor: '#F3F4F6',
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  notificationCardEmergency: {
    borderLeftColor: '#EF4444',
  },
  notificationCardDocument: {
    borderLeftColor: '#3B82F6',
  },
  notificationCardRead: {
    opacity: 0.7,
  },
  unreadDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    paddingTop: 12,
  },
  actionButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  actionButtonSecondary: {
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});