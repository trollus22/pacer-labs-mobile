import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Empty } from '@/components/Empty';
import { Field } from '@/components/Field';
import { PressableScale } from '@/components/PressableScale';
import { RecoRow } from '@/components/RecoRow';
import { Loading, Screen } from '@/components/Screen';
import { SportIcon } from '@/components/SportIcon';
import { SessionBuilder } from '@/components/SessionBuilder';
import { SportPicker } from '@/components/SportPicker';
import { useAuth } from '@/lib/auth';
import { Text } from '@/components/Text';
import { WeekStrip } from '@/components/WeekStrip';
import { ZoneBar } from '@/components/ZoneBar';
import { accent, createStyles, radius, sports, useTheme, zones, type Sport } from '@/theme';
import { alpha } from '@/lib/color';
import { api } from '@/lib/api';
import { addDays, formatLong, formatWeekRange, mondayOf, todayISO, weekDays } from '@/lib/dates';
import { confirm } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { useDebounced } from '@/lib/hooks';
import { invalidateAll, useQuery } from '@/lib/query';
import type { AthleteReco, Exercise, Preset, SessionItem, Template, Workout } from '@/lib/types';

const num = (s: string) => { const n = Number(s.replace(',', '.')); return s.trim() && Number.isFinite(n) && n > 0 ? n : null; };

export default function EditWorkout() {
  const params = useLocalSearchParams<{ id?: string; athleteId?: string; date?: string }>();
  const { data: existing } = useQuery<{ workout: Workout }>(params.id ? `/workouts/${params.id}` : null);
  return (
    <Screen keyboard contentStyle={{ paddingTop: 20, gap: 24 }}>
      {params.id && !existing ? <Loading /> : <WorkoutForm existing={existing?.workout} athleteId={params.athleteId} date={params.date} />}
    </Screen>
  );
}

