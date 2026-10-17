import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme';

// Isotipo «The Kinetic Pulse»: dos espigas con simetría rotacional de 180°. Caja 200×100.
const PATHS = [
  'M 10 50 L 59 48 L 70.5 28 L 83 46.3 L 132 14.9 L 132 27.2 L 78 59.6 L 59 51 Z',
  'M 190 50 L 141 52 L 129.5 72 L 117 53.7 L 68 85.1 L 68 72.8 L 122 40.4 L 141 49 Z',
];

export function Logo({ width = 64, color }: { width?: number; color?: string }) {
  const { colors } = useTheme();
  return (
    <Svg width={width} height={width / 2} viewBox="0 0 200 100" accessibilityLabel="PACER LABS">
      {PATHS.map((d) => <Path key={d} d={d} fill={color ?? colors.text} />)}
    </Svg>
  );
}
