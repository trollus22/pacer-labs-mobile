import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Text } from './Text';
import { accent, useTheme } from '@/theme';
import { appleEnabled } from '@/lib/apple';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';

/** Botón oficial «Iniciar sesión con Apple» (iOS, solo en builds con la capacidad). Primera vez: pide rol en `/apple`. */
export function AppleButton({ mode = 'in' }: { mode?: 'in' | 'up' }) {
  const { scheme } = useTheme();
  const { signInWithApple } = useAuth();
  const [error, setError] = useState('');
  if (!appleEnabled) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Apple = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
  const press = async () => {
    setError('');
    try {
      const r = await signInWithApple();
      if (r === 'needs_registration') router.push('/apple');
      else if (r === 'done') haptic.success();
    } catch (e) { haptic.error(); setError((e as Error).message); }
  };
  return (
    <View style={{ gap: 8 }}>
      <Apple.AppleAuthenticationButton
        buttonType={mode === 'in' ? Apple.AppleAuthenticationButtonType.SIGN_IN : Apple.AppleAuthenticationButtonType.SIGN_UP}
        buttonStyle={scheme === 'dark' ? Apple.AppleAuthenticationButtonStyle.WHITE : Apple.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={27}
        style={{ height: 54, width: '100%' }}
        onPress={press}
      />
      {error ? <Text variant="subhead" color={accent.pink} accessibilityLiveRegion="polite">{error}</Text> : null}
    </View>
  );
}
