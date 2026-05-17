/**
 * Sprint routes. Stubbed for v0+. The schema is in place (sprints +
 * sprint_cards in SQLite) so a v1 frontend can start writing immediately.
 *
 * Endpoints:
 *   GET  /api/sprints           -> list all sprints
 *   POST /api/sprints           -> create a sprint
 *   GET  /api/sprints/:id       -> sprint detail with assigned cards
 *   POST /api/sprints/:id/cards -> assign a card to a sprint
 */

import { Router, type Request, type Response } from "express";

import { getDb } from "../db/sqlite.js";

interface SprintRow {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  goal: string | null;
  created_at: string;
}

interface SprintCardRow {
  sprint_id: number;
  card_id: string;
  planned_points: number | null;
}

export function sprintsRouter(): Router {
  const router = Router();

  router.get("/sprints", (_req: Request, res: Response) => {
    const rows = getDb()
      .prepare(`SELECT id, name, starts_at, ends_at, goal, created_at FROM sprints ORDER BY starts_at DESC`)
      .all() as SprintRow[];
    res.json({ sprints: rows });
  });

  router.post("/sprints", (req: Request, res: Response) => {
    const body = req.body as
      | { name?: unknown; startsAt?: unknown; endsAt?: unknown; goal?: unknown }
      | undefined;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const startsAt = typeof body?.startsAt === "string" ? body.startsAt : "";
    const endsAt = typeof body?.endsAt === "string" ? body.endsAt : "";
    const goal = typeof body?.goal === "string" ? body.goal : null;
    if (!name || !startsAt || !endsAt) {
      res.status(400).json({ error: "name, startsAt, endsAt are required" });
      return;
    }
    const info = getDb()
      .prepare<[string, string, string, string | null]>(
        `INSERT INTO sprints (name, starts_at, ends_at, goal) VALUES (?, ?, ?, ?)`
      )
      .run(name, startsAt, endsAt, goal);
    res.status(201).json({ id: Number(info.lastInsertRowid) });
  });

  router.get("/sprints/:id", (req: Request, res: Response) => {
    const id = Number.parseInt(req.params["id"] ?? "", 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "bad id" });
      return;
    }
    const sprint = getDb()
      .prepare<[number]>(
        `SELECT id, name, starts_at, ends_at, goal, created_at FROM sprints WHERE id = ?`
      )
      .get(id) as SprintRow | undefined;
    if (!sprint) {
      res.status(404).json({ error: "no such sprint" });
      return;
    }
    const cards = getDb()
      .prepare<[number]>(
        `SELECT sprint_id, card_id, planned_points FROM sprint_cards WHERE sprint_id = ?`
      )
      .all(id) as SprintCardRow[];
    res.json({ sprint, cards });
  });

  router.post("/sprints/:id/cards", (req: Request, res: Response) => {
    const id = Number.parseInt(req.params["id"] ?? "", 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "bad sprint id" });
      return;
    }
    const body = req.body as { cardId?: unknown; plannedPoints?: unknown } | undefined;
    const cardId = typeof body?.cardId === "string" ? body.cardId : "";
    const plannedPoints =
      typeof body?.plannedPoints === "number" ? body.plannedPoints : null;
    if (!cardId) {
      res.status(400).json({ error: "cardId required" });
      return;
    }
    getDb()
      .prepare<[number, string, number | null]>(
        `INSERT OR REPLACE INTO sprint_cards (sprint_id, card_id, planned_points) VALUES (?, ?, ?)`
      )
      .run(id, cardId, plannedPoints);
    res.status(204).end();
  });

  return router;
}
