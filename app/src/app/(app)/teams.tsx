import { useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Field } from '@/components/Field';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { accent, createStyles, radius, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirm } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { invalidateAll } from '@/lib/query';
import type { TeamSummary } from '@/lib/types';

// Equipos del entrenador. El activo es el que ven todas las pestañas; los atletas se unen con el código de cada equipo.
export default function Teams() {
  const { teams, refreshMe } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<unknown>, done?: () => void) => {
    setBusy(true); setError('');
    try { await fn(); await refreshMe(); invalidateAll(); haptic.success(); done?.(); } catch (e) { haptic.error(); setError((e as Error).message); } finally { setBusy(false); }
  };
  const activate = (t: TeamSummary) => { if (t.active) return; void run(() => api(`/teams/${t.id}/activate`, { method: 'POST', body: {} }), () => router.back()); };
  const create = () => run(() => api('/teams', { method: 'POST', body: { name } }), () => { setName(''); router.back(); });
  const rename = (t: TeamSummary) => run(() => api(`/teams/${t.id}`, { method: 'PATCH', body: { name: newName } }), () => setEditing(null));
  const remove = async (t: TeamSummary) => {
    if (!(await confirm(`¿Borrar «${t.name}»?`, 'El equipo está vacío. Se borrarán también sus plantillas.', 'Borrar'))) return;
    await run(() => api(`/teams/${t.id}`, { method: 'DELETE' }));
  };

  return (
    <Screen keyboard contentStyle={{ paddingTop: 28, gap: 22 }}>
      <View style={{ gap: 4 }}>
        <Text variant="title1">Mis equipos</Text>
        <Text variant="subhead" secondary>Pulsa un equipo para verlo y gestionarlo. Cada uno tiene su código de invitación.</Text>
      </View>

      <View style={{ gap: 12 }}>
        {teams.map((t) => (
          <View key={t.id} style={[styles.card, t.active && { borderColor: accent.coral }]}>
            <PressableScale onPress={() => activate(t)} accessibilityLabel={`${t.name}${t.active ? ', equipo activo' : '. Toca para activarlo'}`} style={styles.head}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="headline" numberOfLines={1}>{t.name}</Text>
                <Text variant="footnote" secondary>{t.athleteCount} {t.athleteCount === 1 ? 'atleta' : 'atletas'} · código {t.inviteCode}</Text>
              </View>
              {t.active ? <Chip label="Activo" color={accent.coral} solid /> : <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.textSecondary} />}
            </PressableScale>

            {editing === t.id ? (
              <View style={{ gap: 10 }}>
                <Field label="Nombre del equipo" value={newName} onChangeText={setNewName} maxLength={60} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}><Button title="Guardar" small onPress={() => rename(t)} loading={busy} disabled={!newName.trim()} /></View>
                  <Button title="Cancelar" small kind="ghost" onPress={() => setEditing(null)} />
                </View>
              </View>
            ) : (
              <View style={styles.actions}>
                <Button title="Invitar" small kind="ghost" onPress={() => Share.share({ message: `Únete a ${t.name} en PACER LABS con el código ${t.inviteCode}.` })} />
                <Button title="Renombrar" small kind="ghost" onPress={() => { setEditing(t.id); setNewName(t.name); }} />
                {teams.length > 1 && t.athleteCount === 0 ? <Button title="Borrar" small kind="danger" onPress={() => remove(t)} /> : null}
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <Text variant="caption" secondary>Crear un equipo nuevo</Text>
        <Field label="Nombre" value={name} onChangeText={setName} maxLength={60} placeholder="Club Triatlón Norte" returnKeyType="done" />
        {error ? <Text variant="subhead" color={accent.pink}>{error}</Text> : null}
        <Button title="Crear equipo" onPress={create} loading={busy} disabled={!name.trim()} />
      </View>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderCurve: 'continuous', borderWidth: 1.5, borderColor: colors.separator, padding: 16, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
}));
