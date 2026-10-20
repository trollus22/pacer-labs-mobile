// Pacey, el asistente de IA: motor propio que lee assets/pacey/pacey.avatar.json (definición exportada del estudio de avatares)
// y calcula, para cada instante, la pose a dibujar: cuerpo (nube de esferas), cabeza, ojos, color y parpadeo.
// Escrito desde el formato del archivo, sin código del estudio (su licencia es AGPL).
import def from '../../assets/pacey/pacey.avatar.json';

type Eye = { width: number; height: number; x: number; y: number; angle: number };
type Expression = {
  head: { x: number; y: number; z: number };
  eyes: { left: Eye; right: Eye; spacing: number };
  motion?: { eyes?: string; body?: string };
  colors?: { body?: string; eyes?: string };
};
type Step = { expression: string; holdMs: number; transitionMs: number; transition: string };
type Animation = { playbackMode: 'loop' | 'once' | 'pingpong' | string; steps: Step[]; blink: { enabled: boolean; initialDelayMs: number; minIntervalMs: number; maxIntervalMs: number; durationMs: number } };
type Surface = { width: number; height: number };

const D = def as unknown as {
  name: string;
  body: { primary: Surface; nodes: { surface: Surface; position: [number, number, number] }[] };
  colors: { body: string; eyes: string };
  expressions: Record<string, Expression>;
  animations: Record<string, Animation>;
};

export type PaceyMood = 'idle' | 'listening' | 'thinking' | 'working' | 'happy' | 'curious' | 'excited' | 'sleeping' | 'searching' | 'celebrate' | 'confused' | 'proud' | 'shy' | 'playful';
export const PACEY_NAME = D.name;
export const PACEY_MOODS = Object.keys(D.animations) as PaceyMood[];

/** Lo que dibuja el componente en un instante. Coordenadas del archivo (px de diseño), centradas en la esfera principal. */
export type PaceyPose = {
  bodyColor: string; eyeColor: string;
  roll: number; yaw: number; pitch: number;
  /** Nodos del cuerpo (la esfera principal es el primero). */
  blobs: { cx: number; cy: number; rx: number; ry: number }[];
  eyes: { cx: number; cy: number; w: number; h: number; angle: number }[];
  shake: { body: number; eyes: number }; drift: number;
  /** Escala de la respiración (≈1). */
  breath: number;
};

// --- Utilidades ---
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Curva más suave que la «smoothstep» (arranca y frena con velocidad cero y sin tirones).
const smooth = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const hex = (c: string) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixHex = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return `#${x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join('')}`; };
const rad = (d: number) => (d * Math.PI) / 180;

function blendExpr(a: Expression, b: Expression, t: number): Expression {
  const eye = (p: Eye, q: Eye): Eye => ({ width: lerp(p.width, q.width, t), height: lerp(p.height, q.height, t), x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t), angle: lerp(p.angle, q.angle, t) });
  return {
    head: { x: lerp(a.head.x, b.head.x, t), y: lerp(a.head.y, b.head.y, t), z: lerp(a.head.z, b.head.z, t) },
    eyes: { left: eye(a.eyes.left, b.eyes.left), right: eye(a.eyes.right, b.eyes.right), spacing: lerp(a.eyes.spacing, b.eyes.spacing, t) },
    motion: t < 0.5 ? a.motion : b.motion,
    colors: {
      body: mixHex(a.colors?.body ?? D.colors.body, b.colors?.body ?? D.colors.body, t),
      eyes: mixHex(a.colors?.eyes ?? D.colors.eyes, b.colors?.eyes ?? D.colors.eyes, t),
    },
  };
}

/** Expresión de la animación en el instante `ms` (con la transición suave entre pasos). */
function expressionAt(anim: Animation, ms: number): Expression {
  const steps = anim.steps;
  const ex = (s: Step) => D.expressions[s.expression] ?? D.expressions.neutral;
  if (steps.length === 1) return ex(steps[0]);
  const total = steps.reduce((s, x) => s + x.transitionMs + x.holdMs, 0);
  let t = anim.playbackMode === 'once' ? Math.min(ms, total - 1) : ms % total;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i], prev = steps[(i - 1 + steps.length) % steps.length];
    if (t < s.transitionMs) return blendExpr(ex(prev), ex(s), s.transition === 'linear' ? t / s.transitionMs : smooth(t / s.transitionMs));
    t -= s.transitionMs;
    if (t < s.holdMs) return ex(s);
    t -= s.holdMs;
  }
  return ex(steps[steps.length - 1]);
}

/** Apertura de los ojos (1 = abiertos) según el parpadeo de la animación; intervalos pseudoaleatorios pero estables. */
function blinkAt(anim: Animation, ms: number, seed: number): number {
  const b = anim.blink;
  if (!b?.enabled) return 1;
  let at = b.initialDelayMs, i = 0;
  while (at <= ms) {
    if (ms < at + b.durationMs) { const p = (ms - at) / b.durationMs; return 1 - Math.sin(p * Math.PI) * 0.9; }
    const r = Math.abs(Math.sin((seed + i++) * 12.9898) * 43758.5453) % 1;
    at += b.durationMs + lerp(b.minIntervalMs, b.maxIntervalMs, r);
    if (i > 5000) break;
  }
  return 1;
}

// Cuánto se desplazan los ojos por la cara al girar la cabeza (calibrado con las imágenes de marca: ~110 px de diseño).
const R_TRAVEL = (D.body.primary.width / 2) * 1.38;

/** Pose de Pacey en el instante `ms` de la animación `mood`. */
export function paceyPose(mood: PaceyMood | 'neutral', ms: number, seed = 1, breathe = true): PaceyPose {
  const anim = mood === 'neutral' ? null : D.animations[mood] ?? D.animations.idle;
  const e = anim ? expressionAt(anim, ms) : D.expressions.neutral;
  return poseFrom(e, anim ? blinkAt(anim, ms % 600000, seed) : 1, ms, breathe && !!anim);
}

