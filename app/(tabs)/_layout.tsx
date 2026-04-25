import { Tabs } from 'expo-router';
import { House, Map, Route, CreditCard, User } from 'lucide-react-native';
import { colors } from '../../constants/colors';

const TAB_ICON_SIZE = 22;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          height: 80,
          paddingBottom: 24,
          paddingTop: 10,
          borderTopColor: colors.border.divider,
          backgroundColor: colors.surface.card,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <House size={TAB_ICON_SIZE} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <Map size={TAB_ICON_SIZE} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => (
            <Route size={TAB_ICON_SIZE} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) => (
            <CreditCard size={TAB_ICON_SIZE} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <User size={TAB_ICON_SIZE} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}
