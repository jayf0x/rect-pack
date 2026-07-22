import { Slider } from './Slider.jsx';

/** The single control bar driving both demo panels below it. */
export function Controls({ count, setCount, cols, setCols, heroWeight, setHeroWeight }) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-line bg-white px-5 py-4">
      <Slider label="Items" value={count} min={2} max={60} onInput={setCount} />
      <Slider label="Columns" value={cols} min={1} max={12} onInput={setCols} />
      <Slider label="Hero weight" value={heroWeight} min={1} max={20} onInput={setHeroWeight} />
      <p className="text-[13px] text-ink/40">
        Same blocks in both panels — only the <code className="font-mono text-ink/70">fill</code> prop differs.
      </p>
    </div>
  );
}
