import { Stack } from 'expo-router';

export default function MerchantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="accept" />
    </Stack>
  );
}
