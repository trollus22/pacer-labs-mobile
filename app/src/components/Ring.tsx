import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { accent, createStyles } from '@/theme';
import { EASE_OUT } from '@/lib/motion';
import { alpha } from '@/lib/color';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Anillo de progreso (estilo Actividad). Se rellena una vez al aparecer y, si el dato cambia, continúa desde donde está.
export function Ring({ size = 120, stroke = 14, progress, color = accent.coral, delay = 0, children }: {
  size?: number; stroke?: number; progress: number; color?: string; delay?: number; children?: ReactNode;
}) {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    const to = Math.max(0, Math.min(1, progress));
    p.set(reduced ? to : withDelay(delay, withTiming(to, { duration: 900, easing: EASE_OUT })));
  }, [progress, delay, reduced, p]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.get()) }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={alpha(color, 0.18)} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} animatedProps={props}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({ center: { alignItems: 'center', justifyContent: 'center' } }));
