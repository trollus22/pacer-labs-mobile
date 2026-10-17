import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { createStyles, fonts, radius, sports, useTheme, type Sport } from '@/theme';
import { haptic } from '@/lib/haptics';
import { QTY_LABEL, fromExercise, summary } from '@/lib/session';
import type { Exercise, SessionItem } from '@/lib/types';

const toNum = (s: string) => { const n = parseInt(s.replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : null; };

function Mini({ label, value, onChange }: { label: string; value: number | null; onChange: (n: number | null) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text variant="caption" secondary style={{ fontSize: 9.5 }}>{label}</Text>
      <TextInput accessibilityLabel={label} keyboardType="number-pad" value={value == null ? '' : String(value)} onChangeText={(t) => onChange(toNum(t))} maxLength={6}
        placeholderTextColor={colors.textTertiary} placeholder="—" selectionColor={colors.text} style={styles.mini} />
    </View>
  );
}

/** Sesión construida con ejercicios de la biblioteca: el entrenador elige y ajusta, la API lo convierte en texto. */
export function SessionBuilder({ items, onChange, exercises, sport }: { items: SessionItem[]; onChange: (i: SessionItem[]) => void; exercises: Exercise[]; sport: Sport }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string | null>(null);

  const forSport = useMemo(() => exercises.filter((e) => e.sports.includes(sport)), [exercises, sport]);
  const pool = forSport.length >= 4 ? forSport : exercises;
  const groups = useMemo(() => [...new Set(pool.map((e) => e.group))], [pool]);
  const list = pool.filter((e) => (!group || e.group === group) && (!q.trim() || e.name.toLowerCase().includes(q.trim().toLowerCase())));
  const set = (i: number, patch: Partial<SessionItem>) => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= items.length) return; const c = [...items]; [c[i], c[j]] = [c[j], c[i]]; haptic.select(); onChange(c); };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.head}>
        <Text variant="caption" secondary>Ejercicios de la sesión{items.length ? ` · ${items.length}` : ''}</Text>
        {items.length ? <PressableScale onPress={() => { haptic.light(); onChange([]); }} accessibilityLabel="Quitar todos los ejercicios"><Text variant="footnote" secondary>Vaciar</Text></PressableScale> : null}
      </View>

      {items.length === 0 ? <Text variant="footnote" secondary>Elige ejercicios de la biblioteca o empieza desde una sesión prediseñada. No hace falta escribir nada.</Text> : items.map((it, i) => (
        <View key={`${it.name}-${i}`} style={styles.card}>
          <View style={styles.row}>
            <Text variant="headline" numberOfLines={2} style={{ flex: 1 }}>{it.name}</Text>
            <PressableScale scale={0.9} onPress={() => move(i, -1)} accessibilityLabel="Subir"><MaterialCommunityIcons name="chevron-up" size={22} color={colors.textSecondary} /></PressableScale>
            <PressableScale scale={0.9} onPress={() => move(i, 1)} accessibilityLabel="Bajar"><MaterialCommunityIcons name="chevron-down" size={22} color={colors.textSecondary} /></PressableScale>
            <PressableScale scale={0.9} onPress={() => { haptic.light(); onChange(items.filter((_, k) => k !== i)); }} accessibilityLabel={`Quitar ${it.name}`}><MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} /></PressableScale>
          </View>
          <View style={styles.row}>
            <Mini label="Series" value={it.sets} onChange={(n) => set(i, { sets: n })} />
            <Mini label={QTY_LABEL[it.kind]} value={it.qty} onChange={(n) => set(i, { qty: n })} />
            <Mini label="Descanso (s)" value={it.rest} onChange={(n) => set(i, { rest: n })} />
            {it.kind === 'reps' ? <Mini label="Peso (kg)" value={it.weightKg ?? null} onChange={(n) => set(i, { weightKg: n })} /> : null}
          </View>
          {it.note ? <Text variant="footnote" secondary>{it.note}</Text> : null}
        </View>
      ))}

      <Button title={open ? 'Cerrar la biblioteca' : 'Añadir ejercicio'} kind="ghost" small onPress={() => { haptic.select(); setOpen(!open); }} />

      {open ? (
        <View style={styles.lib}>
          <TextInput accessibilityLabel="Buscar ejercicio" value={q} onChangeText={setQ} placeholder="Buscar ejercicio…" placeholderTextColor={colors.textTertiary} style={styles.search} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[null, ...groups].map((g) => {
              const on = g === group;
              return (
                <PressableScale key={g ?? 'all'} scale={0.94} onPress={() => { haptic.select(); setGroup(g); }} accessibilityState={{ selected: on }}>
                  <View style={[styles.chip, on && { backgroundColor: colors.text }]}><Text variant="footnote" color={on ? colors.bg : colors.text}>{g ?? 'Todos'}</Text></View>
                </PressableScale>
              );
            })}
          </ScrollView>
          <Text variant="footnote" secondary>{forSport.length >= 4 ? `Para ${sports[sport].label}` : 'Toda la biblioteca'} · {list.length} ejercicios</Text>
          {list.slice(0, 40).map((e) => (
            <PressableScale key={e.id} onPress={() => { haptic.light(); onChange([...items, fromExercise(e)]); }} accessibilityLabel={`Añadir ${e.name}`} style={styles.pick}>
              <View style={{ flex: 1 }}>
                <Text variant="subhead" numberOfLines={1}>{e.name}</Text>
                <Text variant="footnote" secondary>{e.group} · {summary(e)}</Text>
              </View>
              <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.text} />
            </PressableScale>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { backgroundColor: colors.surface2, borderRadius: radius.md, borderCurve: 'continuous', padding: 14, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mini: { height: 40, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surface3, color: colors.text, fontFamily: fonts.monoBold, fontSize: 16, paddingHorizontal: 12 },
  lib: { gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: 'continuous', padding: 12, borderWidth: 1, borderColor: colors.separator },
  search: { height: 44, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.surface2, color: colors.text, fontFamily: fonts.medium, fontSize: 16, paddingHorizontal: 14 },
  chip: { paddingHorizontal: 14, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface3 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
}));
