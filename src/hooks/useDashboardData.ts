import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Beispieleintraege } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [beispieleintraege, setBeispieleintraege] = useState<Beispieleintraege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [beispieleintraegeData] = await Promise.all([
        LivingAppsService.getBeispieleintraege(),
      ]);
      setBeispieleintraege(beispieleintraegeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [beispieleintraegeData] = await Promise.all([
          LivingAppsService.getBeispieleintraege(),
        ]);
        setBeispieleintraege(beispieleintraegeData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  return { beispieleintraege, setBeispieleintraege, loading, error, fetchAll };
}