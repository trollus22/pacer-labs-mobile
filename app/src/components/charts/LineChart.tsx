import { useEffect, useMemo, useState, useId } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient as SvgGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { ChartCard } from './ChartCard';
import { NO_SELECT, compact, monotonePath, niceTicks, runs, type Pt } from './shapes';
import { Text } from '../Text';
import { useTheme } from '@/theme';
import { chartDate, shortDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { EASE_OUT } from '@/lib/motion';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const PAD = { l: 34, r: 10, t: 10, b: 22 };

export type LineSeries = { values: (number | null)[]; color: string; /** relleno suave (10 %) bajo la línea */ area?: boolean; muted?: boolean };
export type Band = { from: number; to: number; color: string; label?: string };

type Props = {
  title: string;
  dates: string[];
  /** La primera serie es la principal: manda en la cifra de la cabecera y en el punto final. */
  series: LineSeries[];
  unit?: string;
  decimals?: number;
  /** Amplitud mínima del eje: evita que el ruido normal (±2 lpm) parezca una oscilación enorme. */
  minSpan?: number;
  /** Formato propio de la cifra (p. ej. ritmo mm:ss). */
  format?: (v: number) => string;
  domain?: [number, number];
  bands?: Band[];
  height?: number;
  legend?: { label: string; color: string }[];
  /** Texto de la fecha cuando no se está tocando nada. */
  caption?: string;
  note?: string;
  empty?: string;
};

export function LineChart({ title, dates, series, unit, decimals = 0, format, minSpan, domain, bands = [], height = 130, legend, caption, note, empty = 'Todavía no hay datos suficientes.' }: Props) {
  const { colors, ink } = useTheme();
  const reduced = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const reveal = useSharedValue(reduced ? 1 : 0);
  const lastIdx = useSharedValue(-1);

  const n = dates.length;
  const primary = series[0];
  const have = primary.values.filter((v) => v != null).length;
  const fmt = (v: number | null) => (v == null ? null : format ? format(v) : v.toFixed(decimals).replace('.', ','));

  const W = Math.max(0, width - PAD.l - PAD.r);
  const step = n > 1 ? W / (n - 1) : 0;
  const xAt = (i: number) => PAD.l + (n > 1 ? i * step : W / 2);

  const [lo, hi] = useMemo(() => {
    if (domain) return domain;
    const all = series.flatMap((s) => s.values).filter((v): v is number => v != null);
    if (!all.length) return [0, 1] as [number, number];
    let mn = Math.min(...all), mx = Math.max(...all);
    if (minSpan && mx - mn < minSpan) { const mid = (mn + mx) / 2; mn = mid - minSpan / 2; mx = mid + minSpan / 2; }
    const pad = (mx - mn || 1) * 0.12;
    return [mn - pad, mx + pad] as [number, number];
  }, [domain, series, minSpan]);
  const yAt = (v: number) => PAD.t + height * (1 - (v - lo) / (hi - lo || 1));

  useEffect(() => { if (!reduced) reveal.set(withTiming(1, { duration: 750, easing: EASE_OUT })); }, [reduced, reveal]);
  const clipProps = useAnimatedProps(() => ({ width: Math.max(0, (width || 1) * reveal.get()) }));

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-6, 6])
      .failOffsetY([-10, 10])
      .onUpdate((e) => {
        const i = Math.min(n - 1, Math.max(0, Math.round((e.x - PAD.l) / (step || 1))));
        if (i !== lastIdx.get()) { lastIdx.set(i); scheduleOnRN(setActive, i); scheduleOnRN(haptic.select); }
      })
      .onFinalize(() => { lastIdx.set(-1); scheduleOnRN(setActive, null); });
    const tap = Gesture.Tap().onEnd((e, ok) => {
      if (!ok) return;
      const i = Math.min(n - 1, Math.max(0, Math.round((e.x - PAD.l) / (step || 1))));
      scheduleOnRN(setActive, i);
      scheduleOnRN(haptic.select);
    });
    return Gesture.Race(pan, tap);
  }, [n, step, lastIdx]);

  const lastNonNull = (() => { for (let i = primary.values.length - 1; i >= 0; i--) if (primary.values[i] != null) return i; return -1; })();
  const shownIdx = active ?? (lastNonNull >= 0 ? lastNonNull : null);
  const shownVal = shownIdx != null ? primary.values[shownIdx] : null;
  const headCaption = active != null ? chartDate(dates[active]) : caption;

  const ticks = niceTicks(lo, hi, 3);
  const labelIdx = n >= 3 ? [0, Math.floor((n - 1) / 2), n - 1] : n === 2 ? [0, 1] : [0];

  const summary = `${title}: ${have ? `último valor ${fmt(primary.values[lastNonNull])}${unit ? ' ' + unit : ''}` : 'sin datos'}.`;

  return (
    <ChartCard title={title} value={fmt(shownVal)} unit={shownVal != null ? unit : undefined} caption={headCaption} legend={legend} note={note}>
      <View style={NO_SELECT} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessible accessibilityLabel={summary}>
        {have < 2 ? (
          <View style={{ height: height + PAD.t + PAD.b, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="footnote" tertiary center>{empty}</Text>
          </View>
        ) : width > 0 ? (
          <GestureDetector gesture={gesture}>
            <View>
              <Svg width={width} height={height + PAD.t + PAD.b}>
                <Defs>
                  <ClipPath id={`clip${uid}`}><AnimatedRect x={0} y={0} height={height + PAD.t + PAD.b} animatedProps={clipProps} /></ClipPath>
                  {series.map((s, k) => (s.area ? (
                    <SvgGradient key={k} id={`area${uid}${k}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={s.color} stopOpacity={0.16} />
                      <Stop offset="1" stopColor={s.color} stopOpacity={0} />
                    </SvgGradient>
                  ) : null))}
                </Defs>

                {bands.map((b, k) => {
                  const y1 = yAt(Math.min(hi, b.to)), y2 = yAt(Math.max(lo, b.from));
                  if (y2 <= y1) return null;
                  return (
                    <G key={k}>
                      <Rect x={PAD.l} y={y1} width={W} height={y2 - y1} fill={b.color} opacity={0.1} />
                      {b.label ? <SvgText x={PAD.l + 6} y={y1 + 12} fontSize={10} fontFamily="Inter_600SemiBold" fill={ink(b.color)} textAnchor="start">{b.label}</SvgText> : null}
                    </G>
                  );
                })}

                {ticks.map((t) => (
                  <G key={t}>
                    <Line x1={PAD.l} x2={PAD.l + W} y1={yAt(t)} y2={yAt(t)} stroke={colors.separator} strokeWidth={1} />
                    <SvgText x={PAD.l - 6} y={yAt(t) + 3.5} fontSize={10} fontFamily="Inter_500Medium" fill={colors.textTertiary} textAnchor="end">{compact(t, Number.isInteger(t) ? 0 : 1)}</SvgText>
                  </G>
                ))}
                {labelIdx.map((i, k) => (
                  <SvgText key={i} x={xAt(i)} y={height + PAD.t + 16} fontSize={10} fontFamily="Inter_500Medium" fill={colors.textTertiary}
                    textAnchor={k === 0 && labelIdx.length > 1 ? 'start' : k === labelIdx.length - 1 && labelIdx.length > 1 ? 'end' : 'middle'}>{shortDate(dates[i])}</SvgText>
                ))}

                <G clipPath={`url(#clip${uid})`}>
                  {[...series].reverse().map((s, ri) => {
                    const k = series.length - 1 - ri;
                    return runs(s.values).map(([a, b], j) => {
                      const pts: Pt[] = [];
                      for (let i = a; i <= b; i++) pts.push({ x: xAt(i), y: yAt(s.values[i] as number) });
                      if (pts.length === 1) return <Circle key={`${k}-${j}`} cx={pts[0].x} cy={pts[0].y} r={3.5} fill={s.color} />;
                      const d = monotonePath(pts);
                      return (
                        <G key={`${k}-${j}`}>
                          {s.area ? <Path d={`${d} L ${pts[pts.length - 1].x} ${PAD.t + height} L ${pts[0].x} ${PAD.t + height} Z`} fill={`url(#area${uid}${k})`} /> : null}
                          <Path d={d} stroke={s.color} strokeWidth={s.muted ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={s.muted ? 0.9 : 1} />
                        </G>
                      );
                    });
                  })}
                  {active == null && lastNonNull >= 0 ? (
                    <G>
                      <Circle cx={xAt(lastNonNull)} cy={yAt(primary.values[lastNonNull] as number)} r={6} fill={colors.surface} />
                      <Circle cx={xAt(lastNonNull)} cy={yAt(primary.values[lastNonNull] as number)} r={4} fill={primary.color} />
                    </G>
                  ) : null}
                </G>

                {active != null ? (
                  <G>
                    <Line x1={xAt(active)} x2={xAt(active)} y1={PAD.t} y2={PAD.t + height} stroke={colors.hairline} strokeWidth={1} />
                    {series.map((s, k) => (s.values[active] != null ? (
                      <G key={k}>
                        <Circle cx={xAt(active)} cy={yAt(s.values[active] as number)} r={6} fill={colors.surface} />
                        <Circle cx={xAt(active)} cy={yAt(s.values[active] as number)} r={4} fill={s.color} />
                      </G>
                    ) : null))}
                  </G>
                ) : null}
              </Svg>
            </View>
          </GestureDetector>
        ) : null}
      </View>
    </ChartCard>
  );
}
