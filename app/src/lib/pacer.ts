import { useSyncExternalStore } from 'react';
import { addDays, todayISO, fromISO } from './dates';
import type { Dashboard, ReadinessStatus, TeamDashboard } from './types';
import type { Sport } from '@/theme';

// Pacey, el chat de IA. De momento NO hay IA: las respuestas se simulan aquí con los datos reales de la app (recuperación,
// sueño, carga) para poder diseñar y probar la experiencia. Las conversaciones viven en memoria y se pierden al cerrar la app.

/** De qué parte de la app viene la pregunta. Da color y título a la conversación y orienta la respuesta. */
export type PacerTopic = 'recovery' | 'today' | 'week' | 'form' | 'team' | 'general';

export type PacerBlock =
  | { type: 'workout'; sport: Sport; title: string; detail: string; bars: number[]; level: 'good' | 'caution'; actions: string[] }
  | { type: 'athletes'; rows: { name: string; detail: string; score: number | null; status: ReadinessStatus }[]; actions: string[] };

export type PacerMessage = {
  id: string;
  role: 'user' | 'pacer';
  at: string;
  /** Texto del usuario, o el texto que Pacey va «escribiendo». */
  text: string;
  /** Lo que Pacey ha mirado para responder («Ha mirado tu check-in…»). */
  steps?: string[];
  blocks?: PacerBlock[];
  followUps?: string[];
  /** thinking: aún no escribe · writing: el texto va saliendo · done. */
  state?: 'thinking' | 'writing' | 'done';
};

export type PacerConversation = { id: string; title: string; topic: PacerTopic; updatedAt: string; messages: PacerMessage[] };

/** Datos de la app con los que se arma la respuesta (los que haya: atleta o entrenador). */
export type PacerFacts = { role: 'athlete' | 'coach'; name: string; me?: Dashboard; team?: TeamDashboard; workout?: { title: string; sport: Sport; zone: number; durationMin: number | null } };

// --- Almacén en memoria -------------------------------------------------------------------------------------------------

