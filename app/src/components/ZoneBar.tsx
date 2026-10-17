import { View } from 'react-native';
import { useTheme, zones } from '@/theme';

/** Cinco barras ascendentes; las encendidas toman el color de la zona. */
export function ZoneBar({ zone, width = 5, height = 16, track }: { zone: number; width?: number; height?: number; track?: string }) {
  const { colors } = useTheme();
  const color = zones[zone - 1]?.color ?? zones[1].color;
  return (
    <View accessible accessibilityLabel={`Intensidad ${zone} de 5, ${zones[zone - 1]?.label}`} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={{ width, height: (height * (0.4 + n * 0.12)) , borderRadius: width / 2, backgroundColor: n <= zone ? color : (track ?? colors.surface3) }} />
      ))}
    </View>
  );
}
