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
            title={'height="fill" — stretches to fill'}
            caption="Rows split the container's height. Drag the bottom-right corner; it reflows with zero re-pack."
            blocks={blocks}
            cols={cols}
            height="fill"
          />
          <DemoPanel
            title="height={72} — flows down"
            caption="Same placement, but each row is a fixed 72px and the grid grows downward instead."
            blocks={blocks}
            cols={cols}
            height={72}
          />
        </div>

        <VanillaExample blocks={blocks} cols={cols} />
        <PinnedExample />
      </main>

      <footer className="px-8 pb-10 text-center text-[12px] text-ink/30">MIT · @weighted-grid/react</footer>
    </div>
  );
}