// El formulario nace con los valores iniciales ya puestos (nuevo, plantilla o entreno existente).
function WorkoutForm({ existing, athleteId, date: dateParam }: { existing?: Workout; athleteId?: string; date?: string }) {
  const { colors, ink } = useTheme();
  const styles = useStyles();
  const { user } = useAuth();
  const editing = !!existing;
  const today = todayISO();

  const [date, setDate] = useState(existing?.date ?? dateParam ?? today);
  const [monday, setMonday] = useState(mondayOf(existing?.date ?? dateParam ?? today));
  const [sport, setSport] = useState<Sport>(existing?.sport ?? 'run');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [zone, setZone] = useState(existing?.zone ?? 2);
  const [duration, setDuration] = useState(existing?.durationMin ? String(existing.durationMin) : '');
  const [distance, setDistance] = useState(existing?.distanceKm ? String(existing.distanceKm) : '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [selected, setSelected] = useState<string[]>(athleteId ? [athleteId] : []);
  const [items, setItems] = useState<SessionItem[]>(existing?.items ?? []);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Recomendación en vivo: se recalcula al cambiar la intensidad o (con una pausa) la duración.
  const debouncedMin = useDebounced(num(duration), 350);
  const recoPath = editing ? null : `/readiness?date=${today}&zone=${zone}${debouncedMin ? `&durationMin=${Math.round(debouncedMin)}` : ''}`;
  const { kept: reco, stale } = useQuery<{ asOf: string; athletes: AthleteReco[] }>(recoPath);
  const { data: tplData, refresh: refreshTemplates } = useQuery<{ templates: Template[] }>(editing ? null : '/templates');
  const athletes = reco?.athletes ?? [];
  const { data: lib } = useQuery<{ exercises: Exercise[]; presets: Preset[] }>('/exercises');
  const presets = (lib?.presets ?? []).filter((p) => p.sport === sport);
  const applyPreset = (p: Preset) => {
    haptic.select();
    setSport(p.sport); setTitle(p.title); setZone(p.zone); setDuration(String(p.durationMin)); setDistance(p.distanceKm ? String(p.distanceKm) : '');
    setDescription(p.note); setItems(p.items);
  };

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const applyTemplate = (t: Template) => {
    haptic.select();
    setSport(t.sport); setTitle(t.title); setZone(t.zone); setDescription(t.description); setItems(t.items ?? []);
    setDuration(t.durationMin ? String(t.durationMin) : ''); setDistance(t.distanceKm ? String(t.distanceKm) : '');
  };
  const removeTemplate = async (t: Template) => {
    if (!(await confirm('¿Borrar la plantilla?', `«${t.title}» dejará de aparecer aquí. Los entrenos ya enviados no se tocan.`, 'Borrar'))) return;
    await api(`/templates/${t.id}`, { method: 'DELETE' });
    haptic.medium();
    void refreshTemplates();
  };

  const body = { date, sport, title, zone, description, items, durationMin: num(duration), distanceKm: num(distance) };

  const send = async () => {
    const chosen = athletes.filter((a) => selected.includes(a.id));
    const risky = chosen.filter((a) => a.level === 'avoid');
    if (risky.length) {
      const names = risky.map((a) => a.name.split(' ')[0]).join(', ');
      const ok = await confirm(
        risky.length === 1 ? 'Un atleta no está para este entreno' : 'Algunos atletas no están para este entreno',
        `${names}: la recuperación o la carga recomiendan evitar una sesión así. ¿Enviar igualmente?`,
        'Enviar igualmente', false,
      );
      if (!ok) return;
    }
    setSaving(true);
    setError('');
    try {
      await api('/workouts/bulk', { method: 'POST', body: { ...body, athleteIds: selected, saveTemplate } });
      haptic.success();
      invalidateAll();
      router.back();
    } catch (e) { haptic.error(); setError((e as Error).message); setSaving(false); }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api(`/workouts/${existing!.id}`, { method: 'PATCH', body });
      haptic.success();
      invalidateAll();
      router.back();
    } catch (e) { haptic.error(); setError((e as Error).message); setSaving(false); }
  };

  const remove = async () => {
    if (!(await confirm('¿Eliminar este entreno?', 'Se borrarán también el registro del atleta y los comentarios.', 'Eliminar'))) return;
    setSaving(true);
    try { await api(`/workouts/${existing!.id}`, { method: 'DELETE' }); haptic.medium(); invalidateAll(); router.dismiss(2); }
    catch (e) { haptic.error(); setError((e as Error).message); setSaving(false); }
  };

  const week = weekDays(monday);
  const n = selected.length;
  const team = athletes.filter((a) => !a.self);
  const goodIds = team.filter((a) => a.level === 'good').map((a) => a.id);
  const valid = title.trim().length > 0 && (editing || n > 0);

  return (
    <>
      <Stack.Screen
        options={{
          title: editing ? 'Editar entreno' : 'Nuevo entreno',
          headerLeft: () => (
            <PressableScale scale={0.94} onPress={() => router.back()} accessibilityLabel="Cancelar"><Text variant="headline" secondary>Cancelar</Text></PressableScale>
          ),
        }}
      />

      {!editing && (tplData?.templates.length ?? 0) > 0 && (
        <View style={{ gap: 10 }}>
          <Text variant="caption" secondary>Empezar desde una plantilla</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
            {tplData!.templates.map((t) => (
              <PressableScale key={t.id} scale={0.95} onPress={() => applyTemplate(t)} onLongPress={() => removeTemplate(t)} accessibilityLabel={`Plantilla ${t.title}. Mantén pulsado para borrar`} style={styles.tpl}>
                <SportIcon sport={t.sport} size={30} />
                <View style={{ gap: 3 }}>
                  <Text variant="subhead" numberOfLines={1} style={{ maxWidth: 150, fontFamily: 'PlusJakartaSans_700Bold' }}>{t.title}</Text>
                  <ZoneBar zone={t.zone} width={4} height={10} />
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Text variant="caption" secondary>Deporte</Text>
        <SportPicker value={sport} onChange={setSport} favorites={user?.sports} />
      </View>

      {presets.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text variant="caption" secondary>Sesiones prediseñadas · {sports[sport].label}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
            {presets.map((p) => (
              <PressableScale key={p.id} scale={0.95} onPress={() => applyPreset(p)} accessibilityLabel={`Sesión prediseñada: ${p.title}`} style={styles.tpl}>
                <SportIcon sport={p.sport} size={30} />
                <View style={{ gap: 3 }}>
                  <Text variant="subhead" numberOfLines={1} style={{ maxWidth: 170, fontFamily: 'PlusJakartaSans_700Bold' }}>{p.title}</Text>
                  <ZoneBar zone={p.zone} width={4} height={10} />
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Field label="Título" value={title} onChangeText={setTitle} maxLength={80} placeholder="Series 6×800 m" returnKeyType="next" />

      <View style={{ gap: 10 }}>
        <View style={styles.zoneHead}>
          <Text variant="caption" secondary>Intensidad</Text>
          <Text variant="subhead" color={zones[zone - 1].color} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{zone} · {zones[zone - 1].label}</Text>
        </View>
        <View style={styles.zones}>
          {zones.map((z, i) => (
            <PressableScale key={z.label} scale={0.92} style={{ flex: 1 }} onPress={() => { haptic.select(); setZone(i + 1); }} accessibilityLabel={`Intensidad ${i + 1}, ${z.label}`} accessibilityState={{ selected: zone === i + 1 }}>
              <Animated.View style={[styles.zone, { backgroundColor: i < zone ? zones[zone - 1].color : colors.surface3 }, { transitionProperty: 'backgroundColor', transitionDuration: '160ms' }]} />
            </PressableScale>
          ))}
        </View>
      </View>

      <View style={styles.pair}>
        <View style={{ flex: 1 }}><Field label="Duración (min)" value={duration} onChangeText={setDuration} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Field label="Distancia (km)" value={distance} onChangeText={setDistance} keyboardType="decimal-pad" /></View>
      </View>
      {lib ? <SessionBuilder items={items} onChange={setItems} exercises={lib.exercises} sport={sport} /> : null}
      <Field label="Notas para el atleta (opcional)" value={description} onChangeText={setDescription} multiline maxLength={2000} placeholder="Indicaciones extra: ritmos, sensaciones, material…" />

      <View style={{ gap: 10 }}>
        <View style={styles.dateHead}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" secondary>Fecha</Text>
            <Text variant="headline">{formatLong(date)}</Text>
          </View>
          <Text variant="footnote" mono secondary>{formatWeekRange(monday)}</Text>
          <PressableScale scale={0.9} onPress={() => { haptic.select(); setMonday(addDays(monday, -7)); }} style={styles.circle} accessibilityLabel="Semana anterior"><MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} /></PressableScale>
          <PressableScale scale={0.9} onPress={() => { haptic.select(); setMonday(addDays(monday, 7)); }} style={styles.circle} accessibilityLabel="Semana siguiente"><MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} /></PressableScale>
        </View>
        <WeekStrip days={week} selected={week.includes(date) ? date : null} onSelect={setDate} marks={{}} />
      </View>

      {!editing && (
        <View style={{ gap: 12, opacity: stale ? 0.55 : 1 }}>
          <View style={styles.sendHead}>
            <View style={{ flex: 1 }}>
              <Text variant="title3">Enviar a</Text>
              <Text variant="footnote" secondary>{n} de {athletes.length} seleccionados · según su recuperación y carga de hoy</Text>
            </View>
          </View>
          {athletes.length > 0 && (
            <View style={styles.quick}>
              <PressableScale scale={0.95} onPress={() => { haptic.select(); setSelected(goodIds); }} style={[styles.pill, { backgroundColor: alpha(accent.green, 0.16) }]} accessibilityLabel="Seleccionar los recomendados">
                <MaterialCommunityIcons name="check-circle" size={15} color={ink(accent.green)} />
                <Text variant="subhead" color={accent.green} style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Recomendados ({goodIds.length})</Text>
              </PressableScale>
              <PressableScale scale={0.95} onPress={() => { haptic.select(); setSelected(team.map((a) => a.id)); }} style={styles.pill}><Text variant="subhead" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Todos</Text></PressableScale>
              <PressableScale scale={0.95} onPress={() => { haptic.select(); setSelected([]); }} style={styles.pill}><Text variant="subhead" secondary style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Ninguno</Text></PressableScale>
            </View>
          )}
          {!reco ? <Loading /> : (
            <>
              {athletes.map((a) => <RecoRow key={a.id} reco={a.self ? { ...a, name: `${a.name} (tú)` } : a} selected={selected.includes(a.id)} onToggle={() => toggle(a.id)} sportNote={a.sports?.length && !a.sports.includes(sport) ? `${a.self ? 'No lo tienes' : 'No tiene'} ${sports[sport].label} entre ${a.self ? 'tus' : 'sus'} deportes` : undefined} />)}
              {team.length === 0 ? <Empty icon="account-plus-outline" title="Aún no hay atletas" body="Comparte tu código de invitación desde la pestaña Equipo." /> : null}
            </>
          )}
          {date > addDays(today, 2) ? <Text variant="footnote" tertiary>La valoración usa su estado de hoy; puede cambiar hasta el día del entreno.</Text> : null}
          <Text variant="footnote" tertiary>Es una ayuda para decidir: tú eliges siempre a quién se lo envías.</Text>
        </View>
      )}

      {!editing && (
        <View style={styles.tplSwitch}>
          <View style={{ flex: 1 }}>
            <Text variant="headline">Guardar como plantilla</Text>
            <Text variant="footnote" secondary>Para reutilizarlo con un toque la próxima vez.</Text>
          </View>
          <Switch value={saveTemplate} onValueChange={(v) => { haptic.select(); setSaveTemplate(v); }} trackColor={{ true: accent.coral, false: colors.surface3 }} />
        </View>
      )}

      {error ? <Text variant="subhead" color={accent.pink}>{error}</Text> : null}
      <View style={{ gap: 8 }}>
        {editing
          ? <Button title="Guardar cambios" onPress={save} loading={saving} disabled={!valid} />
          : <Button title={n ? `Enviar a ${n} atleta${n > 1 ? 's' : ''}` : 'Elige al menos un atleta'} onPress={send} loading={saving} disabled={!valid} />}
        {editing ? <Button title="Eliminar entreno" kind="danger" onPress={remove} disabled={saving} /> : null}
      </View>
    </>
  );
}

const useStyles = createStyles((colors) => ({
  tpl: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 8, paddingRight: 14, height: 54, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface2 },
  zoneHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  zones: { flexDirection: 'row', gap: 6 },
  zone: { height: 44, borderRadius: 12, borderCurve: 'continuous' },
  pair: { flexDirection: 'row', gap: 12 },
  dateHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  sendHead: { flexDirection: 'row', alignItems: 'center' },
  quick: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface2 },
  tplSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: colors.surface2, borderRadius: radius.md, borderCurve: 'continuous' },
}));
