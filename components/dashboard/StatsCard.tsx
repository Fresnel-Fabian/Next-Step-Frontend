import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;  // ✅ optional — backend may not always return it
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** Narrow screens: shorter card, tighter padding */
  compact?: boolean;
}

export const StatsCard = ({ title, value, subtitle, icon, color, compact }: StatsCardProps) => {
  const isPositive = subtitle?.includes('+') ?? false;
  
  return (
    <View style={[styles.card, compact ? styles.cardCompact : styles.cardDefault]}>
      <View style={styles.header}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
          <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
        </View>
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
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'space-between',
  },
  cardDefault: {
    height: 144,
  },
  cardCompact: {
    padding: 16,
    minHeight: 108,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  titleCompact: {
    fontSize: 13,
  },
  valueCompact: {
    fontSize: 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  positive: {
    color: '#10B981',
  },
});