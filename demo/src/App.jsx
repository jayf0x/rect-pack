import { rectanglePacker } from 'rect-pack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

const PALETTE = ['#00e5c7', '#ff7a1a', '#4ea1ff', '#ffd23f', '#ff5c8a', '#7ce38b'];

const rand = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

function pack(count, minSize, maxSize) {
  const sizes = Array.from({ length: count }, () => ({
    width: rand(minSize, maxSize),
    height: rand(minSize, maxSize),
  }));
  const t0 = performance.now();
  const rects = rectanglePacker(sizes);
  const ms = performance.now() - t0;
  const binWidth = Math.max(...rects.map((r) => r.x + r.width));
  const binHeight = Math.max(...rects.map((r) => r.y + r.height));
  const used = rects.reduce((s, r) => s + r.width * r.height, 0);
  return { rects, binWidth, binHeight, ms, occupancy: (used / (binWidth * binHeight)) * 100 };
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-l border-line/60 pl-3">
      <span className="text-[10px] uppercase tracking-[0.18em] text-cyan/50">{label}</span>
      <span className="font-display text-lg font-semibold text-cyan tabular-nums">{value}</span>
    </div>
  );
}

function Slider({ label, value, min, max, onInput }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs">
      <span className="flex items-center justify-between uppercase tracking-[0.14em] text-[#7fa]">
        <span>{label}</span>
        <span className="text-cyan tabular-nums">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onInput={(e) => onInput(Number(e.currentTarget.value))}
      />
    </label>
  );
}

export function App() {
  const [count, setCount] = useState(22);
  const [minSize, setMinSize] = useState(20);
  const [maxSize, setMaxSize] = useState(130);
  const [result, setResult] = useState(() => pack(22, 20, 130));
  const [runId, setRunId] = useState(0);
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });

  const shuffle = useCallback(() => {
    setResult(pack(count, minSize, Math.max(maxSize, minSize)));
    setRunId((n) => n + 1);
  }, [count, minSize, maxSize]);

  useEffect(() => {
    shuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, minSize, maxSize]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        shuffle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shuffle]);

  const scale = useMemo(() => {
    const pad = 32;
    return Math.min((stageSize.w - pad) / result.binWidth, (stageSize.h - pad) / result.binHeight, 4);
  }, [stageSize, result]);

  return (
    <div className="grid-field relative min-h-screen">
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-bold tracking-wide text-white">
            rect<span className="text-cyan">‑</span>pack
          </h1>
          <span className="rounded-sm border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#7fa]">
            area‑fit packer
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-[#7fa]">
          <a
            className="transition-colors hover:text-cyan"
            href="https://github.com/jayf0x/rect-pack"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className="transition-colors hover:text-cyan"
            href="https://www.npmjs.com/package/rect-pack"
            target="_blank"
            rel="noreferrer"
          >
            npm ↗
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-6 border border-line bg-panel/80 p-5 backdrop-blur-sm lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm leading-relaxed text-[#9fc]">
            Drops <strong className="text-cyan">N</strong> random rectangles into the smallest bounding box the
            area‑fit algorithm can find. Tune the knobs, then pack again.
          </p>

          <div className="flex flex-col gap-4">
            <Slider label="Rectangles" value={count} min={3} max={60} onInput={setCount} />
            <Slider label="Min size" value={minSize} min={8} max={maxSize} onInput={setMinSize} />
            <Slider label="Max size" value={maxSize} min={minSize} max={220} onInput={setMaxSize} />
          </div>

          <button
            type="button"
            onClick={shuffle}
            className="group relative overflow-hidden border border-amber bg-amber/10 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.18em] text-amber transition-colors hover:bg-amber hover:text-ink"
          >
            Pack again
            <span className="ml-2 opacity-60 group-hover:opacity-90">⎵</span>
          </button>

          <div className="grid grid-cols-2 gap-y-4">
            <Stat label="Bin" value={`${result.binWidth}×${result.binHeight}`} />
            <Stat label="Fill" value={`${result.occupancy.toFixed(1)}%`} />
            <Stat label="Count" value={result.rects.length} />
            <Stat label="Pack time" value={`${result.ms.toFixed(2)}ms`} />
          </div>
        </aside>

        <section
          ref={stageRef}
          className="scanline relative min-h-[420px] overflow-hidden border border-line bg-panel/40"
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: result.binWidth * scale, height: result.binHeight * scale }}
          >
            <div className="pointer-events-none absolute -inset-px border border-cyan/40" />
            {result.rects.map((r, i) => (
              <div
                key={`${runId}-${i}`}
                className="rect-enter absolute flex items-end justify-start overflow-hidden border p-1 text-[9px] leading-none text-ink/70"
                style={{
                  left: r.x * scale,
                  top: r.y * scale,
                  width: r.width * scale,
                  height: r.height * scale,
                  background: `color-mix(in oklab, ${PALETTE[i % PALETTE.length]} 55%, transparent)`,
                  borderColor: PALETTE[i % PALETTE.length],
                  animationDelay: `${Math.min(i * 14, 500)}ms`,
                }}
                title={`${r.width} × ${r.height}`}
              >
                {r.width * scale > 26 && r.height * scale > 16 ? (
                  <span className="font-mono">
                    {r.width}×{r.height}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center text-[10px] uppercase tracking-[0.18em] text-[#567]">
        MIT licensed · zero dependencies · press space to repack
      </footer>
    </div>
  );
}
