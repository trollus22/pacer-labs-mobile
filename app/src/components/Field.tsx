import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { fonts, radius, accent, useTheme, createStyles } from '@/theme';

type Props = TextInputProps & { label: string; hint?: string };

// Campo con etiqueta fija arriba. El borde se enciende en coral al enfocar (transición de 160 ms).
export function Field({ label, hint, style, onFocus, onBlur, multiline, ...rest }: Props) {
  const { colors, scheme } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
      <Animated.View style={[styles.box, { borderColor: focused ? accent.coral : 'transparent' }, transition]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textTertiary}
          selectionColor={accent.coral}
          keyboardAppearance={scheme}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, multiline && styles.multiline, style]}
        />
      </Animated.View>
      {hint ? <Text variant="footnote" color={colors.textTertiary}>{hint}</Text> : null}
    </View>
  );
}

const transition = { transitionProperty: 'borderColor', transitionDuration: '160ms' } as const;

const useStyles = createStyles((colors) => ({
  wrap: { gap: 8 },
  box: { backgroundColor: colors.surface2, borderRadius: radius.md, borderCurve: 'continuous', borderWidth: 1.5 },
  input: { fontFamily: fonts.medium, fontSize: 17, color: colors.text, paddingHorizontal: 16, height: 54 },
  multiline: { height: undefined, minHeight: 110, paddingTop: 15, paddingBottom: 15 },
}));