let convs: PacerConversation[] = [];
let seededFor: string | null = null;
const listeners = new Set<() => void>();
const emit = () => { convs = [...convs]; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
let seq = 0;
const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

export const usePacerConversations = () => useSyncExternalStore(subscribe, () => convs);
export const getConversation = (id: string | null | undefined) => (id ? convs.find((c) => c.id === id) ?? null : null);

export function deleteConversation(id: string) { convs = convs.filter((c) => c.id !== id); emit(); }

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();
const daysAgo = (d: number, hour = 19) => { const x = fromISO(addDays(todayISO(), -d)); x.setHours(hour, 10, 0, 0); return x.toISOString(); };
const done = (role: 'user' | 'pacer', text: string, at: string, extra?: Partial<PacerMessage>): PacerMessage => ({ id: uid(), role, text, at, state: 'done', ...extra });

/** Unas conversaciones de ejemplo, para que el menú de conversaciones tenga contenido la primera vez. */
export function seedPacer(userId: string, role: 'athlete' | 'coach') {
  if (seededFor === userId) return;
  seededFor = userId;
  const c = (title: string, topic: PacerTopic, at: string, q: string, a: string): PacerConversation =>
    ({ id: uid(), title, topic, updatedAt: at, messages: [done('user', q, at), done('pacer', a, at, { steps: ['Ejemplo de demostración'] })] });
  convs = role === 'coach'
    ? [
      c('Carga del equipo esta semana', 'team', ago(180), '¿Cómo va la carga del equipo esta semana?', 'La carga media del equipo está **dentro de lo previsto**. Dos atletas suben más de un 30 % respecto a su media: conviene vigilarlos el fin de semana.'),
      c('Plan de taper para la media', 'week', daysAgo(2), 'Prepárame un taper de 10 días para la media maratón', 'Te propongo bajar el volumen un **40 %** manteniendo dos sesiones cortas de ritmo. Lo vemos atleta por atleta cuando quieras.'),
      c('Quién no hace check-in', 'team', daysAgo(5), '¿Quién lleva días sin hacer check-in?', 'Tres atletas no han hecho check-in en los últimos 3 días. Sin check-in, su recuperación tiene **fiabilidad baja**.'),
    ]
    : [
      c('Plan para la tirada larga', 'week', daysAgo(1), '¿Cómo planteo la tirada larga del domingo?', 'Empieza **muy suave** los primeros 20 minutos y no pases de zona 2. Si llegas bien al km 15, puedes cerrar los últimos 3 km a ritmo de maratón.'),
      c('Resumen de la semana', 'week', daysAgo(3), 'Resume mi semana de entreno', 'Has completado **4 de 5** sesiones. La carga sube de forma razonable y tu sueño ha mejorado respecto a la semana pasada.'),
      c('Molestia en el gemelo', 'general', daysAgo(6), 'Noto una molestia en el gemelo, ¿entreno?', 'Si la molestia cambia tu forma de correr, **hoy no**. Haz movilidad suave y coméntaselo a tu entrenador. Si dura más de unos días, consulta a un fisio.'),
    ];
  emit();
}

// --- Sugerencias -------------------------------------------------------------------------------------------------------

export type PacerSuggestion = { topic: PacerTopic; label: string; q: string };

export function suggestions(f: PacerFacts): PacerSuggestion[] {
  if (f.role === 'coach') {
    return [
      { topic: 'team', label: 'Hoy', q: 'Resume quién necesita atención hoy' },
      { topic: 'week', label: 'Semana', q: '¿Cómo va la carga del equipo esta semana?' },
      { topic: 'recovery', label: 'Recuperación', q: '¿Quién debería descansar mañana?' },
      { topic: 'form', label: 'Check-in', q: '¿Quién lleva días sin hacer check-in?' },
    ];
  }
  const score = f.me?.current.score;
  return [
    { topic: 'recovery', label: 'Recuperación', q: score != null ? `¿Por qué estoy en ${score} hoy?` : '¿Cómo está mi recuperación?' },
    { topic: 'today', label: 'Hoy', q: f.workout ? `¿Cómo enfoco «${f.workout.title}»?` : '¿Qué me conviene entrenar hoy?' },
    { topic: 'week', label: 'Semana', q: 'Resume mi semana de entreno' },
    { topic: 'form', label: 'Forma', q: '¿Estoy mejorando mi forma?' },
  ];
}

// --- Respuestas simuladas ----------------------------------------------------------------------------------------------

const dec = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const lastSleep = (d?: Dashboard) => { const xs = d?.daily.map((p) => p.sleepHours) ?? []; for (let i = xs.length - 1; i >= 0; i--) if (xs[i] != null) return xs[i] as number; return null; };

const toYou = (t: string) => t.replace(/Durmió/g, 'Dormiste').replace(/durmió/g, 'dormiste').replace(/\bsu media\b/g, 'tu media').replace(/\bsus\b/g, 'tus');

function guessTopic(q: string, fallback: PacerTopic): PacerTopic {
  const s = q.toLowerCase();
  if (/equipo|atletas|quién|quien/.test(s)) return 'team';
  if (/recuper|descans|por qué estoy|cansad|dorm|sueño/.test(s)) return 'recovery';
  if (/hoy|series|enfoco|entreno de|calentamiento/.test(s)) return 'today';
  if (/semana|resume|carga/.test(s)) return 'week';
  if (/forma|mejorando|umbral|ritmo/.test(s)) return 'form';
  return fallback;
}

/** Título corto de la conversación a partir de la primera pregunta. */
function titleFrom(q: string) {
  const t = q.replace(/[¿?¡!«»]/g, '').trim();
  return t.length > 34 ? `${t.slice(0, 32).trimEnd()}…` : t.charAt(0).toUpperCase() + t.slice(1);
}

function reply(q: string, topic: PacerTopic, f: PacerFacts): Omit<PacerMessage, 'id' | 'role' | 'at' | 'state'> {
  const cur = f.me?.current;
  const sleep = lastSleep(f.me);
  const ratio = cur?.stats.ratio ?? null;
  // Los motivos vienen en tercera persona («Durmió 5,3 h»); Pacey te habla a ti.
  const reasons = cur?.drivers.filter((d) => d.tone !== 'info').map((d) => toYou(d.text.replace(/\.$/, ''))) ?? [];

  if (f.role === 'coach' || topic === 'team') {
    const list = (f.team?.athletes ?? [])
      .filter((a) => a.readiness.status === 'rest' || a.readiness.status === 'caution' || !a.lastCheckin)
      .sort((a, b) => (a.readiness.score ?? 999) - (b.readiness.score ?? 999))
      .slice(0, 4);
    if (!list.length) {
      return { steps: [`Ha mirado ${f.team?.athletes.length ?? 0} atletas y sus check-ins`], text: 'Hoy **nadie** necesita atención especial: todo el equipo está listo para entrenar según lo previsto.', followUps: ['¿Quién va más cargado esta semana?', '¿Quién no ha hecho check-in?'] };
    }
    return {
      steps: [`Ha mirado ${f.team?.athletes.length ?? 0} atletas y sus check-ins`],
      text: `${list.length === 1 ? 'Un atleta pide' : `${list.length} atletas piden`} ajustar el plan de hoy:`,
      blocks: [{
        type: 'athletes',
        rows: list.map((a) => ({ name: a.name, score: a.readiness.score, status: a.readiness.status, detail: a.lastCheckin ? (a.drivers.filter((d) => d.tone !== 'info').slice(0, 2).map((d) => d.text.replace(/\.$/, '')).join(' · ') || 'Recuperación baja') : 'Sin check-in reciente' })),
        actions: ['Ajustar sus entrenos', 'Recordar el check-in'],
      }],
      followUps: ['¿Qué les propongo en su lugar?', 'Resume la semana del equipo'],
    };
  }

  if (topic === 'recovery') {
    if (cur?.score == null) return { steps: ['Ha buscado tu último check-in'], text: 'Aún no tengo datos suficientes para valorar tu recuperación. Haz el **check-in de hoy** (sueño, agujetas, estrés) y te lo explico.', followUps: ['¿Qué mide el check-in?'] };
    const tone = cur.status === 'ready' ? 'Estás **listo para entrenar**' : cur.status === 'caution' ? 'Hoy toca **ir con cuidado**' : 'Hoy tu cuerpo pide **descanso**';
    return {
      steps: ['Ha mirado tu check-in y tus últimas sesiones'],
      text: `${tone}: tu recuperación es de **${cur.score}/100**.${reasons.length ? ` Lo que más pesa: ${reasons.slice(0, 3).join(', ').toLowerCase()}.` : ''}${sleep != null && sleep < 6.5 && !reasons.some((r) => /durm|dorm|sueño/i.test(r)) ? ` Dormiste **${dec(sleep)} h**, por debajo de lo que te conviene.` : ''}`,
      followUps: ['¿Qué hago para recuperar mejor?', '¿Entreno igual hoy?'],
    };
  }

  if (topic === 'today') {
    const w = f.workout;
    const hard = (w?.zone ?? 3) >= 4;
    const tired = cur?.status === 'caution' || cur?.status === 'rest';
    if (hard && tired) {
      const z = w?.zone ?? 4;
      return {
        steps: ['Ha mirado tu recuperación y el entreno de hoy'],
        text: `Hoy no es día de ir a tope${sleep != null ? `: dormiste **${dec(sleep)} h**` : ''}${ratio != null ? ` y tu carga va a **×${dec(ratio, 2)}**` : ''}. Te propongo una versión más corta y con más recuperación:`,
        blocks: [{ type: 'workout', sport: w?.sport ?? 'run', title: `${w?.title ?? 'Series'} · versión suave`, detail: `${Math.max(30, Math.round((w?.durationMin ?? 55) * 0.8))} min · Zona ${z - 1}–${z}`, bars: [1, 3, 1, 3, 1, 3, 1, 3, 1], level: 'good', actions: ['Enviar al reloj', 'Proponer a mi entrenador'] }],
        followUps: ['¿Y si mañana descanso?', ratio != null ? `Explícame el ×${dec(ratio, 2)}` : '¿Qué es la carga?'],
      };
    }
    return {
      steps: ['Ha mirado tu recuperación y el entreno de hoy'],
      text: w ? `Adelante con **${w.title}**. Calienta 15 minutos suaves, ${hard ? 'haz las series controlando el ritmo desde el principio y no salgas más rápido de lo previsto' : 'mantén un ritmo cómodo en el que puedas hablar'}. Al terminar, registra cómo te has sentido.` : 'Hoy no tienes entreno en el plan. Si te apetece moverte, **30–40 minutos suaves** o movilidad te vendrán bien.',
      followUps: ['¿Qué calentamiento hago?', '¿Qué como antes?'],
    };
  }

  if (topic === 'week') {
    return { steps: ['Ha mirado tus últimos 7 días'], text: `Esta semana llevas una carga de **${Math.round(cur?.stats.weekLoad ?? 0)}** puntos${ratio != null ? `, un ×${dec(ratio, 2)} respecto a tu media` : ''}. ${ratio != null && ratio > 1.3 ? 'Vas **más cargado de lo habitual**: el próximo día suave, que sea suave de verdad.' : 'Vas **dentro de lo razonable**: buen momento para mantener la constancia.'}`, followUps: ['¿Qué día debería descansar?', '¿Cómo cierro la semana?'] };
  }

  if (topic === 'form') {
    return { steps: ['Ha mirado tus últimas 4 semanas'], text: 'Tu forma va **en la buena dirección**: la carga crónica sube poco a poco y tus sensaciones en las sesiones de calidad han mejorado. Mantén 2 sesiones de calidad por semana como máximo.', followUps: ['¿Cuándo hago un test?', '¿Qué ritmo debería tener en umbral?'] };
  }

  return { steps: ['Ha mirado tus datos de hoy'], text: `Buena pregunta. Cuando Pacey esté conectado a la IA te responderé a «${q.replace(/[¿?]/g, '')}» con tus datos. Por ahora es una **demostración** del diseño.`, followUps: ['¿Por qué estoy así hoy?', 'Resume mi semana'] };
}

// --- Enviar una pregunta -----------------------------------------------------------------------------------------------

const timers = new Map<string, ReturnType<typeof setTimeout>[]>();
const patch = (cid: string, mid: string, p: Partial<PacerMessage>) => {
  convs = convs.map((c) => (c.id !== cid ? c : { ...c, messages: c.messages.map((m) => (m.id === mid ? { ...m, ...p } : m)) }));
  emit();
};

/** Envía una pregunta (crea la conversación si hace falta) y simula la respuesta: pensando → escribiendo → lista. Devuelve el id de la conversación. */
export function askPacer({ conversationId, question, topic = 'general', facts, reducedMotion }: { conversationId?: string | null; question: string; topic?: PacerTopic; facts: PacerFacts; reducedMotion?: boolean }): string {
  const q = question.trim();
  const now = new Date().toISOString();
  let conv = getConversation(conversationId);
  const t = guessTopic(q, topic);
  if (!conv) { conv = { id: uid(), title: titleFrom(q), topic: t, updatedAt: now, messages: [] }; convs = [conv, ...convs]; }
  const cid = conv.id;
  const answer = reply(q, t, facts);
  const pid = uid();
  convs = convs.map((c) => (c.id !== cid ? c : { ...c, updatedAt: now, messages: [...c.messages, done('user', q, now), { id: pid, role: 'pacer', at: now, text: '', state: 'thinking' }] }));
  // La conversación más reciente, arriba en el menú.
  convs = [convs.find((c) => c.id === cid)!, ...convs.filter((c) => c.id !== cid)];
  emit();

  const list: ReturnType<typeof setTimeout>[] = [];
  timers.set(cid, list);
  const words = answer.text.split(' ');
  const start = reducedMotion ? 300 : 1100;
  list.push(setTimeout(() => patch(cid, pid, { steps: answer.steps, state: 'writing', text: reducedMotion ? answer.text : '' }), start));
  const step = 38;
  if (!reducedMotion) words.forEach((_, i) => list.push(setTimeout(() => patch(cid, pid, { text: words.slice(0, i + 1).join(' ') }), start + 250 + i * step)));
  list.push(setTimeout(() => { patch(cid, pid, { text: answer.text, blocks: answer.blocks, followUps: answer.followUps, state: 'done' }); timers.delete(cid); }, start + 300 + (reducedMotion ? 0 : words.length * step)));
  return cid;
}

/** Detiene la respuesta en curso y deja lo escrito hasta ahora. */
export function stopPacer(cid: string) {
  timers.get(cid)?.forEach(clearTimeout);
  timers.delete(cid);
  const c = getConversation(cid);
  const last = c?.messages[c.messages.length - 1];
  if (last && last.role === 'pacer' && last.state !== 'done') patch(cid, last.id, { state: 'done', text: last.text || 'Respuesta detenida.' });
}

export const isAnswering = (c: PacerConversation | null) => { const m = c?.messages[c.messages.length - 1]; return !!m && m.role === 'pacer' && m.state !== 'done'; };

/** Grupos del menú de conversaciones: Hoy, Ayer, Esta semana, Antes. */
export function groupConversations(list: PacerConversation[]) {
  const today = todayISO();
  const local = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const groups: { label: string; items: PacerConversation[] }[] = [{ label: 'Hoy', items: [] }, { label: 'Ayer', items: [] }, { label: 'Esta semana', items: [] }, { label: 'Antes', items: [] }];
  for (const c of [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    const d = local(c.updatedAt);
    const g = d === today ? 0 : d === addDays(today, -1) ? 1 : d >= addDays(today, -6) ? 2 : 3;
    groups[g].items.push(c);
  }
  return groups.filter((g) => g.items.length);
}
