import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup  = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inStaffGroup = segments[0] === '(staff)';

    if (!user) {
      // Not logged in → always go to login
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    const isAdmin = user.role === 'ADMIN';

    if (inAuthGroup) {
      // Logged in but sitting on auth screen → go to correct dashboard
      router.replace(isAdmin ? '/(admin)/dashboard' : '/(staff)/dashboard');
      return;
    }

    // ✅ KEY FIX: logged in but in the WRONG role group → redirect to correct one
    if (isAdmin && inStaffGroup) {
      router.replace('/(admin)/dashboard');
      return;
    }

    if (!isAdmin && inAdminGroup) {
      router.replace('/(staff)/dashboard');
      return;
    }
  }, [user, segments, isLoading]);

  // Block rendering until auth check is done
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(staff)" />
    </Stack>
  );
}