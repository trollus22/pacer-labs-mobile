import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { CSS_EASE_OUT } from '@/lib/motion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Escala al pulsar. 0.97 para filas y botones; 0.92 para elementos pequeños (iconos, chips). */
  scale?: number;
  /** Vibración ligera al confirmar la pulsación. Úsala solo en acciones con consecuencia. */
  feedback?: boolean;
};

// Las propiedades de colocación (flex, márgenes…) van al contenedor; el resto, a la vista que escala.
const OUTER_KEYS = ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight'] as const;

// Respuesta en pointer-down (no al soltar), 120 ms con curva ease-out fuerte. Transición CSS de Reanimated:
// corre en el hilo de UI y se puede interrumpir a mitad.
export function PressableScale({ children, style, scale = 0.97, feedback, onPress, onPressIn, onPressOut, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);
  const inner: ViewStyle = { ...(StyleSheet.flatten(style) ?? {}) };
  const outer: ViewStyle = {};
  for (const k of OUTER_KEYS) if (k in inner) { (outer as Record<string, unknown>)[k] = inner[k]; delete inner[k]; }
  return (
    <Pressable
      style={outer}
      hitSlop={8}
      pressRetentionOffset={16}
      accessibilityRole="button"
      {...rest}
      onPressIn={(e) => { setPressed(true); onPressIn?.(e); }}
      onPressOut={(e) => { setPressed(false); onPressOut?.(e); }}
      onPress={(e) => { if (feedback) haptic.light(); onPress?.(e); }}
    >
      <Animated.View
        style={[
          { transform: [{ scale: 1 }], transitionProperty: 'transform', transitionDuration: '120ms', transitionTimingFunction: CSS_EASE_OUT },
          inner,
          pressed && { transform: [{ scale }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
