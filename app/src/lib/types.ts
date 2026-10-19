import type { Sport } from '@/theme';

export type Role = 'coach' | 'athlete';
export type Status = 'planned' | 'done' | 'skipped';

export type User = { id: string; name: string; email: string; role: Role; teamId: string; sports: import('@/theme').Sport[]; hasPassword: boolean; hasApple: boolean };
export type TeamSummary = { id: string; name: string; inviteCode: string; athleteCount: number; active: boolean };
export type Team = { id: string; name: string; coach: { id: string; name: string } | null; inviteCode?: string };

export type WorkoutResult = {
  rpe: number | null; feeling: number | null; durationMin: number | null; distanceKm: number | null;
  note: string; completedAt: string;
};
export type Workout = {
  id: string; athleteId: string; athleteName: string; date: string; sport: Sport; title: string; description: string; items: SessionItem[]; sends: WatchSend[];
  durationMin: number | null; distanceKm: number | null; zone: number; status: Status; commentCount: number;
  result: WorkoutResult | null;
};
export type Comment = { id: string; userId: string; author: string; role: Role; body: string; createdAt: string };

export type AthleteAlert = 'missed' | 'high_rpe' | 'low_feeling' | 'low_readiness';
export type AiSummary = { text: string; model: string; generatedAt: string; cached: boolean };

export type AthleteSummary = {
  id: string; name: string; planned: number; done: number; skipped: number; missed: number;
  lastFeeling: number | null; lastRpe: number | null; alerts: AthleteAlert[]; readiness: ReadinessState;
  /** Notas 0–100 de los tres anillos de «Hoy». */
  rings: { effort: number | null; recovery: number | null; sleep: number | null };
};

// --- Recuperación, carga y dashboards (ver api/readiness.js) ---
export type ReadinessStatus = 'ready' | 'caution' | 'rest' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low' | 'none';
export type ReadinessState = { score: number | null; status: ReadinessStatus; confidence: Confidence };
export type Driver = { key: string; tone: 'good' | 'warn' | 'bad' | 'info'; text: string };

export type Checkin = {
  date: string; sleepHours: number; sleepQuality: number; soreness: number; stress: number; mood: number;
  restingHr: number | null; hrv: number | null; note: string; source: string;
};

export type DailyPoint = {
  date: string; load: number; acute: number; chronic: number; ratio: number | null; readiness: number | null;
  sleepHours: number | null; sleepQuality: number | null; sleepScore: number | null;
  sleepDeepMin: number | null; sleepLightMin: number | null; sleepRemMin: number | null; sleepAwakeMin: number | null; soreness: number | null; stress: number | null; mood: number | null;
  restingHr: number | null; hrv: number | null; rpe: number | null; feeling: number | null;
};
export type WeeklyPoint = { weekStart: string; planned: number; done: number; minutes: number; km: number; load: number; avgRpe: number | null };

export type Dashboard = {
  athlete: { id: string; name: string }; asOf: string; days: number;
  current: ReadinessState & {
    components: { wellness: number | null; load: number | null; subjective: number | null };
    drivers: Driver[]; checkinDate: string | null; lastCheckin: Checkin | null;
    stats: { acute: number; chronic: number; ratio: number | null; enough: boolean; streak: number; hard: number; weekLoad: number };
  };
  daily: DailyPoint[]; weekly: WeeklyPoint[]; zoneMinutes: number[]; runPace: { date: string; pace: number }[];
};

export type TeamDashboard = {
  asOf: string; days: number; counts: Record<ReadinessStatus, number>;
  athletes: { id: string; name: string; readiness: ReadinessState; drivers: Driver[]; ratio: number | null; weekLoad: number; lastCheckin: string | null; spark: (number | null)[] }[];
  team: { dailyLoad: { date: string; load: number }[]; weekly: { weekStart: string; planned: number; done: number; minutes: number }[] };
};

export type Suitability = 'good' | 'caution' | 'avoid' | 'unknown';
export type AthleteReco = {
  /** El propio entrenador (aparece el primero para planificarse entrenos a sí mismo). */
  self?: boolean;
  id: string; name: string; sports: Sport[]; readiness: ReadinessState; drivers: Driver[];
  level: Suitability | null; reasons: string[]; suggestion: string | null;
};
export type Template = { id: string; title: string; sport: import('@/theme').Sport; zone: number; durationMin: number | null; distanceKm: number | null; description: string; items: SessionItem[] };

export type WearableId = 'garmin' | 'zepp' | 'coros';
export type WearableProvider = {
  id: WearableId; name: string; mfa: boolean; data: string[]; note: string; disclosure: string;
  state: 'available' | 'connected' | 'reconnect'; lastSyncAt: string | null; lastError: string | null;
};
export type WearablesInfo = { configured: boolean; hasConnection: boolean; providers: WearableProvider[]; soon: { id: string; name: string; reason: string }[] };
export type WearableActivity = { id: string; provider: WearableId; providerName: string; sport: import('@/theme').Sport | null; sportRaw: string | null; durationMin: number; distanceKm: number | null; avgHr: number | null; calories: number | null };

// Biblioteca de ejercicios y sesiones prediseñadas (GET /exercises, solo entrenador).
export type ExerciseKind = 'reps' | 'time' | 'dist';
export type Exercise = { id: string; name: string; group: string; sports: Sport[]; kind: ExerciseKind; sets: number; qty: number; rest: number };
export type SessionItem = { exerciseId?: string | null; name: string; kind: ExerciseKind; sets: number | null; qty: number | null; rest: number | null; weightKg?: number | null; note: string };
export type Preset = { id: string; sport: Sport; title: string; zone: number; durationMin: number; distanceKm: number | null; items: (SessionItem & { exerciseId: string })[]; note: string };
export type WatchSend = { provider: WearableId; name: string; sentAt: string; mode: string | null };
export type WatchInfo = { supported: boolean; reason: string | null; configured: boolean; hasItems: boolean; providers: { id: WearableId; name: string; state: 'connected' | 'reconnect'; sentAt: string | null; mode: string | null }[] };
export type WatchResult = { status: 'sent'; provider: WearableId; providerName: string; mode: string; sent: number; skipped: { name: string; reason: string }[]; notes: string[]; scheduled: boolean; date: string };
