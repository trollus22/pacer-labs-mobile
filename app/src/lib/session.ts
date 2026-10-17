import type { Exercise, SessionItem } from './types';

export const fromExercise = (e: Exercise): SessionItem => ({ exerciseId: e.id, name: e.name, kind: e.kind, sets: e.sets, qty: e.qty, rest: e.rest || null, note: '' });
export const QTY_LABEL = { reps: 'Reps', time: 'Segundos', dist: 'Metros' } as const;

/** Resumen corto del valor por defecto de un ejercicio («4×8», «6×800 m», «3×45 s»). */
export function summary(e: Pick<SessionItem, 'kind' | 'sets' | 'qty'>): string {
  const q = e.qty == null ? '' : e.kind === 'dist' ? `${e.qty} m` : e.kind === 'time' ? (e.qty >= 60 && e.qty % 60 === 0 ? `${e.qty / 60} min` : `${e.qty} s`) : `${e.qty}`;
  return e.sets && e.sets > 1 && q ? `${e.sets}×${q}` : q;
}

const fmtTime = (s: number) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)}'${String(s % 60).padStart(2, '0')}"` : `${s} s`);
/** Cómo se enseña un ejercicio ya elegido: cifra grande («4×8», «6×800 m») y datos secundarios (descanso, peso). */
export function describe(i: SessionItem): { main: string; chips: string[] } {
  const q = i.qty == null ? '' : i.kind === 'dist' ? (i.qty >= 1000 && i.qty % 100 === 0 ? `${String(i.qty / 1000).replace('.', ',')} km` : `${i.qty} m`) : i.kind === 'time' ? fmtTime(i.qty) : `${i.qty}`;
  const main = i.qty == null ? (i.sets ? `${i.sets} series` : '—') : i.sets && i.sets > 1 ? `${i.sets}×${q}` : q;
  const chips = [i.rest ? `Descanso ${fmtTime(i.rest)}` : '', i.weightKg ? `${String(i.weightKg).replace('.', ',')} kg` : '', i.kind === 'reps' && i.qty ? 'repeticiones' : ''].filter(Boolean);
  return { main, chips };
}
