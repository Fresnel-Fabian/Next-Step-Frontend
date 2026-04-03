import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (user) {
    if (user.role === 'ADMIN') return <Redirect href="/(admin)/dashboard" />;
    if (user.role === 'TEACHER') return <Redirect href="/(staff)/dashboard" />;
    return <Redirect href="/(student)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
