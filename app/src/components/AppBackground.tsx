import { useId } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { alpha } from '@/lib/color';
import { metal, useTheme } from '@/theme';

type Blob = { c: string; x: number; y: number; rx: number; ry: number; o: number };

// Bruma muy sutil: naranja cálido arriba a la derecha y abajo a la izquierda; negro en las esquinas para dar profundidad al metal.
const HAZE: Blob[] = [
  { c: '#E07B2E', x: 92, y: 6, rx: 62, ry: 26, o: 0.2 },
  { c: '#E07B2E', x: 4, y: 82, rx: 55, ry: 22, o: 0.08 },
  { c: '#000000', x: 0, y: 0, rx: 58, ry: 22, o: 0.12 },
  { c: '#000000', x: 100, y: 100, rx: 60, ry: 24, o: 0.07 },
];

/**
 * Fondo de todas las pantallas: degradado de metal cepillado que se funde con el hormigón hacia abajo (el de la pantalla de inicio),
 * con una bruma sutil de naranja y negro por encima. Va fijo detrás del contenido.
 */
export function AppBackground({ metalHeight = '58%' }: { metalHeight?: `${number}%` | number }) {
  const { colors } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const fill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };
  return (
    <View pointerEvents="none" style={fill}>
      <LinearGradient colors={[alpha(metal.base, 1), alpha(metal.mid, 0.78), alpha(metal.light, 0.32), alpha(colors.bg, 0)]} locations={[0, 0.34, 0.7, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: metalHeight }} />
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={fill}>
        <Defs>
          {HAZE.map((b, i) => (
            <RadialGradient key={i} id={`${uid}${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={b.c} stopOpacity={b.o} />
              <Stop offset="0.55" stopColor={b.c} stopOpacity={b.o * 0.45} />
              <Stop offset="1" stopColor={b.c} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {HAZE.map((b, i) => <Ellipse key={i} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill={`url(#${uid}${i})`} />)}
      </Svg>
    </View>
  );
}
