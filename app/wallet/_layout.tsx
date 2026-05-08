import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="topup" />
      <Stack.Screen name="pay" />
      <Stack.Screen name="receive" />
      <Stack.Screen name="bluetooth" />
      <Stack.Screen name="activate-offline" />
      <Stack.Screen name="pay-offline" />
      <Stack.Screen name="merchant-mode" />
    </Stack>
  );
}
