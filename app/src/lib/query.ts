import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from './api';

// Caché mínima «stale-while-revalidate»: se pinta al instante lo último que se sabe y se refresca por debajo.
// Una mutación llama a invalidateAll() y toda consulta montada vuelve a pedir sus datos.
const cache = new Map<string, unknown>();
let version = 0;
const listeners = new Set<() => void>();
export const invalidateAll = () => { version++; listeners.forEach((l) => l()); };
export const clearCache = () => { cache.clear(); invalidateAll(); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

type Result<T> = { path: string | null; data?: T; error?: Error };

export function useQuery<T>(path: string | null) {
  const v = useSyncExternalStore(subscribe, () => version);
  const [res, setRes] = useState<Result<T>>({ path: null });
  const [refreshing, setRefreshing] = useState(false);

  // Los datos pertenecen a su ruta: al cambiar de ruta (otra semana) se enseña lo cacheado de la nueva o nada,
  // nunca lo de la anterior.
  const fresh = res.path === path;
  const data = fresh && res.data !== undefined ? res.data : path ? (cache.get(path) as T | undefined) : undefined;
  const error = fresh ? res.error ?? null : null;

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const out = await api<T>(path);
      cache.set(path, out);
      setRes({ path, data: out });
    } catch (e) {
      setRes((prev) => ({ path, data: prev.path === path ? prev.data : undefined, error: e as Error }));
    }
  }, [path]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => { if (v > 0) void load(); }, [v, load]);

  const refresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  // Último resultado conocido aunque sea de otra ruta (otro periodo): permite mantenerlo, más tenue, mientras llega el nuevo.
  const kept = data ?? (res.data as T | undefined);
  return { data, kept, stale: data === undefined && kept !== undefined, error, refreshing, refresh, loading: !!path && data === undefined && !error };
}
