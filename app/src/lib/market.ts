import type { ReadinessState } from './types';
import type { Sport } from '@/theme';

// Mercado de entrenadores (api/market.js). Los pagos son simulados: no se cobra nada todavía.

export type MarketPlan = { id: string; kind: 'monthly' | 'plus' | 'block'; title: string; price: number; weeks: number | null; features: string[]; featured: boolean };
export type MarketCoach = {
  id: string; name: string; initials: string; tone: string; headline: string; city: string; modes: string[]; sports: Sport[]; tags: string[];
  verified: boolean; responseHours: number; rating: number | null; reviewCount: number; priceFrom: number | null; spotsLeft: number; accepting: boolean; athletes: number;
};
export type RatingSummary = { avg: number | null; count: number; aspects: { planning: number | null; care: number | null; results: number | null }; stars: number[] };
export type MarketReview = {
  id: string; author: string; initials: string; kind: 'athlete' | 'event'; months: number | null; rating: number; planning: number | null; care: number | null; results: number | null;
  body: string; progress: string | null; sport: Sport | null; reply: string | null; helpful: number; createdAt: string;
};
export type MarketEvent = {
  id: string; coachId: string; coachName: string; coachInitials: string; coachTone: string; kind: 'group' | 'clinic' | 'trail' | 'test'; sport: Sport;
  title: string; description: string; date: string; start: string; end: string; place: string; city: string; distanceKm: number | null;
  capacity: number; signups: number; spotsLeft: number; price: number; freeForAthletes: boolean; open: boolean; tags: string[]; paceGroups: string[];
  session: string; zone: number; durationMin: number; myPrice: number; isCoachAthlete: boolean;
  ticket: { no: number; paceGroup: string; paid: number; checkedIn: boolean; workoutId: string | null } | null;
};
export type MarketEventDetail = MarketEvent & { known: number; coachRating: number | null; coachEventsPerMonth: number; attendees: { initials: string }[]; coachHeadline: string };
export type MarketCoachDetail = MarketCoach & {
  bio: string; years: number | null; certification: string; languages: string[]; plans: MarketPlan[]; rating: RatingSummary;
  results: { completion: number | null; improvement: string | null; measured: boolean }; reviews: MarketReview[]; events: MarketEvent[];
  isMyCoach: boolean; request: { id: string; status: 'pending' | 'accepted' } | null; canReview: boolean;
};
export type MarketMe = {
  hasCoach: boolean; coachCount: number; upcomingEvents: number;
  requests: { id: string; status: 'pending' | 'accepted'; coachId: string; coachName: string; planTitle: string; price: number }[];
  tickets: { eventId: string; title: string; date: string; start: string; place: string; coachName: string; no: number }[];
  toRate: null | {
    eventId: string; title: string; date: string; coachId: string; coachName: string; coachInitials: string; isCoachAthlete: boolean;
    workout: { status: string; title: string; durationMin: number | null; distanceKm: number | null; rpe: number | null } | null;
  };
};
export type CoachRequest = {
  id: string; athleteId: string; athleteName: string; initials: string; planTitle: string; price: number; createdAt: string;
  goal: { goal?: string; race?: string; raceDate?: string | null; best?: string; days?: number | null; note?: string }; share: { wellness?: boolean; workouts?: boolean; notes?: boolean };
  readiness: ReadinessState | null;
};
export type CoachDashboard = {
  profile: { visible: boolean; accepting: boolean; capacity: number; used: number; tone: string; verified: boolean }; fee: number; demo: boolean;
  month: { key: string; net: number; gross: number; prevNet: number; prevToDate: number; change: number | null; plans: number; events: number };
  monthly: { month: string; net: number; gross: number; plans: number; events: number }[]; mrr: number; mrrNet: number; subscribers: number;
  athletes: { id: string; name: string; initials: string; plan: string; price: number; since: string; nextCharge: string | null; readiness: ReadinessState | null; completion: number | null; goal: { goal?: string } }[];
  requests: CoachRequest[]; events: (MarketEvent & { net: number })[]; pastEvents: { id: string; title: string; date: string; signups: number; capacity: number }[];
  reviews: MarketReview[]; rating: RatingSummary;
  payments: { id: string; kind: 'plan' | 'event'; description: string; athlete: string | null; amount: number; net: number; paidAt: string }[];
};
export type CoachMarketProfile = {
  id: string; name: string; initials: string; tone: string; headline: string; bio: string; city: string; sports: Sport[]; tags: string[]; years: number | null;
  certification: string; verified: boolean; visible: boolean; accepting: boolean; capacity: number; used: number; payouts: boolean; fee: number; plans: MarketPlan[];
  rating: RatingSummary; steps: { verified: boolean; payouts: boolean; plans: boolean; presentation: boolean };
};
export type CoachEventDetail = MarketEvent & {
  attendees: { userId: string; name: string; initials: string; paceGroup: string; paid: number; ticket: number; checkedIn: boolean; isMine: boolean; readiness: ReadinessState | null }[];
  newCount: number; gross: number; net: number;
};

/** «59 €», «10,20 €». */
export const eur = (v: number) => `${Number.isInteger(v) ? v.toLocaleString('es-ES') : v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
/** «4,9» */
export const dec1 = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(1).replace('.', ','));
export const EVENT_KIND: Record<MarketEvent['kind'], string> = { group: 'Entreno en grupo', clinic: 'Clínic / charla', trail: 'Salida de trail', test: 'Test de nivel' };
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
export const monthShort = (iso: string) => MONTHS[Number(iso.slice(5, 7)) - 1];
export const dayNum = (iso: string) => Number(iso.slice(8, 10));
