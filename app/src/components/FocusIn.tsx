import { useEffect, type ReactNode } from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import { EASE_OUT } from '@/lib/motion';

/**
 * Entrada «cambio de enfoque» de la referencia: la tarjeta aparece desenfocada y algo más pequeña y se hace nítida.
 * Se escalona con `index` (60 ms por tarjeta, máximo 10). Con «reducir movimiento» solo hace un fundido.
 */
export function FocusIn({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    p.set(withDelay(reduced ? 0 : Math.min(index, 10) * 60, withTiming(1, { duration: reduced ? 150 : 560, easing: EASE_OUT })));
  }, [index, reduced, p]);
  const anim = useAnimatedStyle(() => {
    const v = p.get();
    return reduced
      ? { opacity: v }
      : Platform.OS === 'web'
        ? { opacity: Math.min(1, v * 1.6), transform: [{ translateY: (1 - v) * 14 }, { scale: 0.95 + 0.05 * v }], filter: [{ blur: (1 - v) * 10 }] }
        : { opacity: Math.min(1, v * 1.6), transform: [{ translateY: (1 - v) * 14 }, { scale: 0.95 + 0.05 * v }] };
  });
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
