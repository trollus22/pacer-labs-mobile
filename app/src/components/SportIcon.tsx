import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { sports, type Sport } from '@/theme';
import { alpha } from '@/lib/color';

const GLYPH: Record<Sport, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  run: 'run-fast', trail: 'terrain', bike: 'bike', swim: 'swim', triathlon: 'medal-outline', strength: 'dumbbell', crossfit: 'weight-lifter', hyrox: 'flag-checkered', rowing: 'rowing',
  hiking: 'hiking', ski: 'ski', football: 'soccer', basketball: 'basketball', tennis: 'tennis', padel: 'tennis-ball', yoga: 'yoga', other: 'dots-horizontal-circle-outline',
};

export const sportGlyph = (s: Sport) => GLYPH[s];

/** Icono del deporte en una baldosa del color del deporte (tinte suave sobre negro). */
export function SportIcon({ sport, size = 44, solid }: { sport: Sport; size?: number; solid?: boolean }) {
  const color = sports[sport].color;
  return (
    <View
      accessibilityElementsHidden
      style={{ width: size, height: size, borderRadius: size * 0.34, borderCurve: 'continuous', backgroundColor: solid ? color : alpha(color, 0.16), alignItems: 'center', justifyContent: 'center' }}
    >
      <MaterialCommunityIcons name={GLYPH[sport]} size={size * 0.54} color={solid ? '#000' : color} />
    </View>
  );
}
