import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { feelings, radius, useTheme, createStyles } from '@/theme';
import { haptic } from '@/lib/haptics';
import { CSS_EASE_OUT } from '@/lib/motion';

const ICONS = ['emoticon-dead-outline', 'emoticon-sad-outline', 'emoticon-neutral-outline', 'emoticon-happy-outline', 'emoticon-excited-outline'] as const;

export function FeelingPicker({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {feelings.map((f, i) => {
        const on = value === i + 1;
        return (
          <PressableScale
            key={f.label}
            scale={0.94}
            style={styles.flex}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={f.label}
            onPress={() => { haptic.select(); onChange(i + 1); }}
          >
            <Animated.View style={[styles.tile, on ? { backgroundColor: f.color, transform: [{ scale: 1.06 }] } : { backgroundColor: colors.surface3, transform: [{ scale: 1 }] }, { transitionProperty: ['backgroundColor', 'transform'], transitionDuration: '180ms', transitionTimingFunction: CSS_EASE_OUT }]}>
              <MaterialCommunityIcons name={ICONS[i]} size={30} color={on ? colors.onAccent : colors.textSecondary} />
              <Text variant="caption" color={on ? colors.onAccent : colors.textTertiary} style={styles.label}>{f.label}</Text>
            </Animated.View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  tile: { height: 78, borderRadius: radius.md, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', gap: 5 },
  label: { fontSize: 9, letterSpacing: 0.4 },
}));
