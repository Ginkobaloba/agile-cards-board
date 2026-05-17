/**
 * Frontmatter parser + a targeted status-line rewriter.
 *
 * We use js-yaml for parsing the frontmatter block, but for *writing* we
 * deliberately do a regex replace of the `status:` line instead of
 * re-serializing the whole YAML. Reason: js-yaml will normalize quoting,
 * key order, comments, and number/string casts. The card files are
 * human-edited markdown; we don't want a status flip to rewrite comments
 * or reflow the block. A targeted line edit is the minimal, faithful
 * mutation.
 */

import yaml from "js-yaml";

export interface ParsedCard {
  readonly frontmatter: Record<string, unknown>;
  readonly body: string;
}

const FRONTMATTER_DELIM = "---";

export function parseFrontmatter(raw: string): ParsedCard {
  const text = raw.replace(/^﻿/, ""); // strip BOM if present
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || (lines[0] ?? "").trim() !== FRONTMATTER_DELIM) {
    return { frontmatter: {}, body: text };
  }

  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if ((lines[i] ?? "").trim() === FRONTMATTER_DELIM) {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return { frontmatter: {}, body: text };

  const fmText = lines.slice(1, endIdx).join("\n");
  const bodyText = lines.slice(endIdx + 1).join("\n");

  let parsed: unknown;
  try {
    parsed = yaml.load(fmText, { schema: yaml.JSON_SCHEMA });
  } catch {
    return { frontmatter: {}, body: text };
  }

  const fm =
    parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  return { frontmatter: fm, body: bodyText };
}

/**
 * Replace the `status:` line in the frontmatter block with a new value.
 * If there is no `status:` line, insert one right after the opening `---`.
 * Preserves trailing comments on the line so something like
 * `status: backlog   # waiting on approval` becomes
 * `status: active   # waiting on approval`.
 */
export function rewriteStatus(raw: string, newStatus: string): string {
  const re = /^(status\s*:\s*)([^\r\n#]*?)(\s*(?:#.*)?)$/m;
  if (re.test(raw)) {
    return raw.replace(re, (_match, prefix: string, _value: string, trailing: string) => {
      return `${prefix}${newStatus}${trailing}`;
    });
  }
  // No status line found. Insert one right after the opening fence.
  if (raw.startsWith("---\n")) {
    return raw.replace(/^---\n/, `---\nstatus: ${newStatus}\n`);
  }
  if (raw.startsWith("---\r\n")) {
    return raw.replace(/^---\r\n/, `---\r\nstatus: ${newStatus}\r\n`);
  }
  // Card has no frontmatter at all. Prepend one.
  return `---\nstatus: ${newStatus}\n---\n${raw}`;
}
