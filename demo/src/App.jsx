import { useMemo, useState } from 'react';
import { Header } from './components/Header.jsx';
import { Controls } from './components/Controls.jsx';
import { DemoPanel } from './components/DemoPanel.jsx';
import { PinnedExample } from './components/PinnedExample.jsx';
import { VanillaExample } from './components/VanillaExample.jsx';
import { buildBlocks } from './utils/blocks.js';

export function App() {
  const [count, setCount] = useState(20);
  const [cols, setCols] = useState(7);
  const [weights, setWeights] = useState({ A: 3, B: 5, C: 2 });
  const setWeight = (label, value) => setWeights((w) => ({ ...w, [label]: value }));

  const blocks = useMemo(() => buildBlocks(count, weights), [count, weights]);

  return (
    <div className="min-h-screen bg-page">
      <Header />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-8 pb-16">
        <Controls count={count} setCount={setCount} cols={cols} setCols={setCols} weights={weights} setWeight={setWeight} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DemoPanel
            title="fill — stretches to fill"
            caption="Rows are 1fr, so the grid fills the container's height exactly. Drag the bottom-right corner; it reflows with zero re-pack."
            blocks={blocks}
            cols={cols}
            fill
          />
          <DemoPanel
            title="fixed columns — flows down"
            caption="Same placement, but rows are a fixed height and the grid grows downward instead."
            blocks={blocks}
            cols={cols}
            fill={false}
            rowHeight={72}
          />
        </div>

        <VanillaExample blocks={blocks} cols={cols} />
        <PinnedExample />
      </main>

      <footer className="px-8 pb-10 text-center text-[12px] text-ink/30">MIT · @rect-pack/react</footer>
    </div>
  );
}
