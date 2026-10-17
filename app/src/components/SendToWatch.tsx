import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { Text } from './Text';
import { accent, useTheme } from '@/theme';
import { api } from '@/lib/api';
import { formatLong, timeAgo } from '@/lib/dates';
import { confirm } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { invalidateAll, useQuery } from '@/lib/query';
import type { WatchInfo, WatchResult } from '@/lib/types';

/**
 * «Mandar al reloj»: lleva el entreno, con sus ejercicios como pasos reales, al reloj que el atleta tiene conectado
 * (Garmin y COROS lo colocan en su calendario ese día; Zepp lo deja en su biblioteca). `onGlass`: variante clara para la tarjeta del día.
 */
export function SendToWatch({ workoutId, onGlass }: { workoutId: string; onGlass?: boolean }) {
  const { colors } = useTheme();
  const { data } = useQuery<WatchInfo>(`/wearables/workouts/${workoutId}`);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<WatchResult | null>(null);
  const [error, setError] = useState('');
  if (!data || !data.configured) return null;
  const fg = onGlass ? '#FFFFFF' : colors.text, fg2 = onGlass ? 'rgba(255,255,255,0.75)' : colors.textSecondary;

  if (!data.supported) return onGlass ? null : <View style={{ flexDirection: 'row', gap: 8 }}><MaterialCommunityIcons name="watch-variant" size={18} color={fg2} /><Text variant="footnote" color={fg2} style={{ flex: 1 }}>{data.reason}</Text></View>;

  const send = async (id: string) => {
    setBusy(id); setError(''); setResult(null);
    try {
      const r = await api<WatchResult>(`/wearables/workouts/${workoutId}/send`, { method: 'POST', body: { provider: id } });
      haptic.success(); setResult(r); invalidateAll();
    } catch (e) { haptic.error(); setError((e as Error).message); }
    setBusy(null);
  };
  const remove = async (id: string, name: string) => {
    if (!(await confirm(`¿Quitarlo de tu ${name}?`, 'Se borra el entreno del reloj y de su calendario. Sigue en PACER LABS.', 'Quitar'))) return;
    setBusy(id); setError(''); setResult(null);
    try { await api(`/wearables/workouts/${workoutId}/send/${id}`, { method: 'DELETE' }); haptic.medium(); invalidateAll(); } catch (e) { setError((e as Error).message); }
    setBusy(null);
  };

  if (data.providers.length === 0) {
    return <Button title="Conecta un reloj para mandarlo" kind="ghost" onPress={() => router.push('/devices')} />;
  }
  return (
    <View style={{ gap: 10 }}>
      {data.providers.map((p) => (
        <View key={p.id} style={{ gap: 8 }}>
          {p.state === 'reconnect'
            ? <Button title={`Vuelve a conectar ${p.name}`} kind="ghost" onPress={() => router.push({ pathname: '/connect/[provider]', params: { provider: p.id } })} />
            : <Button title={p.sentAt ? `Volver a mandar a ${p.name}` : `Mandar a ${p.name}`} kind={p.sentAt ? 'ghost' : 'primary'} loading={busy === p.id} onPress={() => send(p.id)} />}
          {p.sentAt ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="check-circle" size={16} color={onGlass ? '#7CF0A0' : accent.green} />
              <Text variant="footnote" color={fg2} style={{ flex: 1 }}>Enviado a {p.name} {timeAgo(p.sentAt)}</Text>
              <Text variant="footnote" color={fg} onPress={() => remove(p.id, p.name)} accessibilityRole="button" accessibilityLabel={`Quitar de ${p.name}`}>Quitar</Text>
            </View>
          ) : null}
        </View>
      ))}
      {result ? (
        <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
          <Text variant="subhead" color={fg}>{result.mode === 'strength' ? `${result.sent} ejercicios de fuerza` : 'Entreno por pasos'} enviado a {result.providerName}{result.scheduled ? ` para el ${formatLong(result.date)}` : ''}.</Text>
          {result.skipped.map((s) => <Text key={s.name} variant="footnote" color={fg2}>• No se envió «{s.name}»: {s.reason}.</Text>)}
          {result.notes.map((n) => <Text key={n} variant="footnote" color={fg2}>• {n}</Text>)}
          <Text variant="footnote" color={fg2}>Sincroniza tu reloj con su app y lo verás en la lista de entrenos.</Text>
        </View>
      ) : null}
      {error ? <Text variant="subhead" color={onGlass ? '#FFB4C0' : accent.pink}>{error}</Text> : null}
    </View>
  );
}
