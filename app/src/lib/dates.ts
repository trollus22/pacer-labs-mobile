// Fechas «de calendario» como cadenas YYYY-MM-DD en hora local. Se parsean a mediodía para esquivar saltos de horario.
const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s: string) => new Date(`${s}T12:00:00`);
export const todayISO = () => toISO(new Date());
export const addDays = (s: string, n: number) => { const d = fromISO(s); d.setDate(d.getDate() + n); return toISO(d); };
export const mondayOf = (s: string) => addDays(s, -((fromISO(s).getDay() + 6) % 7));
export const weekDays = (monday: string) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

export const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-ES', opts);
const longFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const shortFmt = fmt({ day: 'numeric', month: 'short' });
const weekdayFmt = fmt({ weekday: 'long' });

export const formatLong = (s: string) => cap(longFmt.format(fromISO(s)));
export const formatWeekday = (s: string) => cap(weekdayFmt.format(fromISO(s)));
const chartFmt = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const shortDayFmt = fmt({ day: 'numeric', month: 'short' });
/** «mar, 6 oct» */
export const chartDate = (s: string) => chartFmt.format(fromISO(s)).replace(/\./g, '');
/** «6 oct» */
export const shortDate = (s: string) => shortDayFmt.format(fromISO(s)).replace(/\./g, '');
export const dayNumber = (s: string) => fromISO(s).getDate();

export function formatWeekRange(monday: string) {
  const a = fromISO(monday), b = fromISO(addDays(monday, 6));
  const bm = shortFmt.format(b).replace('.', '');
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${bm}`
    : `${shortFmt.format(a).replace('.', '')} – ${bm}`;
}

export function relativeDay(s: string) {
  const t = todayISO();
  if (s === t) return 'Hoy';
  if (s === addDays(t, 1)) return 'Mañana';
  if (s === addDays(t, -1)) return 'Ayer';
  return formatWeekday(s);
}

export function timeAgo(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  return shortFmt.format(new Date(iso)).replace('.', '');
}
