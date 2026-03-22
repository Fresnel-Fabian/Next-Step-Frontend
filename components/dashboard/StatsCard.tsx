import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;  // ✅ optional — backend may not always return it
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const StatsCard = ({ title, value, subtitle, icon, color }: StatsCardProps) => {
  const isPositive = subtitle?.includes('+') ?? false;
  
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, isPositive && styles.positive]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'space-between',
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  positive: {
    color: '#10B981',
  },
});