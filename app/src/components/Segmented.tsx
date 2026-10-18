import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from './Text';
import { radius, spring, createStyles, useTheme } from '@/theme';
import { haptic } from '@/lib/haptics';

type Option<K extends string> = { key: K; label: string };
const PAD = 3;

// Control segmentado de iOS: la píldora blanca se desliza con un muelle crítico (sin rebote) y se puede interrumpir.
export function Segmented<K extends string>({ options, value, onChange }: { options: Option<K>[]; value: K; onChange: (k: K) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [w, setW] = useState(0);
  const reduced = useReducedMotion();
  const itemW = w ? (w - PAD * 2) / options.length : 0;
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const x = useSharedValue(0);
  const placed = useSharedValue(false);

  useEffect(() => {
    if (!itemW) return;
    const to = index * itemW;
    if (!placed.get() || reduced) { x.set(to); placed.set(true); } else x.set(withSpring(to, spring.settle));
  }, [index, itemW, reduced, x, placed]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View style={styles.track} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {itemW > 0 && <Animated.View style={[styles.pill, { width: itemW }, pill]} />}
      {options.map((o) => (
        <Pressable
          key={o.key}
          style={styles.item}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.key === value }}
          onPress={() => { if (o.key !== value) { haptic.select(); onChange(o.key); } }}
        >
          <Text variant="subhead" color={o.key === value ? colors.bg : colors.textSecondary} style={styles.label}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  track: { flexDirection: 'row', backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.pill, padding: PAD, height: 44 },
  pill: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderRadius: radius.pill, backgroundColor: colors.text },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'Inter_600SemiBold' },
}));
