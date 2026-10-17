import Svg, { Circle, Path } from 'react-native-svg';
import { monotonePath, runs, type Pt } from './shapes';
import { useTheme } from '@/theme';

/** Tendencia en miniatura (14 días). Sin ejes: acompaña a un número, no lo sustituye. */
export function Sparkline({ values, color, width = 64, height = 26, domain = [0, 100] }: { values: (number | null)[]; color: string; width?: number; height?: number; domain?: [number, number] }) {
  const { colors } = useTheme();
  const n = values.length;
  if (n < 2 || values.filter((v) => v != null).length < 2) return <Svg width={width} height={height} />;
  const pad = 4;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (n - 1);
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - domain[0]) / (domain[1] - domain[0] || 1));
  let last = -1;
  values.forEach((v, i) => { if (v != null) last = i; });
  return (
    <Svg width={width} height={height}>
      {runs(values).map(([a, b], j) => {
        const pts: Pt[] = [];
        for (let i = a; i <= b; i++) pts.push({ x: x(i), y: y(values[i] as number) });
        return pts.length > 1 ? <Path key={j} d={monotonePath(pts)} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" /> : null;
      })}
      <Circle cx={x(last)} cy={y(values[last] as number)} r={5} fill={colors.surface} />
      <Circle cx={x(last)} cy={y(values[last] as number)} r={3.2} fill={color} />
    </Svg>
  );
}
