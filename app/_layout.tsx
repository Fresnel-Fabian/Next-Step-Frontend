import { UserRole, useAuthStore } from '@/store/authStore';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
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

    if (!user) {
      // Not logged in → always go to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (inAuthGroup) {
      // Logged in but on auth screen → redirect to appropriate dashboard
      if (user.role === UserRole.ADMIN) {
        router.replace('/(admin)/dashboard');
      } else if (user.role === UserRole.TEACHER) {
        router.replace('/(staff)/dashboard');
      } else {
        router.replace('/(student)/dashboard');
      }
      return;
    }

    // User is logged in — redirect to correct group if in wrong place
    if (user.role === UserRole.ADMIN) {
      if (!inAdminGroup) router.replace('/(admin)/dashboard');
    } else if (user.role === UserRole.TEACHER) {
      if (!inStaffGroup) router.replace('/(staff)/dashboard');
    } else {
      // STUDENT
      if (!inStudentGroup) router.replace('/(student)/dashboard');
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(staff)" />
        <Stack.Screen name="(student)" />
      </Stack>
      <Toast />
    </>
  );
}