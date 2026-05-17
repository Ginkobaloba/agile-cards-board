/**
 * Placeholder for the sprint planner. The backend already has a sprints
 * table and routes; the UI just isn't wired yet. v1 will let you drag
 * cards from the backlog onto a sprint timeline, set start/end dates,
 * and see a points budget.
 */
export function SprintPlanner() {
  return (
    <div className="px-5 py-6">
      <div className="surface p-6 max-w-2xl">
        <h2 className="text-sm font-semibold text-text mb-2">
          Sprint Planner
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          v1 coming soon. The backend already speaks{" "}
          <code className="font-mono">GET/POST /api/sprints</code> and{" "}
          <code className="font-mono">POST /api/sprints/:id/cards</code>; this
          page will surface them as a draggable timeline with a points
          budget per sprint, pulled from the cards' <code>points</code>{" "}
          field.
        </p>
        <p className="text-xs text-muted leading-relaxed mt-2">
          Until then, use the Kanban view to move work.
        </p>
      </div>
    </div>
  );
}
