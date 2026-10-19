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
export function GlassTabBar({ items, compact }: { items: TabItem[]; compact?: boolean }) {
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
            <Animated.View style={[{ height: 56, width: compact ? 68 : 96, borderRadius: 28, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4 },
              { backgroundColor: on ? (scheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)') : 'transparent', transitionProperty: 'backgroundColor', transitionDuration: '180ms', transitionTimingFunction: CSS_EASE_OUT }]}>
              <MaterialCommunityIcons name={it.icon} size={25} color={on ? accent.coral : colors.textSecondary} />
              <Text variant="caption" style={{ fontSize: 10.5, letterSpacing: 0.2, textTransform: 'none' }} color={on ? accent.coral : colors.textSecondary} numberOfLines={1}>{it.label}</Text>
            </Animated.View>
          </PressableScale>
        );
      })}
    </View>
  );

  // iOS 26: el cristal líquido real es la superficie (igual que la barra nativa del iPhone). Sin él, material borroso o fondo sólido.
  const web = Platform.OS === 'web';
  const solid = web ? 'rgba(255,255,255,0.58)' : scheme === 'dark' ? 'rgba(22,24,31,0.92)' : 'rgba(255,255,255,0.94)';
  // Vista web: la aproximación del cristal líquido (desenfoque + saturación + filo de luz); en iOS 26 lo dibuja GlassView.
  const webGlass = web ? ({ backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', boxShadow: '0 10px 30px rgba(17,17,17,0.12), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.35)' } as never) : null;
  const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) + 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, zIndex: 10 }}>
      <View style={[shape, glass ? { backgroundColor: scheme === 'dark' ? 'rgba(22,24,31,0.28)' : 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } } : { backgroundColor: solid, borderWidth: 1, borderColor: web ? 'rgba(255,255,255,0.75)' : colors.hairline }, webGlass]}>
        {glass ? <GlassView glassEffectStyle="regular" isInteractive colorScheme={scheme} style={[fill, shape]} /> : null}
        {!glass && Platform.OS === 'ios' ? <BlurView intensity={60} tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={fill} /> : null}
        {bar}
      </View>
      {/* Pacer, el asistente: círculo aparte de las pestañas, como en la barra nativa del iPhone (iOS 26). */}
      <PressableScale scale={0.92} onPress={() => { haptic.select(); router.push('/pacer'); }} accessibilityLabel="Pacer, asistente" accessibilityHint="Abre el chat">
        <View style={[{ width: 68, height: 68, borderRadius: 34, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, glass ? { backgroundColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: solid, borderWidth: 1, borderColor: web ? 'rgba(255,255,255,0.75)' : colors.hairline }, webGlass]}>
          {glass ? <GlassView glassEffectStyle="regular" isInteractive colorScheme={scheme} style={[fill, { borderRadius: 34 }]} /> : null}
          {!glass && Platform.OS === 'ios' ? <BlurView intensity={60} tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={fill} /> : null}
          <MaterialCommunityIcons name="creation" size={27} color={colors.text} />
        </View>
      </PressableScale>
    </View>
  );
}

/** Espacio que hay que dejar bajo el contenido para que la barra flotante no lo tape. */
export const FLOATING_BAR_SPACE = 120;
