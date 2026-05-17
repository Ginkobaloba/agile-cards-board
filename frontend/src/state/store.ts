/**
 * Zustand store for the cards collection. Components subscribe to
 * narrow slices (cards by status, a single card, etc.) so a single
 * SSE event triggers minimal re-renders.
 *
 * Mutations come from two sources:
 *   1. REST: useCards.refresh() hydrates the whole list at boot.
 *   2. SSE:  useSSE() patches the store as events arrive.
 *
 * The store also tracks an optimistic "in-flight move" set so a card
 * that's mid-drag doesn't visually flicker back to the source column
 * if the SSE round-trip lands slower than the local UI update.
 */

import { create } from "zustand";

import type { CardSummary, StatusId } from "../lib/api";

interface State {
  cards: Record<string, CardSummary>;
  // ids currently being moved by this client. Used to suppress
  // server-side echoes while the optimistic update is in place.
  inFlight: Set<string>;
  hydrated: boolean;

  setAll: (cards: CardSummary[]) => void;
  upsert: (card: CardSummary) => void;
  remove: (id: string) => void;
  optimisticMove: (id: string, status: StatusId) => void;
  markInFlight: (id: string, on: boolean) => void;
}

export const useStore = create<State>((set) => ({
  cards: {},
  inFlight: new Set<string>(),
  hydrated: false,

  setAll: (cards) =>
    set(() => {
      const next: Record<string, CardSummary> = {};
      for (const c of cards) next[c.id] = c;
      return { cards: next, hydrated: true };
    }),

  upsert: (card) =>
    set((s) => ({ cards: { ...s.cards, [card.id]: card } })),

  remove: (id) =>
    set((s) => {
      if (!(id in s.cards)) return s;
      const next = { ...s.cards };
      delete next[id];
      return { cards: next };
    }),

  optimisticMove: (id, status) =>
    set((s) => {
      const existing = s.cards[id];
      if (!existing) return s;
      return {
        cards: { ...s.cards, [id]: { ...existing, status } },
      };
    }),

  markInFlight: (id, on) =>
    set((s) => {
      const next = new Set(s.inFlight);
      if (on) next.add(id);
      else next.delete(id);
      return { inFlight: next };
    }),
}));

export function selectCardsByStatus(
  state: State,
  status: StatusId
): CardSummary[] {
  const out: CardSummary[] = [];
  for (const c of Object.values(state.cards)) {
    if (c.status === status) out.push(c);
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}
