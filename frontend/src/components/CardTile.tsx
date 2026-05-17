import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { CardSummary } from "../lib/api";
import {
  cardBatch,
  cardExtendedThinking,
  cardModel,
  cardPinRequired,
  cardPoints,
  cardStakes,
  cardTitle,
} from "../lib/parseCard";
import { tierBadgeClass } from "../lib/tierBadge";

interface Props {
  card: CardSummary;
  onOpen: (id: string) => void;
}

/**
 * A single card on a column. Draggable via dnd-kit. Clicking opens the
 * detail modal. The tile is intentionally information-dense; the bigger
 * picture lives in the modal.
 */
export function CardTile({ card, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const title = cardTitle(card);
  const batch = cardBatch(card);
  const points = cardPoints(card);
  const extended = cardExtendedThinking(card);
  const stakes = cardStakes(card);
  const model = cardModel(card);
  const pin = cardPinRequired(card);
  // Tier badge: dark variant when extended thinking is on.
  const tierForBadge =
    typeof points === "number"
      ? extended
        ? Math.min(points + 0, 6) // keep simple; palette already has shades 1-6
        : points
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Don't open on drag-end-click; dnd-kit suppresses listeners during
        // drag but a quick click should still register.
        e.stopPropagation();
        onOpen(card.id);
      }}
      className="surface-2 p-2.5 cursor-pointer hover:border-accent transition-colors flex flex-col gap-1.5"
    >
      <div className="flex items-start gap-2">
        {typeof points === "number" ? (
          <span
            className={[
              "inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold text-bg",
              tierBadgeClass(tierForBadge),
            ].join(" ")}
            title={`tier ${points}${extended ? " (extended thinking)" : ""}`}
          >
            {points}
          </span>
        ) : null}
        <span className="text-xs text-text leading-snug flex-1">{title}</span>
        {pin ? (
          <span
            className="text-[10px] text-warn border border-warn/30 px-1 py-0.5 rounded"
            title="pin_required: human approval needed to merge"
          >
            pin
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted">
        <span className="font-mono">{card.id}</span>
        {batch ? <span>· {batch}</span> : null}
        {stakes ? <span>· {stakes}</span> : null}
      </div>
      {model ? (
        <div className="text-[10px] text-muted font-mono truncate" title={model}>
          {model}
          {extended ? " · thinking" : ""}
        </div>
      ) : null}
    </div>
  );
}
