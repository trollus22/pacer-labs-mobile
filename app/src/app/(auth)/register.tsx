import { useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppleButton } from '@/components/AppleButton';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';
import { accent, useTheme, createStyles } from '@/theme';
import { useFloatingHeader } from '@/theme/header';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';
import { EASE_OUT } from '@/lib/motion';
import type { Role } from '@/lib/types';

const FIELD_IN = FadeInDown.duration(220).easing(EASE_OUT);

export default function Register() {
  const floatingHeader = useFloatingHeader();
  const { colors } = useTheme();
  const styles = useStyles();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>('athlete');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ready = name.trim() && email && password.length >= 8 && (role === 'coach' || inviteCode.trim().length > 0);

  const submit = async () => {
    if (loading || !ready) return;
    setError('');
    setLoading(true);
    try { await register({ name, email, password, role, inviteCode: role === 'athlete' ? inviteCode : undefined, teamName: role === 'coach' ? teamName : undefined }); haptic.success(); }
    catch (e) { haptic.error(); setError((e as Error).message); setLoading(false); }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Stack.Screen options={floatingHeader} />
      <View style={{ gap: 8 }}>
        <Text variant="largeTitle">Crea tu cuenta</Text>
        <Text variant="body" color={colors.textSecondary}>Dinos cómo vas a usar PACER LABS.</Text>
      </View>
      <Segmented value={role} onChange={setRole} options={[{ key: 'athlete', label: 'Soy atleta' }, { key: 'coach', label: 'Soy entrenador' }]} />
      <View style={{ gap: 16 }}>
        <Field label="Nombre" value={name} onChangeText={setName} autoComplete="name" textContentType="name" autoCapitalize="words" returnKeyType="next" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" autoCorrect={false} returnKeyType="next" />
        <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" hint="Mínimo 8 caracteres." />
        {role === 'athlete' ? (
          <Animated.View key="athlete" entering={FIELD_IN}>
            <Field label="Código de invitación" value={inviteCode} onChangeText={(t) => setInviteCode(t.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={12} hint="Te lo da tu entrenador." returnKeyType="go" onSubmitEditing={submit} />
          </Animated.View>
        ) : (
          <Animated.View key="coach" entering={FIELD_IN}>
            <Field label="Nombre del equipo (opcional)" value={teamName} onChangeText={setTeamName} returnKeyType="go" onSubmitEditing={submit} />
          </Animated.View>
        )}
        {error ? <Animated.View entering={FadeIn.duration(180)}><Text variant="subhead" color={accent.pink} accessibilityLiveRegion="polite">{error}</Text></Animated.View> : null}
      </View>
      <View style={{ gap: 4 }}>
        <Button title="Crear cuenta" onPress={submit} loading={loading} disabled={!ready} />
        <View style={{ marginTop: 8 }}><AppleButton mode="up" /></View>
        <PressableScale onPress={() => router.replace('/login')} style={styles.link}>
          <Text variant="headline" color={colors.textSecondary}>Ya tengo cuenta</Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({ content: { paddingTop: 72, gap: 28 }, link: { height: 52, alignItems: 'center', justifyContent: 'center' } }));
