import { useSyncExternalStore } from 'react';
import { api, ApiError } from './api';
import { addDays, todayISO } from './dates';
import type { Dashboard, ReadinessStatus, TeamDashboard } from './types';
import type { Sport } from '@/theme';

// Pacey, el chat de IA. Las respuestas las genera el modelo de IA en el servidor (Groq) a partir de los datos reales del usuario y de lo que ha
// dejado su entrenador: la app solo manda el historial de la conversación a `/ai/chat`. Las conversaciones viven en memoria y se pierden al cerrar la app.

/** De qué parte de la app viene la pregunta. Da color y título a la conversación y orienta la respuesta. */
export type PacerTopic = 'recovery' | 'today' | 'week' | 'form' | 'team' | 'general';

/** Tarjeta de atletas: sale de los datos reales del equipo (la elige el modelo, pero los números los pone el servidor). */
export type PacerBlock = { type: 'athletes'; rows: { id: string; name: string; detail: string; score: number | null; status: ReadinessStatus }[] };

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
  /** La respuesta no llegó (sin conexión, IA no disponible…): `text` lleva el motivo. */
  error?: boolean;
};

export type PacerConversation = { id: string; title: string; topic: PacerTopic; updatedAt: string; messages: PacerMessage[] };

/** Datos de la app con los que se eligen las sugerencias de la pantalla de inicio (las respuestas las arma el servidor con sus propios datos). */
export type PacerFacts = { role: 'athlete' | 'coach'; name: string; me?: Dashboard; team?: TeamDashboard; workout?: { title: string; sport: Sport; zone: number; durationMin: number | null } };

// --- Almacén en memoria -------------------------------------------------------------------------------------------------

let convs: PacerConversation[] = [];
const listeners = new Set<() => void>();
const emit = () => { convs = [...convs]; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
let seq = 0;
const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;

export const usePacerConversations = () => useSyncExternalStore(subscribe, () => convs);
export const getConversation = (id: string | null | undefined) => (id ? convs.find((c) => c.id === id) ?? null : null);

export function deleteConversation(id: string) { convs = convs.filter((c) => c.id !== id); emit(); }

const done = (role: 'user' | 'pacer', text: string, at: string, extra?: Partial<PacerMessage>): PacerMessage => ({ id: uid(), role, text, at, state: 'done', ...extra });

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

// --- Enviar una pregunta -------------------------------------------------------------------------------------------------

const dropped = new Set<string>(); // respuestas que el usuario detuvo: si llegan tarde, se ignoran
const patch = (cid: string, mid: string, p: Partial<PacerMessage>) => {
  convs = convs.map((c) => (c.id !== cid ? c : { ...c, messages: c.messages.map((m) => (m.id === mid ? { ...m, ...p } : m)) }));
  emit();
};

const guessTopic = (q: string, fallback: PacerTopic): PacerTopic => {
  const s = q.toLowerCase();
  if (/equipo|atletas|quién|quien/.test(s)) return 'team';
  if (/recuper|descans|por qué estoy|cansad|dorm|sueño/.test(s)) return 'recovery';
  if (/hoy|series|enfoco|entreno de|calentamiento/.test(s)) return 'today';
  if (/semana|resume|carga/.test(s)) return 'week';
  if (/forma|mejorando|umbral|ritmo/.test(s)) return 'form';
  return fallback;
};

/** Título corto de la conversación a partir de la primera pregunta. */
const titleFrom = (q: string) => {
  const t = q.replace(/[¿?¡!«»]/g, '').trim();
  return t.length > 34 ? `${t.slice(0, 32).trimEnd()}…` : t.charAt(0).toUpperCase() + t.slice(1);
};

type ChatResponse = { text: string; steps: string[]; followUps: string[]; blocks: PacerBlock[]; model: string };

const failure = (e: unknown) => {
  if (e instanceof ApiError) return e.status === 0 ? 'No hay conexión. Revisa tu internet y vuelve a preguntar.' : e.message;
  return 'Pacey no ha podido responder. Inténtalo de nuevo.';
};

/** Envía una pregunta (crea la conversación si hace falta) a Pacey, que responde con IA real. Devuelve el id de la conversación. */
export function askPacer({ conversationId, question, topic = 'general' }: { conversationId?: string | null; question: string; topic?: PacerTopic }): string {
  const q = question.trim();
  const now = new Date().toISOString();
  let conv = getConversation(conversationId);
  const t = guessTopic(q, topic);
  if (!conv) { conv = { id: uid(), title: titleFrom(q), topic: t, updatedAt: now, messages: [] }; convs = [conv, ...convs]; }
  const cid = conv.id;
  // El historial que viaja al servidor: solo lo que se dijo de verdad (sin respuestas fallidas ni a medias).
  const history = [...conv.messages.filter((m) => m.state === 'done' && !m.error && m.text).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: q }];
  const pid = uid();
  convs = convs.map((c) => (c.id !== cid ? c : { ...c, updatedAt: now, messages: [...c.messages, done('user', q, now), { id: pid, role: 'pacer', at: now, text: '', state: 'thinking' }] }));
  // La conversación más reciente, arriba en el menú.
  convs = [convs.find((c) => c.id === cid)!, ...convs.filter((c) => c.id !== cid)];
  emit();

  api<ChatResponse>('/ai/chat', { method: 'POST', body: { messages: history, date: todayISO() } })
    .then((r) => { if (!dropped.delete(pid)) patch(cid, pid, { text: r.text, steps: r.steps, blocks: r.blocks, followUps: r.followUps, state: 'done' }); })
    .catch((e) => { if (!dropped.delete(pid)) patch(cid, pid, { text: failure(e), state: 'done', error: true }); });
  return cid;
}

/** Deja de esperar la respuesta en curso (si llega tarde, se ignora). */
export function stopPacer(cid: string) {
  const c = getConversation(cid);
  const last = c?.messages[c.messages.length - 1];
  if (last && last.role === 'pacer' && last.state !== 'done') { dropped.add(last.id); patch(cid, last.id, { state: 'done', text: 'Respuesta detenida.', error: true }); }
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
