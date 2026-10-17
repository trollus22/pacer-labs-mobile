import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { ChoiceRow } from '@/components/ChoiceRow';
import { Field } from '@/components/Field';
import { Loading, Screen } from '@/components/Screen';
import { StepSlider } from '@/components/StepSlider';
import { Text } from '@/components/Text';
import { accent, createStyles, feelings, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { todayISO } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { invalidateAll, useQuery } from '@/lib/query';
import type { Checkin } from '@/lib/types';

const good = (labels: string[]) => labels.map((label, i) => ({ label, color: feelings[i].color }));       // 5 = mejor
const bad = (labels: string[]) => labels.map((label, i) => ({ label, color: feelings[4 - i].color }));   // 5 = peor
const SLEEP_Q = good(['Mala', 'Floja', 'Normal', 'Buena', 'Muy buena']);
const SORENESS = bad(['Ninguna', 'Leves', 'Normales', 'Altas', 'Muy altas']);
const STRESS = bad(['Bajo', 'Suave', 'Medio', 'Alto', 'Muy alto']);
const MOOD = good(['Muy bajo', 'Bajo', 'Normal', 'Alto', 'Muy alto']);

const int = (s: string) => { const n = Number(s.replace(',', '.')); return s.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : null; };

export default function CheckinScreen() {
  const { data } = useQuery<{ date: string; checkin: Checkin | null }>(`/checkins/today?date=${todayISO()}`);
  return (
    <Screen keyboard contentStyle={{ paddingTop: 28, gap: 26 }}>
      {data ? <CheckinForm existing={data.checkin} /> : <Loading />}
    </Screen>
  );
}

// Se monta ya con la respuesta previa (si la hay), para que el slider nazca en su sitio.
function CheckinForm({ existing }: { existing: Checkin | null }) {
  const { colors, ink } = useTheme();
  const styles = useStyles();
  const [sleep, setSleep] = useState<number | null>(existing?.sleepHours ?? 7.5);
  const [quality, setQuality] = useState<number | null>(existing?.sleepQuality ?? null);
  const [soreness, setSoreness] = useState<number | null>(existing?.soreness ?? null);
  const [stress, setStress] = useState<number | null>(existing?.stress ?? null);
  const [mood, setMood] = useState<number | null>(existing?.mood ?? null);
  const [rhr, setRhr] = useState(existing?.restingHr != null ? String(existing.restingHr) : '');
  const [hrv, setHrv] = useState(existing?.hrv != null ? String(existing.hrv) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const valid = sleep != null && quality != null && soreness != null && stress != null && mood != null;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api('/checkins', { method: 'PUT', body: { date: todayISO(), sleepHours: sleep, sleepQuality: quality, soreness, stress, mood, restingHr: int(rhr), hrv: int(hrv) } });
      haptic.success();
      invalidateAll();
      router.back();
    } catch (e) { haptic.error(); setError((e as Error).message); setSaving(false); }
  };

  return (
    <>
      <View style={{ gap: 4 }}>
        <Text variant="title1">Check-in de hoy</Text>
        <Text variant="subhead" secondary>Tu entrenador lo usa para ajustarte la carga. Verá estas respuestas.</Text>
      </View>

      <View style={{ gap: 12 }}>
        <View style={styles.readout}>
          <Text style={[styles.big, { color: ink(accent.violet) }]}>{sleep != null ? String(sleep).replace('.', ',') : '–'}<Text style={styles.unit}> h</Text></Text>
          <Text variant="caption" secondary style={{ flex: 1 }}>Horas que dormiste</Text>
        </View>
        <StepSlider value={sleep} onChange={setSleep} min={3} max={10} step={0.5} stops={[0, 1]} colors={[accent.violet, accent.violet]} label="Horas de sueño" />
      </View>

      <Question title="¿Cómo fue el sueño?"><ChoiceRow choices={SLEEP_Q} value={quality} onChange={setQuality} label="Calidad del sueño" /></Question>
      <Question title="Agujetas o dolor muscular"><ChoiceRow choices={SORENESS} value={soreness} onChange={setSoreness} label="Agujetas" /></Question>
      <Question title="Estrés"><ChoiceRow choices={STRESS} value={stress} onChange={setStress} label="Estrés" /></Question>
      <Question title="Ánimo y energía"><ChoiceRow choices={MOOD} value={mood} onChange={setMood} label="Ánimo y energía" /></Question>

      <View style={{ gap: 12 }}>
        <View style={styles.optional}>
          <MaterialCommunityIcons name="watch-variant" size={18} color={colors.textSecondary} />
          <Text variant="caption" secondary>Opcional · de tu reloj</Text>
        </View>
        <View style={styles.pair}>
          <View style={{ flex: 1 }}><Field label="Pulso en reposo (lpm)" value={rhr} onChangeText={setRhr} keyboardType="number-pad" maxLength={3} /></View>
          <View style={{ flex: 1 }}><Field label="HRV (ms)" value={hrv} onChangeText={setHrv} keyboardType="number-pad" maxLength={3} /></View>
        </View>
      </View>

      {error ? <Text variant="subhead" color={accent.pink}>{error}</Text> : null}
      <Button title={existing ? 'Actualizar check-in' : 'Guardar check-in'} onPress={save} loading={saving} disabled={!valid} />
    </>
  );
}

const Question = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ gap: 12 }}>
    <Text variant="caption" secondary>{title}</Text>
    {children}
  </View>
);

const useStyles = createStyles(() => ({
  readout: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  big: { fontFamily: 'JetBrainsMono_700Bold', fontSize: 52, lineHeight: 58, letterSpacing: -2, minWidth: 110 },
  unit: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 20, letterSpacing: 0 },
  optional: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pair: { flexDirection: 'row', gap: 12 },
}));
