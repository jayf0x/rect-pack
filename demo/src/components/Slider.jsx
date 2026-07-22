/** Labeled range input used by the control bar. */
export function Slider({ label, value, min, max, onInput }) {
  return (
    <label className="flex items-center gap-3 text-[13px] text-ink/60">
      <span className="w-20 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onInput={(e) => onInput(Number(e.currentTarget.value))}
        className="w-28"
      />
      <span className="w-6 shrink-0 text-right font-mono text-[13px] tabular-nums text-ink">{value}</span>
    </label>
  );
}
