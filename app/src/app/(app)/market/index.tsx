import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppBackground } from '@/components/AppBackground';
import { Segmented } from '@/components/Segmented';
import { Text } from '@/components/Text';
import { Empty } from '@/components/Empty';
import { Loading } from '@/components/Screen';
import { Glass } from '@/components/pacer/Glass';
import { CoachCard, EventCard, FilterChips, MarketHeader } from '@/components/market/ui';
import { createStyles, fonts, sports, useTheme, type Sport } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@/lib/query';
import type { MarketCoach, MarketEvent } from '@/lib/market';

type Tab = 'coaches' | 'events';
type CoachFilter = 'all' | Sport;
type EventFilter = 'near' | 'weekend' | 'free' | 'trail';

/** Entrenadores y eventos del mercado. Para el atleta: elegir entrenador o apuntarse a una quedada. */
export default function Market() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'events' ? 'events' : 'coaches');
  const [text, setText] = useState('');
  const [sport, setSport] = useState<CoachFilter>('all');
  const [ev, setEv] = useState<EventFilter>('near');
  const { data: cs } = useQuery<{ coaches: MarketCoach[] }>(tab === 'coaches' ? `/market/coaches${sport !== 'all' ? `?sport=${sport}` : ''}` : null);
  const evQuery = ev === 'near' ? '' : ev === 'trail' ? '?sport=trail' : `?filter=${ev}`;
  const { data: es } = useQuery<{ events: MarketEvent[] }>(tab === 'events' ? `/market/events${evQuery}` : null);

  // Filtros de deporte: primero los del atleta, luego los más comunes del mercado.
  const sportChips = useMemo(() => {
    const mine = (user?.sports ?? []).slice(0, 2);
    const extra = (['run', 'trail', 'triathlon', 'strength', 'swim'] as Sport[]).filter((s) => !mine.includes(s));
    return [{ key: 'all' as CoachFilter, label: 'Para ti' }, ...[...mine, ...extra].slice(0, 4).map((s) => ({ key: s as CoachFilter, label: sports[s].label }))];
  }, [user?.sports]);

  const list = (cs?.coaches ?? []).filter((c) => !text || `${c.name} ${c.headline} ${c.tags.join(' ')}`.toLowerCase().includes(text.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppBackground metalHeight="30%" />
      <MarketHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text variant="largeTitle" style={{ marginBottom: 2 }}>Entrenadores</Text>
        <Segmented value={tab} onChange={setTab} options={[{ key: 'coaches', label: 'Entrenadores' }, { key: 'events', label: 'Eventos' }]} />
        {tab === 'coaches' ? (
          <Animated.View entering={FadeIn.duration(200)} style={{ gap: 12 }}>
            <Glass radius={22} style={styles.search}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
              <TextInput value={text} onChangeText={setText} placeholder="Busca por nombre, deporte u objetivo" placeholderTextColor={colors.textTertiary}
                style={styles.input} accessibilityLabel="Buscar entrenadores" returnKeyType="search" />
            </Glass>
            <FilterChips options={sportChips} value={sport} onChange={setSport} />
            {!cs ? <Loading /> : list.length === 0 ? <Empty icon="account-search-outline" title="Sin resultados" body="Prueba con otro deporte u otra palabra." /> : (
              <View style={{ gap: 8 }}>
                {list.map((c) => <CoachCard key={c.id} c={c} onPress={() => router.push(`/market/coach/${c.id}`)} />)}
              </View>
            )}
            <Text variant="footnote" tertiary center style={{ fontSize: 12, marginTop: 4 }}>✓ titulación verificada por PACER LABS · precios por mes</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(200)} style={{ gap: 12 }}>
            <FilterChips options={[{ key: 'near', label: 'Próximos' }, { key: 'weekend', label: 'Este finde' }, { key: 'free', label: 'Gratis' }, { key: 'trail', label: 'Trail' }]} value={ev} onChange={setEv} />
            {!es ? <Loading /> : es.events.length === 0 ? <Empty icon="calendar-blank-outline" title="No hay eventos" body="Cuando un entrenador organice una quedada, aparecerá aquí." /> : (
              <View style={{ gap: 8 }}>
                {es.events.map((e) => <EventCard key={e.id} e={e} onPress={() => router.push(`/market/event/${e.id}`)} />)}
              </View>
            )}
            <Text variant="footnote" tertiary center style={{ fontSize: 12, marginTop: 4 }}>Puedes apuntarte aunque no entrenes con quien lo organiza.</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((c) => ({
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 60, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 14 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, color: c.text, height: 44 },
}));
