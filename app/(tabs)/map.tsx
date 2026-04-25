import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface-primary items-center justify-center">
      <Text className="font-display text-3xl text-text-primary">Map</Text>
    </SafeAreaView>
  );
}
