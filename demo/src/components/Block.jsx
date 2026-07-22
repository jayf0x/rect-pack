import { tintFor } from '../utils/colors.js';

/** One placed cell. `hero` renders in the accent color; everything else is a quiet neutral tint,
 * so the eye reads weight/area rather than color. */
export function Block({ i, weight, hero }) {
  if (hero) {
    return (
      <div className="rect-enter flex h-full w-full items-center justify-center rounded-md bg-accent text-sm font-medium tracking-tight text-white">
        {weight}×
      </div>
    );
  }
  return (
    <div
      className="rect-enter flex h-full w-full items-center justify-center rounded-md border border-black/[0.04] font-mono text-[11px] text-ink/40"
      style={{ background: tintFor(i), animationDelay: `${Math.min(i, 24) * 10}ms` }}
    >
      {i}
    </div>
  );
}
