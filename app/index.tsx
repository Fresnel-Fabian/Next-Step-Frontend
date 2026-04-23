import { Redirect } from 'expo-router';
import { useAuthLoading, useUser } from '@/store/authStore';

export default function Index() {
  const user = useUser();
  const isLoading = useAuthLoading();

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
