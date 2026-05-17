import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";

import { CardModal } from "../components/CardModal";
import { Column } from "../components/Column";
import { api, ApiError, type Column as ColumnDef, type StatusId } from "../lib/api";
import { selectCardsByStatus, useStore } from "../state/store";

const COLUMN_FALLBACK: ColumnDef[] = [
  { id: "backlog", label: "Backlog" },
  { id: "active", label: "Active" },
  { id: "awaiting_amendment_review", label: "Awaiting Amendment Review" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
];

interface Props {
  loading: boolean;
  error: string | null;
}

/**
 * The kanban. Columns come from the API so the backend stays the source
 * of truth for what statuses exist; we keep a fallback list so the page
 * renders even if /api/columns hiccups.
 */
export function Kanban({ loading, error }: Props) {
  const cards = useStore((s) => s.cards);
  const optimisticMove = useStore((s) => s.optimisticMove);
  const markInFlight = useStore((s) => s.markInFlight);

  const [columns, setColumns] = useState<ColumnDef[]>(COLUMN_FALLBACK);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .listColumns()
      .then((r) => setColumns(r.columns))
      .catch(() => {
        /* fallback is fine */
      });
  }, []);

  const cardsByStatus = useMemo(() => {
    const acc: Record<StatusId, ReturnType<typeof selectCardsByStatus>> = {
      backlog: [],
      active: [],
      awaiting_amendment_review: [],
      done: [],
      blocked: [],
    };
    for (const c of Object.values(cards)) {
      acc[c.status].push(c);
    }
    for (const k of Object.keys(acc) as StatusId[]) {
      acc[k].sort((a, b) => a.id.localeCompare(b.id));
    }
    return acc;
  }, [cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const onDragEnd = async (e: DragEndEvent): Promise<void> => {
    if (!e.over) return;
    const cardId = String(e.active.id);
    const targetStatus = e.over.id as StatusId;
    if (!isStatusId(targetStatus)) return;

    const card = cards[cardId];
    if (!card || card.status === targetStatus) return;

    // Optimistic UI: move the card in the store immediately, then call
    // the API. SSE will echo back the canonical state; the store
    // reconciles by id.
    optimisticMove(cardId, targetStatus);
    markInFlight(cardId, true);
    try {
      await api.moveCard(cardId, targetStatus);
      setMoveError(null);
    } catch (err) {
      // Roll back. Refetching the canonical card is the safest path; we
      // could also flip the store back to `card.status`, but the API
      // round-trip removes any ambiguity if the failure was partial.
      try {
        const fresh = await api.getCard(cardId);
        useStore.getState().upsert(fresh);
      } catch {
        optimisticMove(cardId, card.status);
      }
      setMoveError(err instanceof ApiError ? err.message : String(err));
    } finally {
      markInFlight(cardId, false);
    }
  };

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      {loading ? (
        <div className="text-xs text-muted">loading cards…</div>
      ) : null}
      {error ? <div className="text-xs text-danger">{error}</div> : null}
      {moveError ? (
        <div className="text-xs text-danger">move failed: {moveError}</div>
      ) : null}

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`,
          }}
        >
          {columns.map((c) => (
            <Column
              key={c.id}
              id={c.id}
              label={c.label}
              cards={cardsByStatus[c.id] ?? []}
              onOpenCard={(id) => setOpenCard(id)}
            />
          ))}
        </div>
      </DndContext>

      <CardModal cardId={openCard} onClose={() => setOpenCard(null)} />
    </div>
  );
}

function isStatusId(v: unknown): v is StatusId {
  return (
    v === "backlog" ||
    v === "active" ||
    v === "awaiting_amendment_review" ||
    v === "done" ||
    v === "blocked"
  );
}
