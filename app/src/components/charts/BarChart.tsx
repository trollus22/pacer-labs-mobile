import { useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Line, Path, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { ChartCard } from './ChartCard';
import { NO_SELECT, barPath, compact, monotonePath, niceTicks, runs, type Pt } from './shapes';
import { Text } from '../Text';
import { useTheme } from '@/theme';
import { haptic } from '@/lib/haptics';
import { EASE_OUT } from '@/lib/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const PAD = { l: 34, r: 10, t: 10, b: 22 };
const MAX_BAR = 24;

export type BarDatum = { label: string; value: number; /** texto para la cabecera al tocar la barra */ caption?: string; partial?: boolean };

type Props = {
  title: string;
  data: BarDatum[];
  color: string;
  unit?: string;
  decimals?: number;
  /** Línea superpuesta (p. ej. media de 7 días) con la misma escala: nunca un segundo eje. */
  line?: { values: (number | null)[]; color: string; label: string };
  height?: number;
  yMax?: number;
  caption?: string;
  note?: string;
  empty?: string;
  /** Qué cifra enseñar sin tocar: la última barra (por defecto) o el total. */
  headline?: 'last' | 'sum' | 'avg';
  legendLabel?: string;
  /** Formato de la cifra de la cabecera. */
  format?: (v: number) => string;
};

export function BarChart({ title, data, color, unit, decimals = 0, line, height = 130, yMax, caption, note, empty = 'Todavía no hay datos suficientes.', headline = 'last', legendLabel, format }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const grow = useSharedValue(reduced ? 1 : 0);
  const lastIdx = useSharedValue(-1);
  useEffect(() => { if (!reduced) grow.set(withTiming(1, { duration: 650, easing: EASE_OUT })); }, [reduced, grow]);

  const n = data.length;
  const W = Math.max(0, width - PAD.l - PAD.r);
  const slot = n ? W / n : 0;
  const barW = Math.min(MAX_BAR, slot * 0.62);
  const max = yMax ?? Math.max(1, ...data.map((d) => d.value), ...(line?.values.filter((v): v is number => v != null) ?? []));
  const hi = max * 1.08;
  const base = PAD.t + height;
  const yAt = (v: number) => base - (v / hi) * height;
  const xAt = (i: number) => PAD.l + slot * i + (slot - barW) / 2;
  const fmtNum = (v: number) => (format ? format(v) : v.toFixed(decimals).replace('.', ','));

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-6, 6])
      .failOffsetY([-10, 10])
      .onUpdate((e) => {
        const i = Math.min(n - 1, Math.max(0, Math.floor((e.x - PAD.l) / (slot || 1))));
        if (i !== lastIdx.get()) { lastIdx.set(i); scheduleOnRN(setActive, i); scheduleOnRN(haptic.select); }
      })
      .onFinalize(() => { lastIdx.set(-1); scheduleOnRN(setActive, null); });
    const tap = Gesture.Tap().onEnd((e, ok) => {
      if (!ok) return;
      scheduleOnRN(setActive, Math.min(n - 1, Math.max(0, Math.floor((e.x - PAD.l) / (slot || 1)))));
      scheduleOnRN(haptic.select);
    });
    return Gesture.Race(pan, tap);
  }, [n, slot, lastIdx]);

  const headNumber = active != null
    ? fmtNum(data[active].value)
    : !n ? null : headline === 'sum' ? fmtNum(data.reduce((a, d) => a + d.value, 0)) : headline === 'avg' ? fmtNum(data.reduce((a, d) => a + d.value, 0) / n) : fmtNum(data[n - 1].value);
  const headCaption = active != null ? (data[active].caption ?? data[active].label) + (data[active].partial ? ' · en curso' : '') : caption;
  const ticks = niceTicks(0, hi, 3);
  const every = Math.max(1, Math.ceil(n / 4));
  const labelIdx = (() => {
    const out: number[] = [];
    for (let i = 0; i < n; i += every) out.push(i);
    if (n > 0 && out[out.length - 1] !== n - 1 && n - 1 - out[out.length - 1] >= Math.ceil(every / 2)) out.push(n - 1);
    return out;
  })();
  const hasData = data.some((d) => d.value > 0);

  return (
    <ChartCard
      title={title} value={headNumber} unit={unit} caption={headCaption} note={note}
      legend={line ? [{ label: legendLabel ?? title, color }, { label: line.label, color: line.color }] : undefined}
    >
      <View style={NO_SELECT} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityLabel={`${title}: ${headNumber ?? 'sin datos'}${unit ? ' ' + unit : ''}`}>
        {!hasData ? (
          <View style={{ height: height + PAD.t + PAD.b, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="footnote" tertiary center>{empty}</Text>
          </View>
        ) : width > 0 ? (
          <GestureDetector gesture={gesture}>
            <View>
              <Svg width={width} height={height + PAD.t + PAD.b}>
                {ticks.map((t) => (
                  <G key={t}>
                    <Line x1={PAD.l} x2={PAD.l + W} y1={yAt(t)} y2={yAt(t)} stroke={colors.separator} strokeWidth={1} />
                    <SvgText x={PAD.l - 6} y={yAt(t) + 3.5} fontSize={10} fontFamily="Inter_500Medium" fill={colors.textTertiary} textAnchor="end">{compact(t, Number.isInteger(t) ? 0 : 1)}</SvgText>
                  </G>
                ))}
                {data.map((d, i) => (
                  <Bar key={i} i={i} n={n} x={xAt(i)} base={base} w={barW} h={(d.value / hi) * height} color={color} grow={grow}
                    opacity={active != null ? (active === i ? 1 : 0.38) : d.partial ? 0.55 : 1} />
                ))}
                {labelIdx.map((i) => (
                  <SvgText key={`x${i}`} x={i === n - 1 && n > 1 ? PAD.l + W : xAt(i) + barW / 2} y={base + 16} fontSize={10} fontFamily="Inter_500Medium" fill={colors.textTertiary} textAnchor={i === n - 1 && n > 1 ? 'end' : 'middle'}>{data[i].label}</SvgText>
                ))}
                {line ? runs(line.values).map(([a, b], j) => {
                  const pts: Pt[] = [];
                  for (let i = a; i <= b; i++) pts.push({ x: xAt(i) + barW / 2, y: yAt(line.values[i] as number) });
                  return pts.length > 1 ? <Path key={j} d={monotonePath(pts)} stroke={line.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null;
                }) : null}
              </Svg>
            </View>
          </GestureDetector>
        ) : null}
      </View>
    </ChartCard>
  );
}

// Cada barra crece desde la base con un pequeño escalonado; la parte superior va redondeada (4 px) y la base recta.
function Bar({ i, n, x, base, w, h, color, grow, opacity }: { i: number; n: number; x: number; base: number; w: number; h: number; color: string; grow: SharedValue<number>; opacity: number }) {
  const props = useAnimatedProps(() => {
    const p = Math.min(1, Math.max(0, grow.get() * 1.4 - (n > 1 ? i / (n - 1) : 0) * 0.4));
    return { d: barPath(x, base, w, h * p, 4) };
  });
  return <AnimatedPath animatedProps={props} fill={color} opacity={opacity} />;
}
