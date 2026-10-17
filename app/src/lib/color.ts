// Acepta '#RRGGBB' y 'rgb(r,g,b)'.
const rgb = (c: string): readonly [number, number, number] => {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const alpha = (hex: string, a: number) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
/** Oscurece hacia negro: t = 0 deja el color, t = 1 es negro. */
export const darken = (hex: string, t: number) => { const [r, g, b] = rgb(hex); return `rgb(${Math.round(r * (1 - t))},${Math.round(g * (1 - t))},${Math.round(b * (1 - t))})`; };
/** Mezcla hacia blanco: t = 0 deja el color, t = 1 es blanco. */
export const lighten = (c: string, t: number) => { const [r, g, b] = rgb(c); const m = (v: number) => Math.round(v + (255 - v) * t); return `rgb(${m(r)},${m(g)},${m(b)})`; };
