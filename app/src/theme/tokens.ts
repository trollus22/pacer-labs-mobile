// Tokens de PACER LABS (fuente: training-connection/brand/pacer-labs/out/tokens.json).
// Negro verdadero de fondo (OLED) + acentos saturados. Los colores se usan para significar algo:
// deporte, zona de intensidad, estado. Nunca decorativos.
import type { TextStyle } from 'react-native';

// Acentos: iguales en modo claro y oscuro (son la marca). Se usan como relleno o marca; para TEXTO usa `ink()` del tema.
export const accent = {
  coral: '#F04A3E',
  blue: '#0A84FF',
  green: '#30D158',
  amber: '#FF9F0A',
  violet: '#BF5AF2',
  pink: '#FF375F',
  /** Solo para la zona 5: validado contra el coral (ΔE 18,5 en visión normal; coral↔rosa daba 5,6). */
  magenta: '#C026D3',
} as const;

// Neutros: lo único que cambia entre modos.
const dark = {
  bg: '#000000',
  surface: '#0E0F13',
  surface2: '#16181F',
  surface3: '#20232D',
  separator: 'rgba(255,255,255,0.08)',
  hairline: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  textSecondary: '#9898A0',
  textTertiary: '#5F616B',
  /** Texto sobre un relleno de acento: negro en ambos modos (el blanco no llega a AA sobre estos colores). */
  onAccent: '#000000',
  /** Borde de 1 px de las tarjetas: casi invisible, solo define el contorno. */
  tileBorder: 'rgba(255,255,255,0.07)',
  /** Tinta de las micro-visualizaciones: trazo principal y trazo atenuado. */
  ink: '#FFFFFF',
  inkDim: 'rgba(255,255,255,0.24)',
};
export type Palette = typeof dark;
const light: Palette = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surface2: '#ECECF1',
  surface3: '#E1E1E8',
  separator: 'rgba(0,0,0,0.08)',
  hairline: 'rgba(0,0,0,0.14)',
  text: '#111215',
  textSecondary: '#63656E',
  textTertiary: '#9A9CA5',
  onAccent: '#000000',
  tileBorder: 'rgba(0,0,0,0.05)',
  ink: '#111215',
  inkDim: 'rgba(0,0,0,0.18)',
};
export const palettes = { dark, light } as const;
export type Scheme = keyof typeof palettes;

// Catálogo de deportes: mismo orden e ids que `api/sports.js`. Color e icono identifican; el nombre siempre acompaña.
export const SPORT_IDS = ['run', 'trail', 'bike', 'swim', 'triathlon', 'strength', 'crossfit', 'hyrox', 'rowing', 'hiking', 'ski', 'football', 'basketball', 'tennis', 'padel', 'yoga', 'other'] as const;
export type Sport = (typeof SPORT_IDS)[number];

export const sports: Record<Sport, { label: string; color: string }> = {
  run: { label: 'Carrera', color: accent.coral },
  trail: { label: 'Trail', color: '#E8742A' },
  bike: { label: 'Ciclismo', color: accent.amber },
  swim: { label: 'Natación', color: accent.blue },
  triathlon: { label: 'Triatlón', color: '#2DC4D6' },
  strength: { label: 'Fuerza', color: accent.violet },
  crossfit: { label: 'CrossFit', color: accent.pink },
  hyrox: { label: 'Hyrox', color: '#FFD60A' },
  rowing: { label: 'Remo', color: '#4F7DFF' },
  hiking: { label: 'Senderismo', color: '#8FBF3A' },
  ski: { label: 'Esquí', color: '#7FA8D9' },
  football: { label: 'Fútbol', color: accent.green },
  basketball: { label: 'Baloncesto', color: '#F26B2E' },
  tennis: { label: 'Tenis', color: '#C7D62E' },
  padel: { label: 'Pádel', color: '#2FBF9B' },
  yoga: { label: 'Yoga', color: '#D98BE0' },
  other: { label: 'Otro', color: '#9898A0' },
};

// Degradado de cada deporte: dos tonos saturados (nunca un color plano que se ensucia al oscurecerse).
export const sportGradient: Record<Sport, [string, string]> = {
  run: ['#FF5A47', '#B3173F'],
  trail: ['#F28B3A', '#B8461A'],
  bike: ['#FFAA0A', '#E5322D'],
  swim: ['#1E90FF', '#5B3AE0'],
  triathlon: ['#2DD4E0', '#2B63D9'],
  strength: ['#C45FF5', '#E0368A'],
  crossfit: ['#FF4F7A', '#B3173F'],
  hyrox: ['#FFD60A', '#E08A00'],
  rowing: ['#5B8CFF', '#3A2FB8'],
  hiking: ['#A5D43F', '#2E8B57'],
  ski: ['#8FB8E8', '#3C5FA8'],
  football: ['#3FDB6B', '#0F7A52'],
  basketball: ['#FF7A3D', '#B3321A'],
  tennis: ['#D4E23A', '#6FA11A'],
  padel: ['#35D1A8', '#1B6FA8'],
  yoga: ['#E5A0EA', '#7A4FC9'],
  other: ['#A9AAB4', '#555763'],
};

// Intensidad 1–5: de frío a incandescente.
export const zones: { label: string; color: string }[] = [
  { label: 'Regenerativo', color: accent.blue },
  { label: 'Aeróbico', color: accent.green },
  { label: 'Tempo', color: accent.amber },
  { label: 'Umbral', color: accent.coral },
  { label: 'Máximo', color: accent.magenta },
];

export const feelings = [
  { label: 'Fatal', color: accent.pink },
  { label: 'Mal', color: accent.coral },
  { label: 'Normal', color: accent.amber },
  { label: 'Bien', color: accent.green },
  { label: 'Genial', color: accent.blue },
];

// Misma escala que la barra del slider de esfuerzo (EffortSlider): verde → ámbar → coral → rosa.
export const RPE_STOPS = [0, 0.3, 0.6, 0.85, 1] as const;
export const RPE_COLORS = [accent.green, accent.green, accent.amber, accent.coral, accent.pink] as const;
const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
export const rpeColor = (rpe: number) => {
  const t = Math.min(1, Math.max(0, rpe / 10));
  const i = Math.max(0, RPE_STOPS.findIndex((s) => s >= t) - 1);
  const k = (t - RPE_STOPS[i]) / (RPE_STOPS[i + 1] - RPE_STOPS[i]);
  const mix = (c: number) => Math.round(channel(RPE_COLORS[i], c) + (channel(RPE_COLORS[i + 1], c) - channel(RPE_COLORS[i], c)) * k);
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
};

export const fonts = {
  thin: 'PlusJakartaSans_200ExtraLight',
  light: 'PlusJakartaSans_300Light',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  heavy: 'PlusJakartaSans_800ExtraBold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
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
