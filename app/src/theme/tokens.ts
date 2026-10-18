// Tokens de PACER LABS · paleta industrial metálica (DESIGN.md): hormigón claro + acero, monocromo.
// Solo cambian colores y tipografía; formas, tamaños y estructura son los de siempre.
import type { TextStyle } from 'react-native';

/** Acero: estructura y navegación (nunca color de acción). */
export const metal = { light: '#D5D8DB', mid: '#C9CDD2', base: '#AEB4BA', dk: '#4A4E53', ink: '#111111' } as const;

/** Estados: tinta y acero. `pink`/`magenta` = peligro, el único color. */
/** Tonos apagados (AA con texto blanco): salvia, pizarra, ocre, arcilla, ciruela y ladrillo. `coral` es la tinta de acción. */
export const tone = { sage: '#4F7A63', slate: '#506F8F', ochre: '#8F7340', clay: '#A25F4C', plum: '#7B5C7E', brick: '#A8453A', wine: '#7A3F50' } as const;
export const accent = {
  coral: '#1A1A1A',
  blue: tone.slate,
  green: tone.sage,
  amber: tone.ochre,
  violet: tone.plum,
  pink: tone.brick,
  magenta: tone.wine,
} as const;

const concrete = {
  bg: '#F4F4F2',
  surface: '#FFFFFF',
  surface2: '#ECECE9',
  surface3: '#E0E0DD',
  separator: '#D6D6D3',
  hairline: '#D6D6D3',
  text: '#111111',
  textSecondary: '#5C5C5C',
  textTertiary: '#6E6E6E',
  onAccent: '#FFFFFF',
  tileBorder: '#D6D6D3',
  ink: '#111111',
  inkDim: 'rgba(17,17,17,0.18)',
};
export type Palette = typeof concrete;
export const palettes = { dark: concrete, light: concrete } as const;
export type Scheme = keyof typeof palettes;

export const SPORT_IDS = ['run', 'trail', 'bike', 'swim', 'triathlon', 'strength', 'crossfit', 'hyrox', 'rowing', 'hiking', 'ski', 'football', 'basketball', 'tennis', 'padel', 'yoga', 'other'] as const;
export type Sport = (typeof SPORT_IDS)[number];

// El deporte se identifica por icono y nombre; el tono de acero solo acompaña.
const sportTone: Record<Sport, [string, string]> = {
  run: ['Carrera', '#A25F4C'], trail: ['Trail', '#8A6A44'], bike: ['Ciclismo', '#8F7340'], swim: ['Natación', '#506F8F'], triathlon: ['Triatlón', '#4F7F86'],
  strength: ['Fuerza', '#7B5C7E'], crossfit: ['CrossFit', '#94566A'], hyrox: ['Hyrox', '#86793A'], rowing: ['Remo', '#5A6E94'], hiking: ['Senderismo', '#66823F'],
  ski: ['Esquí', '#5F7FA0'], football: ['Fútbol', '#4F7A63'], basketball: ['Baloncesto', '#97613C'], tennis: ['Tenis', '#7F8A3A'], padel: ['Pádel', '#4C8574'],
  yoga: ['Yoga', '#8F6A91'], other: ['Otro', '#6E6E6E'],
};
export const sports = Object.fromEntries((Object.keys(sportTone) as Sport[]).map((s) => [s, { label: sportTone[s][0], color: sportTone[s][1] }])) as Record<Sport, { label: string; color: string }>;
export const sportGradient = Object.fromEntries((Object.keys(sportTone) as Sport[]).map((s) => [s, [sportTone[s][1], sportTone[s][1]]])) as unknown as Record<Sport, [string, string]>;

// Intensidad 1–5: de acero claro a tinta.
export const zones: { label: string; color: string }[] = [
  { label: 'Regenerativo', color: tone.slate },
  { label: 'Aeróbico', color: tone.sage },
  { label: 'Tempo', color: tone.ochre },
  { label: 'Umbral', color: tone.clay },
  { label: 'Máximo', color: tone.wine },
];

export const feelings = [
  { label: 'Fatal', color: tone.brick },
  { label: 'Mal', color: tone.clay },
  { label: 'Normal', color: tone.ochre },
  { label: 'Bien', color: tone.sage },
  { label: 'Genial', color: tone.slate },
];

export const RPE_STOPS = [0, 0.3, 0.6, 0.85, 1] as const;
export const RPE_COLORS = [tone.sage, tone.sage, tone.ochre, tone.clay, tone.brick] as const;
const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
export const rpeColor = (rpe: number) => {
  const t = Math.min(1, Math.max(0, rpe / 10));
  const i = Math.max(0, RPE_STOPS.findIndex((s) => s >= t) - 1);
  const k = (t - RPE_STOPS[i]) / (RPE_STOPS[i + 1] - RPE_STOPS[i]);
  const mix = (c: number) => Math.round(channel(RPE_COLORS[i], c) + (channel(RPE_COLORS[i + 1], c) - channel(RPE_COLORS[i], c)) * k);
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
};

// Inter en todo (peso máximo 600).
export const fonts = {
  thin: 'Inter_300Light',
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_600SemiBold',
  heavy: 'Inter_600SemiBold',
  mono: 'Inter_500Medium',
  monoBold: 'Inter_600SemiBold',
} as const;

// Escala tipográfica de Apple (HIG). El tracking es negativo cuanto más grande el texto.
export const type = {
  // Jerarquía por peso y color más que por tamaño (sistema de la referencia): títulos ligeros, cifras grandes ligeras.
  numeralXL: { fontFamily: fonts.light, fontSize: 76, lineHeight: 80, letterSpacing: -3 },
  numeral: { fontFamily: fonts.light, fontSize: 44, lineHeight: 48, letterSpacing: -1.6 },
  numeralSm: { fontFamily: fonts.light, fontSize: 34, lineHeight: 38, letterSpacing: -1.1 },
  tileLabel: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 19, letterSpacing: -0.15 },
  largeTitle: { fontFamily: fonts.regular, fontSize: 36, lineHeight: 42, letterSpacing: -1.1 },
  title1: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  title2: { fontFamily: fonts.medium, fontSize: 22, lineHeight: 28, letterSpacing: -0.5 },
  title3: { fontFamily: fonts.medium, fontSize: 20, lineHeight: 25, letterSpacing: -0.4 },
  headline: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, letterSpacing: -0.25 },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },
  callout: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, letterSpacing: -0.15 },
  subhead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
  footnote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  caption: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.9, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, tile: 32, pill: 999 } as const;
/** Mosaico: huecos mínimos entre tarjetas, como en la referencia. */
export const tile = { gap: 8, pad: 18, rowH: 188 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const GUTTER = 20;

// Muelles y curvas: valores de la guía (Apple + Reanimated). Nada aproximado.
export const spring = {
  settle: { duration: 400, dampingRatio: 1 },
  snap: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
} as const;
