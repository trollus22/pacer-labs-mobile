import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SportPicker } from '@/components/SportPicker';
import { Text } from '@/components/Text';
import type { Sport } from '@/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { haptic } from '@/lib/haptics';
import { invalidateAll } from '@/lib/query';

// «Mis deportes»: los que practicas. Salen primero al elegir deporte y, si eres atleta, tu entrenador los ve al enviarte un entreno.
export default function MySports() {
  const { user, refreshMe } = useAuth();
  const [sel, setSel] = useState<Sport[]>(user?.sports ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toggle = (s: Sport) => setSel((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const save = async () => {
    setSaving(true); setError('');
    try {
      await api('/me/sports', { method: 'PUT', body: { sports: sel } });
      await refreshMe(); invalidateAll(); haptic.success(); router.back();
    } catch (e) { haptic.error(); setError((e as Error).message); setSaving(false); }
  };
  return (
    <Screen contentStyle={{ paddingTop: 28, gap: 22 }}>
      <View style={{ gap: 4 }}>
        <Text variant="title1">Mis deportes</Text>
        <Text variant="subhead" secondary>{user?.role === 'coach' ? 'Marca los que entrenas o planificas. Saldrán primero al crear un entreno.' : 'Marca los que practicas. Tu entrenador los verá al planificarte entrenos.'}</Text>
      </View>
      <SportPicker value={sel} onChange={toggle} />
      {error ? <Text variant="subhead" color="#FF375F">{error}</Text> : null}
      <Button title={sel.length ? `Guardar (${sel.length})` : 'Guardar sin deportes'} onPress={save} loading={saving} />
    </Screen>
  );
}
