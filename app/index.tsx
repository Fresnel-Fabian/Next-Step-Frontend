import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'ADMIN') return <Redirect href="/(admin)/dashboard" />;
  return <Redirect href="/(staff)/dashboard" />;
}