// --- Variedad: Pacey encadena animaciones distintas (sin repetir seguidas) y las funde entre sí ---
/** Animaciones «amables» para el botón y el inicio del chat (sin enfado, sueño ni tristeza). */
export const PACEY_VARIETY: PaceyMood[] = ['idle', 'curious', 'happy', 'playful', 'searching', 'proud', 'listening', 'excited', 'shy', 'celebrate'];
const SEG_MIN = 5200, SEG_MAX = 8600, BLEND = 900;
const rand = (n: number) => Math.abs(Math.sin(n * 78.233 + 12.9898) * 43758.5453) % 1;
const CYCLE = 30 * 60 * 1000;   // tras media hora el reparto vuelve a empezar (el coste por fotograma no crece)
/** Recorre la lista: cada segmento elige una animación distinta de la anterior y dura 5–9 s. */
type Seg = { mood: PaceyMood; dur: number; idx: number };
function locate(list: PaceyMood[], ms: number, seed: number): { seg: Seg; prev: Seg | null; local: number } {
  let start = 0, prev: Seg | null = null;
  for (let i = 0; ; i++) {
    let idx = i === 0 ? 0 : Math.floor(rand(seed * 31 + i) * list.length);
    if (prev && idx === prev.idx) idx = (idx + 1 + Math.floor(rand(seed + i * 7) * (list.length - 1))) % list.length;
    const seg: Seg = { idx, mood: list[idx], dur: Math.round(lerp(SEG_MIN, SEG_MAX, rand(seed * 17 + i * 3))) };
    if (start + seg.dur > ms || i > 600) return { seg, prev, local: ms - start };
    prev = seg; start += seg.dur;
  }
}
/** Pose dentro de una lista de animaciones: cada segmento dura 5–9 s y entra fundiéndose desde el anterior. */
export function paceyVarietyPose(list: PaceyMood[], ms: number, seed = 1): PaceyPose {
  const { seg, prev, local } = locate(list, ms % CYCLE, seed);
  let e = expressionAt(D.animations[seg.mood] ?? D.animations.idle, local);
  if (prev && local < BLEND) {
    const from = expressionAt(D.animations[prev.mood] ?? D.animations.idle, prev.dur + local);
    e = blendExpr(from, e, smooth(local / BLEND));
  }
  return poseFrom(e, blinkAt(D.animations.idle, ms % CYCLE, seed), ms, true);
}

function poseFrom(e: Expression, open: number, ms: number, breathe: boolean): PaceyPose {
  // Respiración muy suave (sube, baja y se ensancha un pelo): así nunca se queda clavado entre gestos.
  const br = breathe ? Math.sin((ms / 3400) * Math.PI * 2) : 0;
  const yaw = rad(e.head.y), pitch = rad(e.head.x);
  const dx = R_TRAVEL * Math.sin(yaw), dy = -R_TRAVEL * Math.sin(pitch);
  // Los nodos están detrás de la cara (z < 0): al girar se desplazan al lado contrario, eso da volumen.
  const blobs = [{ cx: 0, cy: 0, rx: D.body.primary.width / 2, ry: D.body.primary.height / 2 },
    ...D.body.nodes.map((n) => ({ cx: n.position[0] - Math.sin(yaw) * n.position[2] * 0.9, cy: n.position[1] + Math.sin(pitch) * n.position[2] * 0.9, rx: n.surface.width / 2, ry: n.surface.height / 2 }))];
  const { left, right, spacing } = e.eyes;
  const half = Math.max(spacing, (left.width + right.width) / 2 + 3) / 2;
  const squash = Math.max(0.55, Math.cos(yaw)), vsquash = Math.max(0.6, Math.cos(pitch));
  const eyes = [[left, -1], [right, 1]].map(([eye, side]) => {
    const ey = eye as Eye, s = side as number;
    return { cx: dx + s * half * squash + ey.x, cy: dy + ey.y, w: ey.width * squash, h: Math.max(4, ey.height * vsquash * open), angle: ey.angle };
  });
  return {
    bodyColor: e.colors?.body ?? D.colors.body, eyeColor: e.colors?.eyes ?? D.colors.eyes,
    roll: e.head.z, yaw: e.head.y, pitch: e.head.x, blobs, eyes,
    shake: { body: e.motion?.body === 'shake' ? Math.sin(ms / 28) * 2.2 : 0, eyes: e.motion?.eyes === 'shake' ? Math.sin(ms / 23) * 1.6 : 0 },
    drift: (e.motion?.body === 'slowDrift' ? Math.sin(ms / 900) * 4 : 0) + br * 1.8,
    breath: 1 + br * 0.014,
  };
}

/** Caja que encierra la nube (para el viewBox del SVG). */
export const PACEY_BOX = (() => {
  const b = [{ x: 0, y: 0, rx: D.body.primary.width / 2, ry: D.body.primary.height / 2 }, ...D.body.nodes.map((n) => ({ x: n.position[0], y: n.position[1], rx: n.surface.width / 2, ry: n.surface.height / 2 }))];
  const minX = Math.min(...b.map((p) => p.x - p.rx)), maxX = Math.max(...b.map((p) => p.x + p.rx));
  const minY = Math.min(...b.map((p) => p.y - p.ry)), maxY = Math.max(...b.map((p) => p.y + p.ry));
  const size = Math.max(maxX - minX, maxY - minY) + 36;   // margen para los giros
  return { x: (minX + maxX) / 2 - size / 2, y: (minY + maxY) / 2 - size / 2, size, bottom: maxY, top: minY };
})();
