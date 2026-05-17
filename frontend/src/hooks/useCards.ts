/**
 * Hydrates the card store from the REST endpoint. Components that just
 * want the list re-render via Zustand selectors; this hook only handles
 * the loading lifecycle.
 */

import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "../lib/api";
import { useStore } from "../state/store";

export function useCards(authed: boolean) {
  const setAll = useStore((s) => s.setAll);
  const hydrated = useStore((s) => s.hydrated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!authed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listCards();
      setAll(res.cards);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [authed, setAll]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loading, error, hydrated, refresh };
}
