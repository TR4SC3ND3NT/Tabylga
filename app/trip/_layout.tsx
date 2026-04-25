import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="purpose" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="generating" options={{ gestureEnabled: false }} />
      <Stack.Screen name="itinerary" />
      <Stack.Screen name="voice" />
      <Stack.Screen name="group-match" />
    </Stack>
  );
}
