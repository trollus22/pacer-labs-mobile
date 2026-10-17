import { useState } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { accent, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { appleCredential, appleEnabled } from '@/lib/apple';
import { useAuth } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';

const Item = ({ icon, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; text: string }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} style={{ marginTop: 1 }} />
      <Text variant="subhead" style={{ flex: 1 }}>{text}</Text>
    </View>
  );
};

// Borrar la cuenta para siempre. Pide la contraseña (o a Apple si la cuenta es solo de Apple) y una confirmación final.
export default function DeleteAccount() {
  const { user, teams, signOut } = useAuth();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!user) return null;
  const coach = user.role === 'coach';
  const athletes = teams.reduce((n, t) => n + t.athleteCount, 0);
  const viaApple = !user.hasPassword;
  const canConfirm = viaApple ? appleEnabled : password.length > 0;

  const go = async () => {
    if (!(await confirm('¿Eliminar tu cuenta?', 'No se puede deshacer. Se borrarán tus datos de PACER LABS para siempre.', 'Eliminar para siempre'))) return;
    setBusy(true); setError('');
    try {
      let body: Record<string, unknown> = { confirm: true, password };
      if (viaApple) {
        const c = await appleCredential();
        if (!c) { setBusy(false); return; }
        body = { confirm: true, identityToken: c.identityToken, nonce: c.nonce };
      }
      await api('/me/delete', { method: 'POST', body });
      haptic.success();
      await signOut();            // limpia el token local y vuelve a la pantalla de entrada
    } catch (e) { haptic.error(); setError((e as Error).message); setBusy(false); }
  };

  return (
    <Screen keyboard contentStyle={{ paddingTop: 28, gap: 22 }}>
      <View style={{ gap: 6 }}>
        <Text variant="title1">Eliminar cuenta</Text>
        <Text variant="subhead" secondary>Esto borra tu cuenta de PACER LABS. No se puede deshacer.</Text>
      </View>

      <View style={{ gap: 14 }}>
        <Text variant="caption" secondary>Qué se borra</Text>
        {coach ? (
          <>
            <Item icon="account-outline" text="Tu perfil, tus sesiones abiertas y tus comentarios." />
            <Item icon="account-group-outline" text="Tus equipos vacíos y sus plantillas." />
            {athletes > 0 ? <Item icon="account-heart-outline" text={`Tus ${athletes} ${athletes === 1 ? 'atleta' : 'atletas'} NO se borran: conservan su cuenta y sus datos, pero se quedan sin entrenador y el código de tu equipo deja de funcionar.`} /> : null}
          </>
        ) : (
          <>
            <Item icon="account-outline" text="Tu perfil y tus sesiones abiertas." />
            <Item icon="calendar-check-outline" text="Tus entrenos, resultados, comentarios y check-ins." />
            <Item icon="watch-variant" text="Los relojes conectados y todos los datos que importaron (sueño, pulso, HRV, actividades)." />
            <Item icon="eye-off-outline" text="Tu entrenador dejará de verte. Lo que ya mandaste a tu reloj se queda en el reloj; bórralo desde su app." />
          </>
        )}
      </View>

      {viaApple ? (
        <Text variant="subhead" color={colors.textSecondary}>{appleEnabled ? 'Tu cuenta es de Apple: te pediremos que confirmes con Apple.' : 'Tu cuenta es de Apple y esta versión no puede confirmarlo con Apple. Actualiza la app.'}</Text>
      ) : (
        <Field label="Tu contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" hint="Para confirmar que eres tú." />
      )}
      {error ? <Text variant="subhead" color={accent.pink} accessibilityLiveRegion="polite">{error}</Text> : null}
      <Button title="Eliminar mi cuenta para siempre" kind="danger" onPress={go} loading={busy} disabled={!canConfirm} />
    </Screen>
  );
}
