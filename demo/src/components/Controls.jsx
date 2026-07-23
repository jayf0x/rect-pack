import { Slider } from './Slider.jsx';

/** The single control bar driving both demo panels below it. Three labeled blocks (A/B/C, spread
 * across the list) each get their own weight slider — makes it easy to see that changing one
 * item's weight resizes it in place instead of reshuffling everything around it. */
export function Controls({ count, setCount, cols, setCols, weights, setWeight }) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-line bg-white px-5 py-4">
      <Slider label="Items" value={count} min={3} max={60} onInput={setCount} />
      <Slider label="Columns" value={cols} min={1} max={12} onInput={setCols} />
      <Slider label="Weight A" value={weights.A} min={1} max={20} onInput={(v) => setWeight('A', v)} />
      <Slider label="Weight B" value={weights.B} min={1} max={20} onInput={(v) => setWeight('B', v)} />
      <Slider label="Weight C" value={weights.C} min={1} max={20} onInput={(v) => setWeight('C', v)} />
      <p className="text-[13px] text-ink/40">
        Same blocks in both panels — only the <code className="font-mono text-ink/70">height</code> prop differs.
      </p>
    </div>
  );
}
