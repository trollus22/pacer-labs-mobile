import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useSegments } from 'expo-router';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { accent, useTheme } from '@/theme';
import { haptic } from '@/lib/haptics';
import { CSS_EASE_OUT } from '@/lib/motion';

export type TabItem = { name: string; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] };

/**
 * Barra inferior flotante de Liquid Glass para iPad, igual que la del iPhone (iPadOS pone las pestañas arriba o en la barra
 * lateral, y quita sitio al contenido). En iOS 26 es cristal real del sistema; antes, un material desenfocado.
 */
export function GlassTabBar({ items }: { items: TabItem[] }) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  // La barra vive FUERA del navegador (no dentro de su `tabBar`, que le da altura cero y no recibe toques en iOS): la pestaña activa sale de la ruta.
  const segments = useSegments() as string[];
  const current = items.find((it) => segments.includes(it.name))?.name;
  const glass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const shape = { borderRadius: 34, borderCurve: 'continuous' as const, overflow: 'hidden' as const };

  const bar = (
    <View style={{ flexDirection: 'row', padding: 6, gap: 4 }}>
      {items.map((it) => {
        const on = current === it.name;
        const press = () => { if (!on) { haptic.select(); router.navigate(`/(app)/(tabs)/${it.name}` as never); } };
        return (
          <PressableScale key={it.name} scale={0.94} onPress={press} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={it.label}>
            <Animated.View style={[{ height: 56, width: 96, borderRadius: 28, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4 },
              { backgroundColor: on ? (scheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)') : 'transparent', transitionProperty: 'backgroundColor', transitionDuration: '180ms', transitionTimingFunction: CSS_EASE_OUT }]}>
              <MaterialCommunityIcons name={it.icon} size={25} color={on ? accent.coral : colors.text} />
              <Text variant="caption" style={{ fontSize: 10.5, letterSpacing: 0.2, textTransform: 'none' }} color={on ? accent.coral : colors.text} numberOfLines={1}>{it.label}</Text>
            </Animated.View>
          </PressableScale>
        );
      })}
    </View>
  );

  // iOS 26: el cristal líquido real es la superficie (igual que la barra nativa del iPhone). Sin él, material borroso o fondo sólido.
  const solid = scheme === 'dark' ? 'rgba(22,24,31,0.92)' : 'rgba(255,255,255,0.94)';
  const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) + 4, alignItems: 'center', zIndex: 10 }}>
      <View style={[shape, glass ? { backgroundColor: scheme === 'dark' ? 'rgba(22,24,31,0.28)' : 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } } : { backgroundColor: solid, borderWidth: 1, borderColor: colors.hairline }]}>
        {glass ? <GlassView glassEffectStyle="regular" isInteractive colorScheme={scheme} style={[fill, shape]} /> : null}
        {!glass && Platform.OS === 'ios' ? <BlurView intensity={60} tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={fill} /> : null}
        {bar}
      </View>
    </View>
  );
}

/** Espacio que hay que dejar bajo el contenido para que la barra flotante no lo tape. */
export const FLOATING_BAR_SPACE = 120;
