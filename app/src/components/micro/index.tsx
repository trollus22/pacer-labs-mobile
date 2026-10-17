import { createContext, useContext, useEffect } from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { monotonePath, runs, type Pt } from '../charts/shapes';
import { spring, useTheme } from '@/theme';

// «Datos como textura»: micro-visualizaciones monocromas de trazo fino que acompañan a una cifra, siempre abajo a la derecha de
// una tarjeta. Nunca sustituyen al número ni llevan significado solo en el color.

type Ink = { ink: string; dim: string };
const InkContext = createContext<Ink | null>(null);
/** Una tarjeta de cristal (texto blanco) cambia la tinta de sus micro-visualizaciones. */
export const InkProvider = InkContext.Provider;
function useInk(): Ink {
  const ctx = useContext(InkContext);
  const { colors } = useTheme();
  return ctx ?? { ink: colors.ink, dim: colors.inkDim };
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Cinco puntos unidos por una línea; el actual es grande. value: 0–1. El punto grande viaja hasta su sitio al aparecer. */
export function DotScale({ value, n = 5, width = 108, delay = 0 }: { value: number; n?: number; width?: number; delay?: number }) {
  const { ink, dim } = useInk();
  const reduced = useReducedMotion();
  const pad = 9, h = 22;
  const at = (i: number) => pad + (i * (width - pad * 2)) / (n - 1);
  const active = Math.max(0, Math.min(n - 1, value * (n - 1)));
  const x = useSharedValue(reduced ? at(active) : at(0));
  useEffect(() => { x.set(reduced ? at(active) : withDelay(delay + 250, withSpring(at(active), spring.settle))); });
  const props = useAnimatedProps(() => ({ cx: x.get() }));
  const halo = useAnimatedProps(() => ({ cx: x.get() }));
  return (
    <Svg width={width} height={h}>
      <Line x1={pad} x2={width - pad} y1={h / 2} y2={h / 2} stroke={dim} strokeWidth={1} />
      {Array.from({ length: n }, (_, i) => <Circle key={i} cx={at(i)} cy={h / 2} r={2.4} fill={ink} opacity={Math.abs(i - active) < 0.6 ? 0 : 0.9} />)}
      <AnimatedCircle cy={h / 2} r={9.5} fill={dim} animatedProps={halo} />
      <AnimatedCircle cy={h / 2} r={6.5} fill={ink} animatedProps={props} />
    </Svg>
  );
}

/** Mini barras de altura variable; la última, en tinta plena. */
export function TickBars({ values, width = 100, height = 24 }: { values: number[]; width?: number; height?: number }) {
  const { ink, dim } = useInk();
  const n = values.length;
  if (!n) return <Svg width={width} height={height} />;
  const max = Math.max(...values, 1);
  const bw = 3, gap = n > 1 ? (width - bw * n) / (n - 1) : 0;
  return (
    <Svg width={width} height={height}>
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * (height - 2));
        return <Path key={i} d={`M ${i * (bw + gap) + bw / 2} ${height} L ${i * (bw + gap) + bw / 2} ${height - h}`} stroke={i === n - 1 ? ink : v > 0 ? ink : dim} strokeOpacity={i === n - 1 ? 1 : v > 0 ? 0.55 : 0.5} strokeWidth={bw} strokeLinecap="round" />;
      })}
    </Svg>
  );
}

/** Línea fina con dos puntos en los picos. */
export function WaveLine({ values, width = 100, height = 26 }: { values: (number | null)[]; width?: number; height?: number }) {
  const { ink, dim } = useInk();
  const have = values.filter((v): v is number => v != null);
  if (have.length < 2) return <Svg width={width} height={height} />;
  const lo = Math.min(...have), hi = Math.max(...have), span = hi - lo || 1;
  const n = values.length, pad = 4;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (n - 1);
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - lo) / span);
  const peaks = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null).sort((a, b) => b.v - a.v).slice(0, 2);
  return (
    <Svg width={width} height={height}>
      {runs(values).map(([a, b], j) => {
        const pts: Pt[] = [];
        for (let i = a; i <= b; i++) pts.push({ x: x(i), y: y(values[i] as number) });
        return pts.length > 1 ? <Path key={j} d={monotonePath(pts)} stroke={dim} strokeWidth={1.4} strokeLinecap="round" fill="none" /> : null;
      })}
      {peaks.map((p) => <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={2.8} fill={ink} />)}
    </Svg>
  );
}

/** Arcos festoneados con rayitas entre ellos: `filled` arcos en tinta plena (p. ej. días con entreno de la semana). */
export function ArchRow({ n = 5, filled = 0, width = 100, height = 22 }: { n?: number; filled?: number; width?: number; height?: number }) {
  const { ink, dim } = useInk();
  const seg = width / n, aw = seg * 0.74, base = height - 3;
  return (
    <Svg width={width} height={height}>
      {Array.from({ length: n }, (_, i) => {
        const x0 = i * seg, on = i < filled;
        return (
          <Path key={i} d={`M ${x0} ${base} Q ${x0 + aw / 2} ${-base * 0.5} ${x0 + aw} ${base}`} stroke={on ? ink : dim} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        );
      })}
      {Array.from({ length: n }, (_, i) => <Line key={`b${i}`} x1={i * seg + aw + 1} x2={(i + 1) * seg - 1} y1={base} y2={base} stroke={dim} strokeWidth={1.6} strokeLinecap="round" />)}
    </Svg>
  );
}

/** Matriz de puntos 2×N: los rellenos son eventos (días con entreno, check-ins…). */
export function DotMatrix({ filled, rows = 2, width = 100, height = 22 }: { filled: boolean[]; rows?: number; width?: number; height?: number }) {
  const { ink, dim } = useInk();
  const cols = Math.ceil(filled.length / rows);
  const dx = cols > 1 ? (width - 6) / (cols - 1) : 0, dy = rows > 1 ? (height - 6) / (rows - 1) : 0;
  return (
    <Svg width={width} height={height}>
      {filled.map((on, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        return <Circle key={i} cx={3 + col * dx} cy={3 + row * dy} r={on ? 2.7 : 1.7} fill={on ? ink : dim} />;
      })}
    </Svg>
  );
}
