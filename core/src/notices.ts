/**
 * Notices to Mariners: the plain-text change report an expedition leaves
 * behind. Derived by diffing the previous index against the new one —
 * added / corrected / marked stale / retired — each notice carrying the
 * entry's anchors. Deterministic output, suitable for git diff review.
 */
import { formatAnchor, type IndexedEntry, type Notice, type NoticeAction } from "./types";

/** Fields that carry chart state, not surveyed content. */
const META_FIELDS = new Set(["stale", "signature"]);

function contentChangedFields(before: IndexedEntry, after: IndexedEntry): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (META_FIELDS.has(key)) continue;
    if (JSON.stringify(before[key as keyof IndexedEntry]) !== JSON.stringify(after[key as keyof IndexedEntry])) {
      changed.push(key);
    }
  }
  return changed.sort();
}

/**
 * Diff two chart states into notices.
 *
 * - present after only → added
 * - present before only → retired
 * - fresh → stale → marked stale (pending correction)
 * - content changed, or stale → fresh (a repair) → corrected
 */
export function diffNotices(before: IndexedEntry[], after: IndexedEntry[]): Notice[] {
  const beforeByKey = new Map(before.map((e) => [`${e.kind}/${e.id}`, e]));
  const afterByKey = new Map(after.map((e) => [`${e.kind}/${e.id}`, e]));
  const notices: Notice[] = [];

  for (const [key, entry] of afterByKey) {
    const prior = beforeByKey.get(key);
    if (!prior) {
      notices.push({ action: "added", kind: entry.kind, id: entry.id, anchors: entry.anchors });
      continue;
    }
    const changedFields = contentChangedFields(prior, entry);
    const staleCleared = prior.stale && !entry.stale;
    const staleSet = !prior.stale && entry.stale;
    if (staleSet) {
      notices.push({
        action: "markedStale",
        kind: entry.kind,
        id: entry.id,
        note: "sources changed since the last survey",
        anchors: entry.anchors,
      });
    } else if (changedFields.length > 0 || staleCleared) {
      const parts: string[] = [];
      if (changedFields.length > 0) parts.push(`changed: ${changedFields.join(", ")}`);
      if (staleCleared) parts.push("repaired (was pending correction)");
      notices.push({
        action: "corrected",
        kind: entry.kind,
        id: entry.id,
        note: parts.join("; "),
        anchors: entry.anchors,
      });
    }
  }

  for (const [key, entry] of beforeByKey) {
    if (!afterByKey.has(key)) {
      notices.push({ action: "retired", kind: entry.kind, id: entry.id, anchors: entry.anchors });
    }
  }

  return sortNotices(notices);
}

const ACTION_ORDER: NoticeAction[] = ["added", "corrected", "markedStale", "retired"];

function sortNotices(notices: Notice[]): Notice[] {
  return [...notices].sort((a, b) => {
    const rank = ACTION_ORDER.indexOf(a.action) - ACTION_ORDER.indexOf(b.action);
    if (rank !== 0) return rank;
    const ka = `${a.kind}/${a.id}`;
    const kb = `${b.kind}/${b.id}`;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

const LABELS: Record<NoticeAction, string> = {
  added: "ADDED",
  corrected: "CORRECTED",
  markedStale: "MARKED STALE",
  retired: "RETIRED",
};

/**
 * Render notices as plain text:
 *
 *   NOTICES TO MARINERS
 *
 *   MARKED STALE  vessel/web — sources changed since the last survey
 *                 anchor: services/web/main.ts:1
 */
export function renderNotices(notices: Notice[]): string {
  if (notices.length === 0) return "";
  const pad = " ".repeat(14);
  const lines: string[] = ["NOTICES TO MARINERS", ""];
  for (const notice of notices) {
    const label = LABELS[notice.action].padEnd(14);
    const head = `${notice.kind}/${notice.id}${notice.note ? ` — ${notice.note}` : ""}`;
    lines.push(`${label}${head}`);
    for (const anchor of notice.anchors) {
      lines.push(`${pad}anchor: ${formatAnchor(anchor)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}
