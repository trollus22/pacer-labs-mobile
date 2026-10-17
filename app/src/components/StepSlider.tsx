import { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { interpolateColor, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { radius, spring, createStyles } from '@/theme';
import { haptic } from '@/lib/haptics';
import { alpha } from '@/lib/color';

type Props = {
  value: number | null;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Paradas de color a lo largo de la barra (0–1) y sus colores. */
  stops: readonly number[];
  colors: readonly string[];
  label: string;
  /** Marcas de graduación; se omiten solas si hay demasiados pasos. */
  ticks?: boolean;
};

// Barra tipo Centro de Control: el relleno sigue al dedo 1:1, el valor salta por pasos con una vibración de
// selección en cada uno y, al soltar, se asienta en el paso con un muelle crítico (sin rebote).
export function StepSlider({ value, onChange, min, max, step = 1, stops, colors: fillColors, label, ticks = true }: Props) {
  const styles = useStyles();
  const steps = Math.round((max - min) / step) + 1;
  const w = useSharedValue(0);
  const x = useSharedValue(0);
  const pressed = useSharedValue(0);
  const dragging = useSharedValue(false);
  const [ready, setReady] = useState(false);
  const toX = (v: number | null, width: number) => (v == null ? 0 : ((Math.round((v - min) / step) + 1) / steps) * width);

  const onLayout = (e: LayoutChangeEvent) => {
    const lw = e.nativeEvent.layout.width;
    w.set(lw);
    if (!ready) { x.set(toX(value, lw)); setReady(true); }
  };

  const pan = useMemo(() => Gesture.Pan()
    .minDistance(0)
    .failOffsetY([-16, 16])
    .onBegin((e) => {
      dragging.set(true);
      pressed.set(withSpring(1, spring.settle));
      x.set(Math.min(w.get(), Math.max(0, e.x)));
    })
    .onUpdate((e) => { x.set(Math.min(w.get(), Math.max(0, e.x))); })
    .onFinalize(() => {
      dragging.set(false);
      pressed.set(withSpring(0, spring.settle));
      if (w.get() > 0) {
        const k = Math.min(steps, Math.max(1, Math.ceil(x.get() / (w.get() / steps) - 0.0001)));
        x.set(withSpring((k / steps) * w.get(), spring.settle));
      }
    }), [w, x, pressed, dragging, steps]);

  useAnimatedReaction(
    () => (w.get() > 0 && x.get() > 0 ? Math.min(steps, Math.max(1, Math.ceil(x.get() / (w.get() / steps) - 0.0001))) : 0),
    (k, prev) => {
      if (k > 0 && k !== prev) {
        if (dragging.get()) scheduleOnRN(haptic.select);
        scheduleOnRN(onChange, Math.round((min + (k - 1) * step) * 100) / 100);
      }
    },
    [onChange, steps, min, step],
  );

  const fill = useAnimatedStyle(() => ({
    width: x.get(),
    backgroundColor: interpolateColor(w.get() ? x.get() / w.get() : 0, [...stops], [...fillColors]),
  }));
  const track = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pressed.get() * 0.025 }] }));

  const bump = (d: number) => {
    const next = Math.min(max, Math.max(min, (value ?? min - step) + d * step));
    x.set(withSpring(toX(next, w.get()), spring.settle));
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.track, track]}
        onLayout={onLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value ?? undefined }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => bump(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      >
        <Animated.View style={[styles.fill, fill]} />
        {ticks && steps <= 12 ? (
          <View style={styles.ticks} pointerEvents="none">
            {Array.from({ length: steps - 1 }, (_, i) => <View key={i} style={styles.tick} />)}
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const useStyles = createStyles((colors) => ({
  track: { height: 64, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: colors.surface3, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  ticks: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-evenly' },
  tick: { width: 2, height: '100%', backgroundColor: alpha(colors.bg, 0.55) },
}));
