import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Grid, GridItem } from '../src/react';

// Regression: a user reported <Grid> rendering empty, unweighted cells with a dev-only profiler
// (Million Lint) enabled, which wraps every JSX element in an instrumentation component —
// `<GridItem>` arrived one level down inside `props.children` instead of reaching `Grid` directly.
// `asGridItems` looks one level deep for a real GridItem before giving up.
const Wrapper = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const colSpans = (html: string) =>
  [...html.matchAll(/grid-column:\d+ \/ span (\d+)/g)].map((m) => Number(m[1]));

describe('Grid (SSR render)', () => {
  test('finds a GridItem wrapped one level deep, emits explicit line-based placement', () => {
    const html = renderToStaticMarkup(
      <Grid cols={12} fill="none" height={20} gap={3}>
        <Wrapper>
          <GridItem weight={4}>wrapped</GridItem>
        </Wrapper>
        <GridItem weight={1}>plain</GridItem>
      </Grid>,
    );

    expect(html).toContain('wrapped<');
    expect(html).toContain('plain<');
    // Explicit `{start} / span {n}`, never bare `span n` — the grid owns placement.
    expect(html).toContain('grid-column:1 / span 4');
    expect(html).not.toContain('grid-column:span');
  });

  test('a <Grid> with no props at all still gets every default', () => {
    const html = renderToStaticMarkup(
      <Grid>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );

    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
    expect(html).toContain('gap:8px');
  });

  test('weight sizes both axes; cols/rows override per-axis', () => {
    const html = renderToStaticMarkup(
      <Grid cols={12} fill="none">
        <GridItem weight={2}>square</GridItem>
        <GridItem cols={4} rows={2}>wide</GridItem>
      </Grid>,
    );

    expect(html).toContain('grid-column:1 / span 2;grid-row:1 / span 2');
    expect(html).toContain('grid-column:3 / span 4;grid-row:1 / span 2');
  });

  test('fill="none" leaves raw source-order spans (no growth)', () => {
    const html = renderToStaticMarkup(
      <Grid cols={12} fill="none">
        <GridItem weight={2}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );
    expect(colSpans(html)).toEqual([2, 2]);
  });

  test('fill="stretch" (default) grows weight-only items into the dead columns', () => {
    // Two 2-wide elastic items in 12 cols: raw leaves 8 trailing dead cells; stretch fills the row.
    const html = renderToStaticMarkup(
      <Grid cols={12} stretch={Infinity}>
        <GridItem weight={2}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );
    expect(html).toContain('grid-column:1 / span'); // first item pinned to line 1
    expect(colSpans(html).reduce((a, b) => a + b, 0)).toBe(12); // no dead columns
  });

  test('strict items (explicit cols/rows) never stretch; only weight items fill', () => {
    const html = renderToStaticMarkup(
      <Grid cols={12} stretch={Infinity}>
        <GridItem cols={2} rows={1}>fixed</GridItem>
        <GridItem weight={1}>elastic</GridItem>
      </Grid>,
    );
    // The fixed 2×1 keeps its span at line 1; the elastic item absorbs the remaining 10 columns.
    expect(html).toContain('grid-column:1 / span 2');
    expect(colSpans(html)).toContain(10);
  });

  test('fill="component" renders renderEmpty in every empty cell', () => {
    const html = renderToStaticMarkup(
      <Grid cols={4} rows={2} fill="component" renderEmpty={<i>VOID</i>}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    // 4×2 = 8 cells, one covered by `a` → 7 empty cells each holding the placeholder.
    expect(html).toContain('a<');
    expect(html).toContain('aria-hidden');
    expect((html.match(/VOID/g) ?? []).length).toBe(7);
  });

  test('rows always draws row tracks — height="fill" splits, fixed height reserves', () => {
    const fill = renderToStaticMarkup(
      <Grid cols={4} rows={3}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    const fixed = renderToStaticMarkup(
      <Grid cols={4} rows={3} height={40}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );

    expect(fill).toContain('grid-template-rows:repeat(3, minmax(0, 1fr))');
    expect(fill).toContain('height:100%');
    expect(fixed).toContain('grid-template-rows:repeat(3, 40px)');
  });

  test('omitting rows auto-fills height: exactly the occupied rows stretch (1fr)', () => {
    // 14 one-cell items in 12 columns occupy 2 rows — both stretch to fill, no guessed count.
    const html = renderToStaticMarkup(
      <Grid cols={12} fill="none">
        {Array.from({ length: 14 }, (_, i) => (
          <GridItem key={i} weight={1}>
            {`i${i}`}
          </GridItem>
        ))}
      </Grid>,
    );

    expect(html).toContain('grid-template-rows:repeat(2, minmax(0, 1fr))');
    expect(html).toContain('height:100%');
  });

  test('isGridVisible draws both column and row guide lines', () => {
    const html = renderToStaticMarkup(
      <Grid cols={6} rows={4} isGridVisible>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );

    expect(html).toContain('background-size:calc(100% / 6) calc(100% / 4)');
    expect((html.match(/linear-gradient/g) ?? []).length).toBe(2);
  });

  // Regression: an explicitly-passed `undefined` prop must fall back to its default, not clobber it.
  test('an explicitly-undefined prop falls back to its default instead of breaking the CSS', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} gap={undefined} height={undefined}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );

    expect(html).not.toContain('undefined');
    expect(html).toContain('gap:8px');
  });
});
