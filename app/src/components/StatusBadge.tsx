import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from './Text';
import { alpha } from '@/lib/color';
import type { MaterialCommunityIcons as MCI } from '@expo/vector-icons';

type Icon = React.ComponentProps<typeof MCI>['name'];

/** Insignia de estado: icono + etiqueta sobre un tinte del mismo color. Nunca solo color. */
export function StatusBadge({ label, icon, color, small, bare, onGlass }: { label: string; icon: Icon; color: string; small?: boolean; /** sin tinte ni relleno: solo icono y etiqueta */ bare?: boolean; /** sobre una tarjeta de cristal: fondo oscuro y texto blanco, icono en el color del estado */ onGlass?: boolean }) {
  if (bare) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <MaterialCommunityIcons name={icon} size={15} color={color} />
        <Text variant="caption" color={color} style={{ fontSize: 9.5, letterSpacing: 0.6 }}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', height: small ? 24 : 28, paddingHorizontal: small ? 8 : 10, borderRadius: 14, backgroundColor: onGlass ? color : alpha(color, 0.16) }}>
      <MaterialCommunityIcons name={icon} size={small ? 13 : 15} color={onGlass ? '#FFFFFF' : color} />
      <Text variant="caption" color={onGlass ? '#FFFFFF' : color} style={{ fontSize: small ? 9.5 : 10.5 }}>{label}</Text>
    </View>
  );
}
