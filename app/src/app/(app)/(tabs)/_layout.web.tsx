import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fonts, accent, useTheme } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useWide } from '@/lib/layout';
import { GlassTabs } from '@/components/GlassTabs';

// Solo para la vista web de pruebas: en el móvil se usa la barra nativa (_layout.tsx).
export default function TabsLayout() {
  const { colors, scheme } = useTheme();
  const { user } = useAuth();
  const coach = user?.role === 'coach';
  const wide = useWide();
  if (wide) return <GlassTabs coach={coach} />;   // ventana ancha: la misma barra flotante de cristal que en iPad
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: accent.coral,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        tabBarStyle: { backgroundColor: scheme === 'dark' ? 'rgba(10,11,14,0.86)' : 'rgba(255,255,255,0.86)', borderTopColor: colors.separator, height: 64, paddingTop: 6, backdropFilter: 'blur(24px) saturate(180%)' } as never,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="(home)" options={{ title: coach ? 'Equipo' : 'Hoy', tabBarIcon: ({ color }) => <MaterialCommunityIcons name={coach ? 'account-group' : 'lightning-bolt'} size={26} color={color} /> }} />
      <Tabs.Screen name="(calendar)" options={{ title: 'Calendario', href: coach && !wide ? null : undefined, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-month" size={26} color={color} /> }} />
      <Tabs.Screen name="(form)" options={{ title: 'Forma', href: coach ? null : undefined, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="heart-pulse" size={26} color={color} /> }} />
      <Tabs.Screen name="(you)" options={{ title: 'Tú', href: coach ? undefined : null, tabBarIcon: ({ color }) => <MaterialCommunityIcons name="run-fast" size={26} color={color} /> }} />
      <Tabs.Screen name="(profile)" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-circle" size={26} color={color} /> }} />
    </Tabs>
  );
}
