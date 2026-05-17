/**
 * Map a tier number (1-6) to a Tailwind background class. Mirrors the
 * v0 palette: light shade = no extended thinking, dark = extended.
 */

const CLASSES: Record<number, string> = {
  1: "bg-tier-1",
  2: "bg-tier-2",
  3: "bg-tier-3",
  4: "bg-tier-4",
  5: "bg-tier-5",
  6: "bg-tier-6",
};

export function tierBadgeClass(tier: number | null | undefined): string {
  if (typeof tier !== "number") return "bg-panel2";
  return CLASSES[tier] ?? "bg-panel2";
}

export function tierLabel(
  fm: Record<string, unknown>
): { tier: number | null; model: string | null } {
  const tier =
    typeof fm["points"] === "number" ? (fm["points"] as number) : null;
  const model = typeof fm["model"] === "string" ? (fm["model"] as string) : null;
  return { tier, model };
}
