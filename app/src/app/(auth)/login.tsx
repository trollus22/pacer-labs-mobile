import { useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppleButton } from '@/components/AppleButton';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { accent, useTheme, createStyles } from '@/theme';
import { useFloatingHeader } from '@/theme/header';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';

export default function Login() {
  const floatingHeader = useFloatingHeader();
  const { colors } = useTheme();
  const styles = useStyles();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try { await signIn(email, password); }
    catch (e) { haptic.error(); setError((e as Error).message); setLoading(false); }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Stack.Screen options={floatingHeader} />
      <View style={{ gap: 8 }}>
        <Text variant="largeTitle">Bienvenido de nuevo</Text>
        <Text variant="body" color={colors.textSecondary}>Entra para ver tus entrenos.</Text>
      </View>
      <View style={{ gap: 16 }}>
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" autoCorrect={false} returnKeyType="next" />
        <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
        {error ? <Animated.View entering={FadeIn.duration(180)}><Text variant="subhead" color={accent.pink} accessibilityLiveRegion="polite">{error}</Text></Animated.View> : null}
      </View>
      <View style={{ gap: 4 }}>
        <Button title="Entrar" onPress={submit} loading={loading} disabled={!email || !password} />
        <View style={{ marginTop: 8 }}><AppleButton mode="in" /></View>
        <PressableScale onPress={() => router.replace('/register')} style={styles.link}>
          <Text variant="headline" color={colors.textSecondary}>Crear una cuenta</Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({ content: { paddingTop: 72, gap: 32 }, link: { height: 52, alignItems: 'center', justifyContent: 'center' } }));
