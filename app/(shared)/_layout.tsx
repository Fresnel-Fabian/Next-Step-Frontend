import { Stack } from 'expo-router';

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="settings" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="schedules" />
      <Stack.Screen name="notification" />
    </Stack>
  );
}
