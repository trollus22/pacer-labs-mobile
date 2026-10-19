import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { GlassTabBar } from './GlassTabBar';
import { useTheme } from '@/theme';
import { tabItems } from '@/lib/tabs';

const GROUPS = ['(home)', '(calendar)', '(form)', '(you)', '(profile)'] as const;

/**
 * Pestañas con la barra flotante de Liquid Glass (iPad y vista web ancha). El navegador no dibuja barra propia
 * (`tabBar` vacío) y la nuestra va por encima, fuera de él: así ocupa todo el ancho de la pantalla y recibe los toques.
 */
export function GlassTabs({ coach, wide = true }: { coach: boolean; wide?: boolean }) {
  const { colors } = useTheme();
  const items = tabItems(coach, wide);
  const shown = new Set(items.map((i) => i.name));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs tabBar={() => null} screenOptions={{ headerShown: false, animation: 'none', sceneStyle: { backgroundColor: colors.bg } }}>
        {GROUPS.map((g) => <Tabs.Screen key={g} name={g} options={{ href: shown.has(g) ? undefined : null }} />)}
        <Tabs.Screen name="pacer-tab" options={{ href: null }} />
      </Tabs>
      <GlassTabBar items={items} compact={!wide} />
    </View>
  );
}
