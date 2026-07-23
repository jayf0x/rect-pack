import { GridItem, Grid } from 'weighted-grid/react';
import { tintFor } from '../utils/colors.js';

const Cell = ({ i, label }) => (
  <div
    className="flex h-full w-full items-center justify-center rounded-md border border-black/[0.04] font-mono text-[11px] text-ink/40"
    style={{ background: tintFor(i) }}
  >
    {label ?? i}
  </div>
);

/** The default span grid: `cols`/`rows` give an item an exact span, plain `weight`-only items are
 * `weight`-sized squares, and `grid-auto-flow: dense` (the default `mode="pack"`) fills the gaps
 * around them. */
export function PinnedExample() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">span grid — exact cols/rows, mixed with weighted squares</h2>
      <div className="h-[220px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5">
        <Grid cols={6} gap={6} className="h-full w-full">
          <GridItem cols={3} rows={2}>
            <Cell i={0} label="cols=3 rows=2" />
          </GridItem>
          <GridItem cols={2}>
            <Cell i={1} label="cols=2" />
          </GridItem>
          {Array.from({ length: 7 }, (_, i) => (
            <GridItem key={i}>
              <Cell i={i + 2} />
            </GridItem>
          ))}
        </Grid>
      </div>
      <p className="text-[13px] leading-relaxed text-ink/40">
        The first two blocks pin their own size (<code className="font-mono text-ink/70">cols</code>/<code className="font-mono text-ink/70">rows</code>{' '}
        props); the rest are plain auto items filling in around them.
      </p>
    </section>
  );
}
