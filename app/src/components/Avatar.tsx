import { View } from 'react-native';
import { Text } from './Text';
import { accent } from '@/theme';
import { alpha } from '@/lib/color';
import { initials } from '@/lib/format';

const PALETTE = [accent.coral, accent.blue, accent.amber, accent.violet, accent.green, accent.pink];
const colorFor = (name: string) => PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const c = colorFor(name);
  return (
    <View accessibilityElementsHidden style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: alpha(c, 0.18), alignItems: 'center', justifyContent: 'center' }}>
      <Text variant={size > 60 ? 'title1' : 'subhead'} color={c} style={{ fontFamily: 'PlusJakartaSans_800ExtraBold' }}>{initials(name)}</Text>
    </View>
  );
}
