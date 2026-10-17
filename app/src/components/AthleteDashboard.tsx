import { useState } from 'react';
import { Text as RNText, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { DotMatrix, DotScale, TickBars, WaveLine } from './micro';
import { ArcGauge } from './ArcGauge';
import { CheckinCard } from './CheckinCard';
import { ErrorState, Loading, Screen } from './Screen';
import { MetricDetail } from './MetricDetail';
import { Segmented } from './Segmented';
import { StatusBadge } from './StatusBadge';
import { Text } from './Text';
import { Tile, TileGrid } from './Tile';
import { compact } from './charts/shapes';
import { fonts, zones } from '@/theme';
import { useWide } from '@/lib/layout';
import { todayISO } from '@/lib/dates';
import { CSS_EASE_OUT } from '@/lib/motion';
import { useQuery } from '@/lib/query';
import { CONFIDENCE, STATUS } from '@/lib/status';
import type { Dashboard } from '@/lib/types';

type Days = '7' | '28' | '90';
const dec = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const pace = (v: number) => `${Math.floor(v)}:${String(Math.round((v % 1) * 60) % 60).padStart(2, '0')}`;
const lastOf = (xs: (number | null)[]) => { for (let i = xs.length - 1; i >= 0; i--) if (xs[i] != null) return xs[i] as number; return null; };

/** Forma: mosaico con la recuperación como tarjeta héroe y una tarjeta por métrica. `path` = /me/dashboard o /athletes/:id/dashboard. */
export function AthleteDashboard({ path, mine, webTitle, header }: { path: string; mine?: boolean; webTitle?: string; header?: React.ReactNode }) {
  const [days, setDays] = useState<Days>('28');
  const { kept: d, stale, error, refreshing, refresh } = useQuery<Dashboard>(`${path}?date=${todayISO()}&days=${days}`);
  return (
    <Screen refreshing={refreshing} onRefresh={refresh} webTitle={webTitle}>
      {header}
      {mine ? <CheckinCard /> : null}
      <View style={{ maxWidth: 440, width: '100%' }}><Segmented value={days} onChange={setDays} options={[{ key: '7', label: '7 días' }, { key: '28', label: '4 semanas' }, { key: '90', label: '12 semanas' }]} /></View>
      {error && !d ? <ErrorState message={error.message} onRetry={refresh} /> : !d ? <Loading /> : (
        <Animated.View style={{ opacity: stale ? 0.45 : 1, transitionProperty: 'opacity', transitionDuration: '220ms', transitionTimingFunction: CSS_EASE_OUT }}>
          <Overview d={d} days={Number(days)} path={path} mine={!!mine} />
          <FullCharts d={d} days={Number(days)} />
        </Animated.View>
      )}
    </Screen>
  );
}

function Overview({ d, days, path, mine }: { d: Dashboard; days: number; path: string; mine: boolean }) {
  const open = (key: string) => router.push({ pathname: '/metric/[key]', params: { key, path, days: String(days) } });
  const daily = d.daily, cur = d.current, st = STATUS[cur.status];
  const col = (k: keyof Dashboard['daily'][number]) => daily.map((p) => p[k] as number | null);
  const tail = (k: keyof Dashboard['daily'][number], n = 7) => col(k).slice(-n).map((v) => v ?? 0);
  const ratio = cur.stats.ratio;
  const ratioLabel = ratio == null ? 'Sin historia' : ratio < 0.8 ? 'Baja' : ratio < 1.3 ? 'Óptima' : ratio < 1.5 ? 'Alta' : 'Muy alta';
  const sleep = lastOf(col('sleepHours')), hrv = lastOf(col('hrv')), rhr = lastOf(col('restingHr'));
  const soreness = lastOf(col('soreness')), stress = lastOf(col('stress')), mood = lastOf(col('mood'));
  const paces = d.runPace.map((p) => p.pace);
  const last16 = daily.slice(-16).map((p) => p.load > 0);
  const wk = d.weekly, lastWk = wk[wk.length - 1];
  const minutes = d.zoneMinutes, totalMin = minutes.reduce((a, b) => a + b, 0);
  const dominant = totalMin ? minutes.indexOf(Math.max(...minutes)) : 0;
  const hard = totalMin ? Math.round(((minutes[3] + minutes[4]) / totalMin) * 100) : null;
  const hasHealth = daily.some((p) => p.sleepHours != null);

  return (
    <TileGrid>
      <Tile
        span={2} variant="glass" icon="heart-pulse" title="Recuperación" rows={2} showValue={false} onPress={() => open('recovery')}
        accessibilityLabel={`Recuperación ${cur.score ?? 'sin datos'} de 100. ${st.long}`}
        body={(
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <ArcGauge value={cur.score} color={st.color} ink="#FFFFFF" dim="rgba(255,255,255,0.34)" size={250}>
              <RNText style={{ fontFamily: fonts.light, fontSize: 76, lineHeight: 80, letterSpacing: -3, color: '#fff' }}>{cur.score ?? '—'}</RNText>
              <Text variant="caption" color="rgba(255,255,255,0.6)" style={{ fontSize: 9.5 }}>de 100</Text>
            </ArcGauge>
          </View>
        )}
        note={(
          <View style={{ gap: 8, paddingTop: 4 }}>
            <StatusBadge label={st.long} icon={st.icon} color={st.color} onGlass />
            <Text variant="footnote" color="rgba(255,255,255,0.78)" numberOfLines={2}>{cur.drivers[0]?.text ?? CONFIDENCE[cur.confidence]}</Text>
          </View>
        )}
      />

      <Tile variant="warm" icon="chart-bell-curve-cumulative" title="Ratio de carga" value={ratio == null ? '—' : `×${dec(ratio, 2)}`} note={ratioLabel}
        micro={<DotScale value={ratio == null ? 0 : (Math.min(2, Math.max(0.4, ratio)) - 0.4) / 1.6} />} onPress={() => open('load')} />
      <Tile icon="weight-lifter" title="Carga 7 días" value={compact(cur.stats.weekLoad)} unit="u." micro={<TickBars values={tail('load', 7)} />} onPress={() => open('streak')} />

      <Tile icon="calendar-check-outline" title="Días activos" value={String(last16.filter(Boolean).length)} unit="de 16" micro={<DotMatrix filled={last16} />} onPress={() => open('streak')} />
      <Tile icon="target" title="Cumplimiento" value={lastWk && lastWk.planned ? String(Math.round((lastWk.done / lastWk.planned) * 100)) : '—'} unit="%"
        micro={<TickBars values={wk.map((w) => (w.planned ? (w.done / w.planned) * 100 : 0))} />} onPress={() => open('completion')} />

      <Tile icon="timer-outline" title="Horas semanales" value={lastWk ? dec(lastWk.minutes / 60) : '—'} unit="h" micro={<TickBars values={wk.map((w) => w.minutes)} />} onPress={() => open('hours')} />
      <Tile icon="map-marker-distance" title="Km semanales" value={lastWk ? dec(lastWk.km) : '—'} unit="km" micro={<TickBars values={wk.map((w) => w.km)} />} onPress={() => open('km')} />

      <Tile icon="speedometer" title="Intensidad" value={totalMin ? `Z${dominant + 1}` : '—'} note={hard != null ? `${hard} % zonas 4–5` : undefined}
        micro={<DotScale value={dominant / 4} />} onPress={() => open('zones')} accessibilityLabel={totalMin ? `Zona dominante ${dominant + 1}, ${zones[dominant].label}` : 'Intensidad sin datos'} />
      {paces.length > 1 ? <Tile icon="run-fast" title="Ritmo de carrera" value={pace(paces[paces.length - 1])} unit="min/km" micro={<WaveLine values={paces} />} onPress={() => open('pace')} /> : null}

      {hasHealth ? (
        <>
          <Tile icon="sleep" title="Sueño" value={sleep != null ? dec(sleep) : '—'} unit="h" micro={<TickBars values={tail('sleepHours', 7)} />} onPress={() => open('sleep')} />
          <Tile icon="heart-outline" title="Pulso reposo" value={rhr != null ? String(rhr) : '—'} unit="lpm" micro={<WaveLine values={col('restingHr')} />} onPress={() => open('rhr')} />
          <Tile icon="pulse" title="HRV" value={hrv != null ? String(hrv) : '—'} unit="ms" micro={<WaveLine values={col('hrv')} />} onPress={() => open('hrv')} />
          <Tile icon="human-handsdown" title="Agujetas" value={soreness != null ? String(soreness) : '—'} unit="/ 5" micro={<DotScale value={soreness != null ? (soreness - 1) / 4 : 0} />} onPress={() => open('soreness')} />
          <Tile icon="head-snowflake-outline" title="Estrés" value={stress != null ? String(stress) : '—'} unit="/ 5" micro={<DotScale value={stress != null ? (stress - 1) / 4 : 0} />} onPress={() => open('stress')} />
          <Tile icon="emoticon-happy-outline" title="Ánimo" value={mood != null ? String(mood) : '—'} unit="/ 5" micro={<DotScale value={mood != null ? (mood - 1) / 4 : 0} />} onPress={() => open('mood')} />
        </>
      ) : (
        <Tile span={2} icon="heart-pulse" title="Salud" value="—"
          note={mine ? 'Haz tu primer check-in para ver aquí sueño, pulso y HRV.' : 'Este atleta todavía no ha hecho ningún check-in.'} />
      )}
    </TileGrid>
  );
}


/** iPad: todos los gráficos a la vez, en dos columnas, en vez de abrirlos uno a uno desde su tarjeta. */
function FullCharts({ d, days }: { d: Dashboard; days: number }) {
  const wide = useWide();
  if (!wide) return null;
  const health = d.daily.some((p) => p.sleepHours != null);
  const left = ['recovery', 'load', 'zones', 'pace'];
  const right = ['completion', 'hours', 'km', ...(health ? ['sleep', 'hrv', 'rhr', 'soreness', 'stress', 'mood'] : [])];
  return (
    <View style={{ marginTop: 24, gap: 14 }}>
      <Text variant="title3">Todos los gráficos</Text>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 14 }}>{left.map((k) => <MetricDetail key={k} d={d} k={k} days={days} />)}</View>
        <View style={{ flex: 1, gap: 14 }}>{right.map((k) => <MetricDetail key={k} d={d} k={k} days={days} />)}</View>
      </View>
    </View>
  );
}
