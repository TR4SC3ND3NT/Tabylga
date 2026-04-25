import { Stack } from 'expo-router';

export default function ServicesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="hotels" />
      <Stack.Screen name="food" />
      <Stack.Screen name="transport" />
      <Stack.Screen name="activities" />
    </Stack>
  );
}
