import { useAuthStore } from "@/store/authStore";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, checkAuth } = useAuthStore();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAdminGroup = segments[0] === "(admin)";
    const inStaffGroup = segments[0] === "(staff)";

    if (!user && !inAuthGroup) {
      // Not logged in → go to login
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Logged in but on auth screen → redirect to appropriate dashboard
      if (user.role === 'ADMIN') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace("/(staff)/dashboard");
      }
    }
  }, [user, segments, isLoading]);

  if (isLoading) {
    // Show loading screen while checking auth
    return null; // Or a proper loading component
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(staff)" />
    </Stack>
  );
}
