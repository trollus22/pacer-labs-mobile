import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useTheme } from '@/theme';

/**
 * Superficie de cristal de Pacer (botones de la cabecera, barra de escribir, menú de conversaciones): Liquid Glass real en iOS 26,
 * material desenfocado en iOS anterior y una aproximación con blur en la web. Es la misma receta que la barra de pestañas.
 */
export function Glass({ children, radius, style, interactive }: { children?: ReactNode; radius: number; style?: StyleProp<ViewStyle>; interactive?: boolean }) {
  const { colors } = useTheme();
  const glass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const web = Platform.OS === 'web';
  const shape = { borderRadius: radius, borderCurve: 'continuous' as const, overflow: 'hidden' as const };
  const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };
  const webGlass = web ? ({ backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', boxShadow: '0 10px 30px rgba(17,17,17,0.12), inset 0 1px 0 rgba(255,255,255,0.9)' } as never) : null;
  return (
    <View style={[shape, glass
      ? { backgroundColor: 'rgba(255,255,255,0.3)' }
      : { backgroundColor: web ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: web ? 'rgba(255,255,255,0.8)' : colors.hairline }, webGlass, style]}>
      {glass ? <GlassView glassEffectStyle="regular" isInteractive={interactive} colorScheme="light" style={[fill, shape]} /> : null}
      {!glass && Platform.OS === 'ios' ? <BlurView intensity={60} tint="systemChromeMaterialLight" style={fill} /> : null}
      {children}
    </View>
  );
}
