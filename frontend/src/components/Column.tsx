import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import type { CardSummary, StatusId } from "../lib/api";
import { CardTile } from "./CardTile";

interface Props {
  id: StatusId;
  label: string;
  cards: CardSummary[];
  onOpenCard: (id: string) => void;
}

/**
 * A column of cards. Droppable via dnd-kit. Children are wrapped in a
 * SortableContext so each card is draggable.
 */
export function Column({ id, label, cards, onOpenCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex flex-col surface min-h-[calc(100vh-120px)]",
        isOver ? "border-accent" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold tracking-wide text-text uppercase">
          {label}
        </span>
        <span className="text-[11px] text-muted">{cards.length}</span>
      </div>
      <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="text-[11px] text-muted italic px-2 py-3">
              empty
            </div>
          ) : (
            cards.map((c) => (
              <CardTile key={c.id} card={c} onOpen={onOpenCard} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
