export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-8 py-7">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-[26px] font-medium tracking-tight text-ink">weighted-grid</h1>
        <span className="text-[13px] text-ink/35">weighted grid for React</span>
      </div>
      <a
        className="text-[13px] text-ink/50 transition-colors hover:text-ink"
        href="https://github.com/jayf0x/weighted-grid"
        target="_blank"
        rel="noreferrer"
      >
        GitHub ↗
      </a>
    </header>
  );
}
