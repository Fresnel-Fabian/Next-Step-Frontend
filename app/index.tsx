import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (user) {
    return user.role === 'ADMIN'
      ? <Redirect href="/(admin)/dashboard" />
      : <Redirect href="/(staff)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
