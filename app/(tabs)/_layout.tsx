import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { CreditCard, House, Map, Route, User } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { shadows } from '../../constants/shadows';
import { useStrings } from '../../lib/i18n';

const TAB_ICON_SIZE = 22;
const ACTIVE_COLORS = [colors.brand.primary, colors.accent.aqua, colors.brand.cta, colors.accent.violet, colors.accent.peach];

function TabIcon({
  icon: Icon,
  color,
  focused,
  index,
}: {
  icon: typeof House;
  color: string;
  focused: boolean;
  index: number;
}) {
  const activeColor = ACTIVE_COLORS[index] ?? colors.brand.primary;

  return (
    <View
      style={{
        width: 46,
        height: 40,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? activeColor : 'transparent',
        borderWidth: focused ? 1 : 0,
        borderColor: 'rgba(255,255,255,0.34)',
        transform: [{ translateY: focused ? -2 : 0 }],
      }}
    >
      <Icon
        size={TAB_ICON_SIZE}
        color={focused ? '#fff' : color}
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
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          height: 78,
          paddingBottom: 11,
          paddingTop: 9,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          borderRadius: 26,
          backgroundColor: colors.surface.card,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.92)',
          ...shadows.modal,
        },
        tabBarItemStyle: {
          borderRadius: 20,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_700Bold',
          fontSize: 11,
          letterSpacing: 0,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: strings.tabs.home,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={House} color={color} focused={focused} index={0} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: strings.tabs.map,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Map} color={color} focused={focused} index={1} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: strings.tabs.trips,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Route} color={color} focused={focused} index={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: strings.tabs.wallet,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={CreditCard} color={color} focused={focused} index={3} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: strings.tabs.profile,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={User} color={color} focused={focused} index={4} />
          ),
        }}
      />
    </Tabs>
  );
}
