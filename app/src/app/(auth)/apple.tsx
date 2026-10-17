import { useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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

// Primera vez con Apple: Apple ya nos ha identificado; solo falta saber si eres atleta o entrenador.
export default function AppleSetup() {
  const floatingHeader = useFloatingHeader();
  const { colors } = useTheme();
  const styles = useStyles();
  const { completeApple } = useAuth();
  const [role, setRole] = useState<Role>('athlete');
  const [inviteCode, setInviteCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ready = role === 'coach' || inviteCode.trim().length > 0;

  const submit = async () => {
    if (loading || !ready) return;
    setError(''); setLoading(true);
    try { await completeApple({ role, inviteCode: role === 'athlete' ? inviteCode : undefined, teamName: role === 'coach' ? teamName : undefined }); haptic.success(); }
    catch (e) { haptic.error(); setError((e as Error).message); setLoading(false); }
  };

  return (
    <Screen keyboard contentStyle={styles.content}>
      <Stack.Screen options={floatingHeader} />
      <View style={{ gap: 8 }}>
        <Text variant="largeTitle">Casi listo</Text>
        <Text variant="body" color={colors.textSecondary}>Cuenta de Apple verificada. Dinos cómo vas a usar PACER LABS.</Text>
      </View>
      <Segmented value={role} onChange={setRole} options={[{ key: 'athlete', label: 'Soy atleta' }, { key: 'coach', label: 'Soy entrenador' }]} />
      <View style={{ gap: 16 }}>
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
        <Button title="Continuar" onPress={submit} loading={loading} disabled={!ready} />
        <PressableScale onPress={() => router.back()} style={styles.link}><Text variant="headline" color={colors.textSecondary}>Cancelar</Text></PressableScale>
      </View>
    </Screen>
  );
}

const useStyles = createStyles(() => ({ content: { paddingTop: 72, gap: 28 }, link: { height: 52, alignItems: 'center', justifyContent: 'center' } }));
