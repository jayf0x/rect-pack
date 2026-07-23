import { layoutGrid } from 'weighted-grid';
import { tintFor } from '../utils/colors.js';

/**
 * `weighted-grid/react`'s `<Grid>` is one opinionated way to render `layoutGrid`'s output — it isn't
 * required. This renders the same placements with plain absolutely-positioned `<div>`s and no
 * import from `weighted-grid/react`, to make it obvious the package only computes `{ id, x, y, w, h }`
 * fractions; everything visual (color, border, gap, animation) is the caller's own CSS.
 */
export function VanillaExample({ blocks, cols }) {
  const placements = layoutGrid(
    blocks.map((b) => ({ id: b.i, weight: b.weight })),
    { cols },
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">bare-bones — layoutGrid only, no React wrapper</h2>
      <div className="relative h-[380px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {placements.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                width: `${p.w * 100}%`,
                height: `${p.h * 100}%`,
                padding: 3,
                boxSizing: 'border-box',
              }}
            >
              <div
                className="flex h-full w-full items-center justify-center rounded-md border border-black/[0.04] font-mono text-[11px] text-ink/40"
                style={{ background: tintFor(p.id) }}
              >
                {p.id}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-ink/40">
        Same <code className="font-mono text-ink/70">blocks</code>/<code className="font-mono text-ink/70">cols</code> as above, placed with{' '}
        <code className="font-mono text-ink/70">layoutGrid()</code> directly and rendered by hand — the library never touches the DOM.
      </p>
    </section>
  );
}
