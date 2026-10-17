import { useId } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Mesh } from '@/theme';

/** Degradado de malla: manchas de color con borde difuminado sobre un color base. Rellena su contenedor. */
export function MeshGradient({ mesh }: { mesh: Mesh }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <Defs>
        {mesh.blobs.map((b, i) => (
          <RadialGradient key={i} id={`${uid}${i}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={b.c} stopOpacity={b.o ?? 1} />
            <Stop offset="0.5" stopColor={b.c} stopOpacity={(b.o ?? 1) * 0.6} />
            <Stop offset="1" stopColor={b.c} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill={mesh.base} />
      {mesh.blobs.map((b, i) => <Ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry ?? b.rx} fill={`url(#${uid}${i})`} />)}
    </Svg>
  );
}
