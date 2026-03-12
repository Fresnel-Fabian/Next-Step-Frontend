import { StyleSheet, Text, View } from 'react-native';

interface ActivityItemProps {
  title: string;
  author: string;
  timestamp: string;
}

export const ActivityItem = ({ title, author, timestamp }: ActivityItemProps) => {
  // Pick initials from author name
  const initials = author
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Avatar circle with initials */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.author}>{author}</Text>
      </View>

      {/* Timestamp */}
      <Text style={styles.timestamp}>{timestamp}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});