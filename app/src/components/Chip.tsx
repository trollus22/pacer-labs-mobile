import { View } from 'react-native';
import { Text } from './Text';
import { alpha } from '@/lib/color';

export function Chip({ label, color, solid }: { label: string; color: string; solid?: boolean }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: solid ? color : alpha(color, 0.16) }}>
      <Text variant="caption" color={solid ? '#000' : color} style={{ fontSize: 10 }}>{label}</Text>
    </View>
  );
}
