import { Share, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { PressableScale } from '@/components/PressableScale';
import { Segmented } from '@/components/Segmented';
import { ActionTile } from '@/components/Tile';
import { router } from 'expo-router';
import { useQuery } from '@/lib/query';
import type { WearablesInfo } from '@/lib/types';
import { Text } from '@/components/Text';
import { radius, accent, sports, useTheme, createStyles } from '@/theme';
import { useAuth } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';

export default function Profile() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user, team, teams, signOut } = useAuth();
  const { pref, setPref } = useTheme();
  const { data: wear } = useQuery<WearablesInfo>(user ? '/wearables' : null);
  if (!user || !team) return null;
  const coach = user.role === 'coach';

  const logout = async () => {
    if (await confirm('¿Cerrar sesión?', 'Tendrás que volver a introducir tu email y contraseña.', 'Cerrar sesión')) { haptic.medium(); await signOut(); }
  };
  const invite = () => Share.share({ message: `Únete a mi equipo en PACER LABS con el código ${team.inviteCode}.` });

  return (
    <Screen webTitle="Perfil">
      <View style={styles.head}>
        <Avatar name={user.name} size={88} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text variant="title1">{user.name}</Text>
          <Text variant="subhead" color={colors.textSecondary}>{user.email}</Text>
          <View style={{ alignSelf: 'center' }}><Chip label={coach ? 'Entrenador' : 'Atleta'} color={coach ? accent.coral : accent.blue} /></View>
        </View>
      </View>

      <View style={styles.card}>
        <Row label="Equipo" value={team.name} />
        {coach ? <Row label="Código de invitación" value={team.inviteCode ?? ''} mono last /> : <Row label="Entrenador" value={team.coach?.name ?? '—'} last />}
      </View>

      {(() => {
        const on = wear?.providers.filter((p) => p.state !== 'available').map((p) => p.name) ?? [];
        return <ActionTile icon="watch-variant" title="Relojes y pulseras" note={on.length ? `Conectado: ${on.join(', ')}` : 'Conecta Garmin, Zepp o COROS para importar tu sueño y tus entrenos.'} onPress={() => router.push('/devices')} />;
      })()}

      {coach ? <ActionTile icon="account-group-outline" title="Mis equipos" note={`${teams.length} ${teams.length === 1 ? 'equipo' : 'equipos'} · activo: ${team.name}`} onPress={() => router.push('/teams')} /> : null}
      <ActionTile icon="trophy-outline" title="Mis deportes" note={user.sports.length ? user.sports.map((s) => sports[s].label).join(', ') : 'Elige los deportes que practicas.'} onPress={() => router.push('/sports')} />

      <View style={{ gap: 10 }}>
        <Text variant="caption" color={colors.textSecondary}>Apariencia</Text>
        <Segmented
          value={pref}
          onChange={setPref}
          options={[{ key: 'system', label: 'Sistema' }, { key: 'light', label: 'Claro' }, { key: 'dark', label: 'Oscuro' }]}
        />
      </View>

      {coach ? <Button title="Invitar atletas" kind="ghost" onPress={invite} /> : null}
      <Button title="Cerrar sesión" kind="danger" onPress={logout} />
      <PressableScale onPress={() => router.push('/delete-account')} accessibilityRole="button" accessibilityLabel="Eliminar mi cuenta" style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="subhead" color={colors.textSecondary}>Eliminar mi cuenta</Text>
      </PressableScale>
      <Text variant="footnote" color={colors.textTertiary} center>PACER LABS · versión {Constants.expoConfig?.version ?? '—'} ({Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? '—'})</Text>
    </Screen>
  );
}

const Row = ({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
  <View style={[styles.row, !last && styles.rowBorder]}>
    <Text variant="body" color={colors.textSecondary}>{label}</Text>
    <Text variant="body" mono={mono} style={styles.value} numberOfLines={1}>{value}</Text>
  </View>
);
};

const useStyles = createStyles((colors) => ({
  head: { alignItems: 'center', gap: 16, paddingTop: 16 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 56 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  value: { flexShrink: 1, textAlign: 'right' },
}));
