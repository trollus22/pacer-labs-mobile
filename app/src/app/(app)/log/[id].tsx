import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '@/components/Button';
import { EffortSlider } from '@/components/EffortSlider';
import { FeelingPicker } from '@/components/FeelingPicker';
import { Field } from '@/components/Field';
import { Loading, Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { fonts, rpeColor, sports, accent, useTheme, createStyles } from '@/theme';
import { api } from '@/lib/api';
import { rpeLabel } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { invalidateAll, useQuery } from '@/lib/query';
import type { WearableActivity, Workout } from '@/lib/types';
import { PressableScale } from '@/components/PressableScale';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const num = (s: string) => { const n = Number(s.replace(',', '.')); return s.trim() && Number.isFinite(n) && n > 0 ? n : null; };

export default function LogWorkout() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useQuery<{ workout: Workout }>(`/workouts/${id}`);
  return (
    <Screen keyboard contentStyle={styles.content}>
      {data ? <LogForm w={data.workout} /> : <Loading />}
    </Screen>
  );
}

// El formulario se monta ya con el plan (o el registro previo) como valores iniciales: así el slider nace en su sitio.
function LogForm({ w }: { w: Workout }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const id = w.id;
  const r = w.result;
  const [mode, setMode] = useState<'done' | 'skipped'>(w.status === 'skipped' ? 'skipped' : 'done');
  const [rpe, setRpe] = useState<number | null>(r?.rpe ?? null);
  const [feeling, setFeeling] = useState<number | null>(r?.feeling ?? null);
  const [duration, setDuration] = useState(String(r?.durationMin ?? w.durationMin ?? ''));
  const [distance, setDistance] = useState(String(r?.distanceKm ?? w.distanceKm ?? ''));
  const [note, setNote] = useState(r?.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: watch } = useQuery<{ activities: WearableActivity[] }>(w.status === 'planned' ? `/wearables/activities?date=${w.date}` : null);
  const fromWatch = (watch?.activities ?? []).filter((a) => !a.sport || a.sport === w.sport);
  const applyActivity = (a: WearableActivity) => {
    haptic.select();
    setDuration(String(Math.round(a.durationMin)));
    setDistance(a.distanceKm ? String(a.distanceKm) : '');
  };

  const valid = mode === 'skipped' || (rpe !== null && feeling !== null);

  const save = async (body: object) => {
    setSaving(true);
    setError('');
    try {
      await api(`/workouts/${id}/result`, { method: 'PUT', body });
      haptic.success();
      invalidateAll();
      router.back();
    } catch (e) { haptic.error(); setError((e as Error).message); setSaving(false); }
  };

  const submit = () => save(mode === 'done'
    ? { status: 'done', rpe, feeling, durationMin: num(duration), distanceKm: num(distance), note }
    : { status: 'skipped', note });

  return (
    <>
          <View style={{ gap: 4 }}>
            <Text variant="title1">Registrar entreno</Text>
            <Text variant="subhead" color={sports[w.sport].color}>{w.title}</Text>
          </View>

          <Segmented value={mode} onChange={setMode} options={[{ key: 'done', label: 'Lo hice' }, { key: 'skipped', label: 'No pude' }]} />

          {mode === 'done' ? (
            <Animated.View key="done" entering={FadeIn.duration(180)} style={styles.form}>
              <View style={{ gap: 12 }}>
                <View style={styles.readout}>
                  <Text style={[styles.big, { color: rpe ? rpeColor(rpe) : colors.textTertiary }]}>{rpe ?? '–'}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="caption" color={colors.textSecondary}>Esfuerzo percibido</Text>
                    <Text variant="headline">{rpe ? rpeLabel(rpe) : 'Desliza para elegir'}</Text>
                  </View>
                </View>
                <EffortSlider value={rpe} onChange={setRpe} />
              </View>

              <View style={{ gap: 12 }}>
                <Text variant="caption" color={colors.textSecondary}>¿Cómo te sentiste?</Text>
                <FeelingPicker value={feeling} onChange={setFeeling} />
              </View>

              {fromWatch.length ? (
                <View style={{ gap: 8 }}>
                  <Text variant="caption" color={colors.textSecondary}>Detectado por tu reloj</Text>
                  {fromWatch.map((a) => (
                    <PressableScale key={a.id} onPress={() => applyActivity(a)} accessibilityLabel={`Usar datos de ${a.providerName}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.surface2 }}>
                      <MaterialCommunityIcons name="watch-variant" size={20} color={colors.textSecondary} />
                      <Text variant="subhead" style={{ flex: 1 }}>{Math.round(a.durationMin)} min{a.distanceKm ? ` · ${String(a.distanceKm).replace('.', ',')} km` : ''}{a.avgHr ? ` · ${a.avgHr} lpm` : ''}</Text>
                      <Text variant="caption" color={colors.textSecondary}>Usar</Text>
                    </PressableScale>
                  ))}
                </View>
              ) : null}

              <View style={styles.pair}>
                <View style={{ flex: 1 }}><Field label="Duración (min)" value={duration} onChangeText={setDuration} keyboardType="number-pad" /></View>
                <View style={{ flex: 1 }}><Field label="Distancia (km)" value={distance} onChangeText={setDistance} keyboardType="decimal-pad" /></View>
              </View>
              <Field label="Notas" value={note} onChangeText={setNote} multiline maxLength={1000} placeholder="Piernas, ritmo, molestias…" />
            </Animated.View>
          ) : (
            <Animated.View key="skipped" entering={FadeIn.duration(180)} style={styles.form}>
              <Field label="¿Qué pasó?" value={note} onChangeText={setNote} multiline maxLength={1000} placeholder="Cuéntaselo a tu entrenador" />
            </Animated.View>
          )}

          {error ? <Text variant="subhead" color={accent.pink}>{error}</Text> : null}
          <View style={{ gap: 8 }}>
            <Button title="Guardar" onPress={submit} loading={saving} disabled={!valid} />
            {w.status !== 'planned' ? <Button title="Quitar registro" kind="danger" onPress={() => save({ status: 'planned' })} disabled={saving} /> : null}
          </View>
    </>
  );
}

const useStyles = createStyles((colors) => ({
  content: { paddingTop: 28, gap: 24 },
  form: { gap: 28 },
  readout: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  big: { fontFamily: fonts.monoBold, fontSize: 60, lineHeight: 64, letterSpacing: -2.5, minWidth: 74 },
  pair: { flexDirection: 'row', gap: 12 },
}));
