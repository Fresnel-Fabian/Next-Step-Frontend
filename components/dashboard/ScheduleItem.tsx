import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface ScheduleItemProps {
  time: string;
  title: string;
  location: string;
  isStartingSoon: boolean;
}

export const ScheduleItem = ({ time, title, location, isStartingSoon }: ScheduleItemProps) => {
  return (
    <View style={[
      styles.container,
      isStartingSoon && styles.activeContainer
    ]}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.time}>{time}</Text>
        </View>
        {isStartingSoon && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Starting Soon</Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.location}>{location}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    marginBottom: 12,
  },
  activeContainer: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
});