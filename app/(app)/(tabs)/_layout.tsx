import { Tabs } from 'expo-router';
import { Home, Compass, CheckCircle, MessageCircle, User } from 'lucide-react-native';
import { useTheme } from '@/design-system/theme';

/**
 * Tab navigator — Home, Explore, Habits, Coach, Profile.
 *
 * Per AGENTS.md screen mapping:
 * - Home tab: article feed, category filtering, plan adjustments
 * - Explore tab: featured content and habit/goal templates
 * - Habits tab: list, streaks, CRUD, daily check-in
 * - Coach tab: AI coaching conversations
 * - Profile tab: profile and settings
 */
export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => <CheckCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
