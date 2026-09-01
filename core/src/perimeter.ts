/**
 * The target perimeter: the one containment rule every province read obeys.
 * A cited path counts as inside only when it resolves both lexically and
 * through symlinks inside the target root — no reader crosses the perimeter
 * whatever the citation claims. A wholly fabricated path has no existing
 * parent, so containment is checked against the nearest existing ancestor:
 * nothing on such a path can be read, and the honest outcome is "escapes",
 * not a crash.
 * specs/permissions/spec.md; security hardening cfa1869, 23d012b.
 */
import { realpathSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

/**
 * Resolve a cited path inside the target root; undefined when it escapes
 * (a `..` segment, an in-target symlink pointing outside, or an absolute
 * path elsewhere on the machine).
 */
export function resolveInsideTarget(targetRoot: string, rel: string): string | undefined {
  const root = resolve(targetRoot);
  const abs = resolve(root, rel);
  if (abs !== root && !abs.startsWith(root + sep)) return undefined;
  // A symlink inside the target may point outside it — including the cited
  // file itself: compare real paths, so an anchor can never read through an
  // in-target link past the perimeter.
  const realRoot = realpathSync(root);
  let probe = abs;
  let realPath: string;
  for (;;) {
    try {
      realPath = realpathSync(probe);
      break;
    } catch {
      const parent = dirname(probe);
      if (parent === probe) {
        realPath = probe; // walked to the filesystem root unrealized: escape
        break;
      }
      probe = parent;
    }
  }
  if (realPath !== realRoot && !realPath.startsWith(realRoot + sep)) return undefined;
  return abs;
}
