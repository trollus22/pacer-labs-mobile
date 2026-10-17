import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { EASE_OUT } from '@/lib/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const START = 200, SWEEP = 220; // grados: de abajo a la izquierda, por arriba, hasta abajo a la derecha
// Se usa dentro de useAnimatedProps (hilo de UI): tiene que ser un worklet o iOS cierra la app.
const rad = (deg: number) => {
  'worklet';
  return (deg * Math.PI) / 180;
};

/**
 * Medidor semicircular de línea fina con aguja (el «832» del dashboard de la referencia).
 * `value` de 0 a 100; los hijos (la cifra) se colocan en el centro.
 */
export function ArcGauge({ value, color, size = 230, ink, dim, children }: { value: number | null; color: string; size?: number; ink?: string; dim?: string; children?: ReactNode }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const track = dim ?? colors.inkDim, needle = ink ?? colors.ink;
  const r = size / 2 - 16, cx = size / 2, cy = size / 2;
  const L = r * rad(SWEEP);
  const pt = (t: number, rr: number) => ({ x: cx + rr * Math.cos(rad(START - SWEEP * t)), y: cy - rr * Math.sin(rad(START - SWEEP * t)) });
  const a = pt(0, r), b = pt(1, r);
  const full = `M ${a.x} ${a.y} A ${r} ${r} 0 1 1 ${b.x} ${b.y}`;
  const target = value == null ? 0 : Math.max(0, Math.min(1, value / 100));
  const p = useSharedValue(reduced ? target : 0);
  useEffect(() => { p.set(reduced ? target : withDelay(300, withTiming(target, { duration: 1100, easing: EASE_OUT }))); }, [target, reduced, p]);

  const arc = useAnimatedProps(() => ({ strokeDashoffset: L * (1 - p.get()) }));
  const nd = useAnimatedProps(() => {
    const ang = rad(START - SWEEP * p.get());
    return { x1: cx + (r - 18) * Math.cos(ang), y1: cy - (r - 18) * Math.sin(ang), x2: cx + (r + 9) * Math.cos(ang), y2: cy - (r + 9) * Math.sin(ang) };
  });

  const ticks = Array.from({ length: 23 }, (_, i) => i / 22);
  const height = cy + r * 0.34 + 16;
  return (
    <View style={{ width: size, height, alignItems: 'center' }}>
      <Svg width={size} height={height}>
        {ticks.map((t, i) => {
          const o = pt(t, r + 9), inn = pt(t, r + (i % 2 ? 5 : 2));
          return <Line key={i} x1={o.x} y1={o.y} x2={inn.x} y2={inn.y} stroke={track} strokeWidth={1} />;
        })}
        <Path d={full} stroke={track} strokeWidth={2} fill="none" strokeLinecap="round" />
        <AnimatedPath d={full} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={L} animatedProps={arc} />
        {value != null ? <AnimatedLine stroke={needle} strokeWidth={1.6} strokeLinecap="round" animatedProps={nd} /> : null}
      </Svg>
      <View style={{ position: 'absolute', top: cy - 46, left: 0, right: 0, alignItems: 'center' }}>{children}</View>
    </View>
  );
}
