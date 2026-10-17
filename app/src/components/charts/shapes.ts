import type { ViewStyle } from 'react-native';

// Geometría de los gráficos: curvas suaves sin sobreimpulso, ejes con números redondos y tramos sin hueco.
export type Pt = { x: number; y: number };

/** Interpolación monótona (Fritsch–Carlson): suave pero sin pasarse nunca de los datos. */
export function monotonePath(pts: Pt[]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx.push(pts[i + 1].x - pts[i].x); m.push((pts[i + 1].y - pts[i].y) / (dx[i] || 1)); }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = Math.hypot(a, b);
    if (h > 3) { t[i] = (3 * a * m[i]) / h; t[i + 1] = (3 * b * m[i]) / h; }
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += ` C ${pts[i].x + c} ${pts[i].y + t[i] * c} ${pts[i + 1].x - c} ${pts[i + 1].y - t[i + 1] * c} ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
}

/** Tramos consecutivos de valores no nulos: [inicio, fin] inclusive. */
export function runs(values: (number | null)[]): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  values.forEach((v, i) => {
    if (v != null && start < 0) start = i;
    if ((v == null || i === values.length - 1) && start >= 0) { out.push([start, v == null ? i - 1 : i]); start = -1; }
  });
  return out;
}

/** Marcas de eje con números redondos. */
export function niceTicks(min: number, max: number, count = 3): number[] {
  if (!(max > min)) return [min];
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? 10 * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** 1 200 → «1,2K». */
export function compact(v: number, decimals = 0): string {
  const a = Math.abs(v);
  if (a >= 1000) return `${(v / 1000).toFixed(a >= 10000 ? 0 : 1).replace('.', ',')}K`;
  return v.toFixed(decimals).replace('.', ',');
}

/** Rectángulo con las dos esquinas superiores redondeadas y la base recta (barras que crecen desde la línea base). */
export function barPath(x: number, base: number, w: number, h: number, r: number): string {
  'worklet';
  if (h <= 0.5) return '';
  const rr = Math.min(r, h, w / 2);
  return `M ${x} ${base} L ${x} ${base - h + rr} Q ${x} ${base - h} ${x + rr} ${base - h} L ${x + w - rr} ${base - h} Q ${x + w} ${base - h} ${x + w} ${base - h + rr} L ${x + w} ${base} Z`;
}

/** Evita que, en web, arrastrar sobre un gráfico seleccione texto. En móvil no hace nada. */
export const NO_SELECT = { userSelect: 'none' } as unknown as ViewStyle;
