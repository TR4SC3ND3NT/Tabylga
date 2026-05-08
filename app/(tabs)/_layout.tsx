import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { House, Map, Route, CreditCard, User } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { useStrings } from '../../lib/i18n';

const TAB_ICON_SIZE = 22;

function TabIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: typeof House;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 34,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.brand.primaryLight : 'transparent',
      }}
    >
      <Icon
        size={TAB_ICON_SIZE}
        color={focused ? colors.brand.primary : color}
        strokeWidth={focused ? 2 : 1.5}
      />
    </View>
  );
}

export default function TabsLayout() {
  const strings = useStrings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          height: 82,
          paddingBottom: 22,
          paddingTop: 8,
          borderTopColor: 'transparent',
          backgroundColor: colors.surface.card,
          ...shadows.modal,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          letterSpacing: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.home,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={House} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: strings.tabs.map,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Map} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: strings.tabs.trips,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Route} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: strings.tabs.wallet,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={CreditCard} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: strings.tabs.profile,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
