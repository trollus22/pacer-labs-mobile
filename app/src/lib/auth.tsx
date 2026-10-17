import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, setApiToken, setUnauthorizedHandler } from './api';
import { clearCache } from './query';
import { appleCredential, type AppleCredential } from './apple';
import { loadToken, saveToken } from './storage';
import type { Role, Team, TeamSummary, User } from './types';

type Me = { user: User; team: Team; teams?: TeamSummary[] };
type Auth = {
  status: 'loading' | 'out' | 'in';
  user: User | null;
  team: Team | null;
  /** Equipos del entrenador (el activo lleva `active`). Vacío para un atleta. */
  teams: TeamSummary[];
  /** Vuelve a pedir el perfil (tras cambiar de equipo o de deportes). */
  refreshMe: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; role: Role; inviteCode?: string; teamName?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  /** Entra con Apple. «needs_registration»: primera vez, falta elegir rol (se completa con `completeApple`). */
  signInWithApple: () => Promise<'done' | 'cancelled' | 'needs_registration'>;
  completeApple: (input: { role: Role; inviteCode?: string; teamName?: string }) => Promise<void>;
};

const Ctx = createContext<Auth | null>(null);
export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fuera de AuthProvider');
  return c;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Auth['status']>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const pendingApple = useRef<AppleCredential | null>(null);

  const finish = useCallback(async (token: string) => {
    setApiToken(token);
    await saveToken(token);
    setMe(await api<Me>('/me'));
    setStatus('in');
  }, []);

  const signOut = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST', body: {} }); } catch { /* da igual: se descarta el token local */ }
    setApiToken(null);
    await saveToken(null);
    clearCache();
    setMe(null);
    setStatus('out');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setApiToken(null); void saveToken(null); clearCache(); setMe(null); setStatus('out'); });
    (async () => {
      const token = await loadToken();
      if (!token) return setStatus('out');
      setApiToken(token);
      try { setMe(await api<Me>('/me')); setStatus('in'); } catch { setApiToken(null); setStatus('out'); }
    })();
  }, []);

  const value = useMemo<Auth>(() => ({
    status, user: me?.user ?? null, team: me?.team ?? null, teams: me?.teams ?? [], signOut,
    refreshMe: async () => { setMe(await api<Me>('/me')); },
    signIn: async (email, password) => { const r = await api<{ token: string }>('/auth/login', { method: 'POST', body: { email, password } }); await finish(r.token); },
    signInWithApple: async () => {
      const c = await appleCredential();
      if (!c) return 'cancelled';
      const r = await api<{ token?: string; status?: string }>('/auth/apple', { method: 'POST', body: { identityToken: c.identityToken, nonce: c.nonce, name: c.fullName } });
      if (r.token) { await finish(r.token); return 'done'; }
      pendingApple.current = c;
      return 'needs_registration';
    },
    completeApple: async (input) => {
      const c = pendingApple.current;
      if (!c) throw new Error('La sesión con Apple caducó. Vuelve a empezar.');
      const r = await api<{ token: string }>('/auth/apple', { method: 'POST', body: { identityToken: c.identityToken, nonce: c.nonce, name: c.fullName, ...input } });
      pendingApple.current = null;
      await finish(r.token);
    },
    register: async (input) => { const r = await api<{ token: string }>('/auth/register', { method: 'POST', body: input }); await finish(r.token); },
  }), [status, me, signOut, finish]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
