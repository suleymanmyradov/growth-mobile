import { useTheme } from '@/design-system/theme';
import { Tabs } from 'expo-router';
import { Circle, Library, ListChecks, MessageCircle, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

/**
 * Tab navigator — Today, Plan, Coach, Library, Me (Paper IA).
 *
 * Per `mobile.md` §6: the five tabs are Today, Plan, Coach, Library, Me.
 * Progress is pushed from Today (not a tab). Recommended Lucide concepts:
 * Circle/Today, ListChecks/Plan, MessageCircle/Coach, Library/Library, User/Me.
 *
 * Paper tab bar: canonical semantic colors, hairline top border, no elevation.
 * `headerShown: false` — each tab screen renders its own header via the `Screen`
 * primitive so titles stay consistent across tabs and pushed stack screens.
 */
export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color, size }) => <Circle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: t('tabs.plan'),
          tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: t('tabs.coach'),
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('tabs.library'),
          tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('tabs.me'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
