import { UserRole, useAuthStore } from '@/store/authStore';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inStaffGroup = segments[0] === '(staff)';
    const inStudentGroup = segments[0] === '(student)';
    const onInvitePage = segments[0] === 'invite'; // allow invite page without login

    if (!user) {
      if (!inAuthGroup && !onInvitePage) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // User is logged in — redirect to correct group if in wrong place
    if (onInvitePage) return; // don't redirect away from invite even if logged in

    if (user.role === UserRole.ADMIN) {
      if (!inAdminGroup) router.replace('/(admin)/dashboard');
    } else if (user.role === UserRole.TEACHER) {
      if (!inStaffGroup) router.replace('/(staff)/dashboard');
    } else {
      if (!inStudentGroup) router.replace('/(student)/dashboard');
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(staff)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="invite" />
      </Stack>
      <Toast />
    </SafeAreaProvider>
  );
}