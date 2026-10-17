import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { fonts, spring, accent, useTheme, createStyles } from '@/theme';
import { WEEKDAY_INITIALS, dayNumber, todayISO } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { alpha } from '@/lib/color';

export type DayMark = { color: string; done: boolean };
const GAP = 3;

// Tira de 7 días. La selección es una píldora blanca que viaja de un día a otro con un muelle sin rebote.
export function WeekStrip({ days, selected, onSelect, marks }: {
  days: string[]; selected: string | null; onSelect: (d: string) => void; marks: Record<string, DayMark[]>;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [w, setW] = useState(0);
  const reduced = useReducedMotion();
  const cell = w / 7;
  const idx = selected ? days.indexOf(selected) : -1;
  const x = useSharedValue(0);
  const shown = useSharedValue(0);
  const placed = useSharedValue(false);
  const today = todayISO();

  useEffect(() => {
    if (!cell) return;
    if (idx < 0) { shown.set(withSpring(0, spring.settle)); return; }
    shown.set(withSpring(1, spring.settle));
    if (!placed.get() || reduced) { x.set(idx * cell); placed.set(true); } else x.set(withSpring(idx * cell, spring.settle));
  }, [idx, cell, reduced, x, shown, placed]);

  const pill = useAnimatedStyle(() => ({ opacity: shown.get(), transform: [{ translateX: x.get() }] }));

  return (
    <View style={styles.row} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.pill, { width: cell - GAP * 2, left: GAP }, pill]} />}
      {days.map((d, i) => {
        const on = d === selected, isToday = d === today;
        const dayMarks = marks[d] ?? [];
        return (
          <Pressable
            key={d}
            style={styles.cell}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${WEEKDAY_INITIALS[i]} ${dayNumber(d)}${dayMarks.length ? `, ${dayMarks.length} entrenos` : ''}`}
            onPress={() => { if (!on) { haptic.select(); onSelect(d); } }}
          >
            <Animated.Text style={[styles.initial, { color: on ? alpha(colors.bg, 0.6) : colors.textTertiary }, transition]}>{WEEKDAY_INITIALS[i]}</Animated.Text>
            <Animated.Text style={[styles.number, { color: on ? colors.bg : isToday ? accent.coral : colors.text }, transition]}>{dayNumber(d)}</Animated.Text>
            <View style={styles.dots}>
              {dayMarks.slice(0, 3).map((m, k) => (
                <View key={k} style={[styles.dot, m.done ? { backgroundColor: m.color } : { borderColor: m.color, borderWidth: 1.5 }]} />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const transition = { transitionProperty: 'color', transitionDuration: '160ms' } as const;

const useStyles = createStyles((colors) => ({
  row: { flexDirection: 'row', height: 82 },
  pill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 22, borderCurve: 'continuous', backgroundColor: colors.text },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  initial: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.6 },
  number: { fontFamily: fonts.monoBold, fontSize: 19, letterSpacing: -0.3 },
  dots: { flexDirection: 'row', gap: 3, height: 8, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
}));
