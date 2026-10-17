export const formatDuration = (min: number | null) => {
  if (!min) return '—';
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}'` : `${m}'`;
};
export const formatKm = (km: number | null) => (km ? `${Number.isInteger(km) ? km : km.toFixed(1)} km` : '—');
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
export const firstName = (name: string) => name.split(/\s+/)[0] ?? name;
export const rpeLabel = (v: number) => (v <= 2 ? 'Muy fácil' : v <= 4 ? 'Fácil' : v <= 6 ? 'Moderado' : v <= 8 ? 'Duro' : v === 9 ? 'Muy duro' : 'Máximo');
