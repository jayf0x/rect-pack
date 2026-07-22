import { GridItem, GridPack } from 'weighted-grid/react';
import { Block } from './Block.jsx';

/** One labeled GridPack instance. Pass `fill` to switch between the two flows the library
 * offers — the caption below always explains what that prop does here. */
export function DemoPanel({ title, caption, blocks, cols, fill, rowHeight }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/45">{title}</h2>
      <div className="h-[380px] w-full overflow-auto rounded-lg border border-line bg-panel p-1.5" style={{ resize: fill ? 'vertical' : 'none' }}>
        <GridPack cols={cols} gap={6} fill={fill} rowHeight={rowHeight} className="h-full w-full">
          {blocks.map((b) => (
            <GridItem key={b.i} weight={b.weight}>
              <Block i={b.i} weight={b.weight} label={b.label} />
            </GridItem>
          ))}
        </GridPack>
      </div>
      <p className="text-[13px] leading-relaxed text-ink/40">{caption}</p>
    </section>
  );
}
