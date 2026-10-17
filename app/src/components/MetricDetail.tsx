import { BarChart, type BarDatum } from './charts/BarChart';
import { LineChart } from './charts/LineChart';
import { LoadMeter } from './charts/LoadMeter';
import { ReadinessCard } from './charts/ReadinessCard';
import { ZoneDistribution } from './charts/ZoneDistribution';
import { accent } from '@/theme';
import { mondayOf, shortDate, todayISO } from '@/lib/dates';
import type { Dashboard } from '@/lib/types';

export const METRIC_TITLES: Record<string, string> = {
  recovery: 'Recuperación', load: 'Carga', streak: 'Constancia', completion: 'Cumplimiento', hours: 'Horas', km: 'Kilómetros',
  zones: 'Intensidad', pace: 'Ritmo de carrera', sleep: 'Sueño', hrv: 'HRV', rhr: 'Pulso en reposo', soreness: 'Agujetas', stress: 'Estrés', mood: 'Ánimo y energía',
};

const pace = (v: number) => `${Math.floor(v)}:${String(Math.round((v % 1) * 60) % 60).padStart(2, '0')}`;

/** El gráfico completo de una métrica (lo que abre el ↗ de cada tarjeta). */
export function MetricDetail({ d, k, days }: { d: Dashboard; k: string; days: number }) {
  const daily = d.daily;
  const dates = daily.map((p) => p.date);
  const col = (key: keyof Dashboard['daily'][number]) => daily.map((p) => p[key] as number | null);
  const currentMonday = mondayOf(todayISO());
  const weeklyBars = (v: (w: Dashboard['weekly'][number]) => number): BarDatum[] =>
    d.weekly.map((w) => ({ label: shortDate(w.weekStart), caption: `Semana del ${shortDate(w.weekStart)}`, value: v(w), partial: w.weekStart === currentMonday }));
  const loadBars: BarDatum[] = days <= 28
    ? daily.map((p) => ({ label: shortDate(p.date), caption: shortDate(p.date), value: p.load }))
    : weeklyBars((w) => w.load);

  switch (k) {
    case 'recovery':
      return (
        <>
          <ReadinessCard current={d.current} />
          <LineChart title="Recuperación · evolución" dates={dates} series={[{ values: col('readiness'), color: accent.blue, area: true }]} domain={[0, 100]} caption={`Últimos ${days} días`} height={120}
            bands={[{ from: 70, to: 100, color: accent.green, label: 'Listo' }, { from: 0, to: 45, color: accent.pink, label: 'Descanso' }]} note="Se calcula cada día con los datos disponibles hasta esa fecha." />
        </>
      );
    case 'load':
      return (
        <>
          <LoadMeter ratio={d.current.stats.ratio} acute={d.current.stats.acute} chronic={d.current.stats.chronic} enough={d.current.stats.enough} />
          <BarChart title={days <= 28 ? 'Carga diaria' : 'Carga semanal'} data={loadBars} color={accent.coral} headline="sum" caption={`Total ${days} días`}
            line={days <= 28 ? { values: col('acute'), color: accent.coral, label: 'Media de 7 días' } : undefined} legendLabel={days <= 28 ? 'Carga del día' : undefined} note="Esfuerzo percibido (1–10) × minutos de cada sesión." />
          <LineChart title="Ratio de carga" dates={dates} series={[{ values: col('ratio'), color: accent.coral }]} decimals={2} domain={[0.4, 2]} height={110} caption="Media 7 días ÷ media 28 días"
            bands={[{ from: 0.8, to: 1.3, color: accent.green, label: 'Óptima' }, { from: 1.5, to: 2, color: accent.coral, label: 'Muy alta' }]} />
        </>
      );
    case 'streak':
      return <BarChart title="Carga diaria" data={loadBars} color={accent.coral} headline="sum" caption={`Total ${days} días`} note="Los días sin barra son días de descanso." />;
    case 'completion':
      return <BarChart title="Cumplimiento" data={weeklyBars((w) => (w.planned ? (w.done / w.planned) * 100 : 0))} color={accent.blue} unit="%" yMax={100} caption="Entrenos hechos ÷ planificados" />;
    case 'hours':
      return <BarChart title="Horas por semana" data={weeklyBars((w) => w.minutes / 60)} color={accent.violet} unit="h" decimals={1} caption="Semana en curso incluida" />;
    case 'km':
      return <BarChart title="Kilómetros por semana" data={weeklyBars((w) => w.km)} color={accent.amber} unit="km" decimals={1} caption="Semana en curso incluida" />;
    case 'zones':
      return <ZoneDistribution minutes={d.zoneMinutes} />;
    case 'pace':
      return <LineChart title="Ritmo de carrera" dates={d.runPace.map((p) => p.date)} series={[{ values: d.runPace.map((p) => p.pace), color: accent.green }]} unit="min/km" format={pace} minSpan={2} height={120} caption="Cada carrera completada" note="Menos es más rápido." empty="Hacen falta al menos dos carreras con distancia." />;
    case 'sleep':
      return <LineChart title="Sueño" dates={dates} series={[{ values: col('sleepHours'), color: accent.violet }]} unit="h" decimals={1} domain={[4, 10]} height={120} caption={`Últimos ${days} días`} bands={[{ from: 7, to: 9, color: accent.green, label: 'Objetivo' }]} />;
    case 'rhr':
      return <LineChart title="Pulso en reposo" dates={dates} series={[{ values: col('restingHr'), color: accent.pink }]} unit="lpm" minSpan={14} height={120} caption="Más alto que lo habitual = más fatiga" empty="Sin datos de pulso en reposo." />;
    case 'hrv':
      return <LineChart title="HRV" dates={dates} series={[{ values: col('hrv'), color: accent.green }]} unit="ms" minSpan={30} height={120} caption="Más alto = mejor recuperación" empty="Sin datos de HRV." />;
    case 'soreness':
      return <LineChart title="Agujetas" dates={dates} series={[{ values: col('soreness'), color: accent.blue }]} domain={[1, 5]} height={110} caption="1 ninguna · 5 muchas" />;
    case 'stress':
      return <LineChart title="Estrés" dates={dates} series={[{ values: col('stress'), color: accent.blue }]} domain={[1, 5]} height={110} caption="1 bajo · 5 alto" />;
    case 'mood':
      return <LineChart title="Ánimo y energía" dates={dates} series={[{ values: col('mood'), color: accent.blue }]} domain={[1, 5]} height={110} caption="1 bajo · 5 alto" />;
    default:
      return null;
  }
}
