import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Grid, GridItem } from '../src/react';

// Regression: a user reported <Grid> rendering empty, unweighted cells with a dev-only profiler
// (Million Lint) enabled, which wraps every JSX element in an instrumentation component —
// `<GridItem>` arrived one level down inside `props.children` instead of reaching `Grid` directly.
// `asGridItems` looks one level deep for a real GridItem before giving up.
const Wrapper = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

describe('Grid (SSR render)', () => {
  test('finds a GridItem wrapped one level deep by another component', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} isFillHeight={false} rowHeight={20} gap={3}>
        <Wrapper>
          <GridItem weight={4}>wrapped</GridItem>
        </Wrapper>
        <GridItem weight={1}>plain</GridItem>
      </Grid>,
    );

    expect(html).toContain('wrapped<');
    expect(html).toContain('plain<');
    // The unwrapped item keeps its weight: a weight-4 item spans 4 columns.
    expect(html).toContain('grid-column:span 4');
    expect(html).toContain('grid-column:span 1');
  });

  // Regression: `mergeDefaults` briefly only walked `rest`'s own keys, so a prop that's simply
  // never passed (not just `prop={undefined}`) lost its default outright.
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

  test("forwards each GridItem's children into its cell", () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} isFillHeight={false} rowHeight={20} gap={3}>
        <GridItem weight={1}>test_</GridItem>
        <GridItem weight={2}>test_s</GridItem>
        <GridItem weight={4}>test_ww</GridItem>
      </Grid>,
    );

    expect(html).toContain('test_<');
    expect(html).toContain('test_s<');
    expect(html).toContain('test_ww<');
  });

  test('weight sizes both axes; cols/rows override per-axis', () => {
    const html = renderToStaticMarkup(
      <Grid cols={12}>
        <GridItem weight={2}>square</GridItem>
        <GridItem cols={4} rows={2}>wide</GridItem>
      </Grid>,
    );

    // weight 2 → a 2×2 square.
    expect(html).toContain('grid-column:span 2;grid-row:span 2');
    // explicit spans win.
    expect(html).toContain('grid-column:span 4;grid-row:span 2');
  });

  test('isEmpty reserves span but renders inert negative space (no gridcell, no content)', () => {
    const html = renderToStaticMarkup(
      <Grid cols={12}>
        <GridItem cols={3} rows={2} isEmpty />
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );

    expect(html).toContain('aria-hidden');
    expect(html).toContain('grid-column:span 3;grid-row:span 2');
  });

  test('isPacked=false uses strict source order (no dense back-fill)', () => {
    const packed = renderToStaticMarkup(
      <Grid cols={12}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    const strict = renderToStaticMarkup(
      <Grid cols={12} isPacked={false}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );

    expect(packed).toContain('grid-auto-flow:row dense');
    expect(strict).toContain('grid-auto-flow:row');
    expect(strict).not.toContain('dense');
  });

  test('isTreemap opt-in uses the fractional squarified engine', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} isTreemap isFillHeight={false} rowHeight={20} gap={3}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
        <GridItem weight={4}>c</GridItem>
      </Grid>,
    );

    // Fractional percentage boxes, and container height = rowHeight * neededRows.
    const widths = [...html.matchAll(/width:([\d.]+)%/g)].map((m) => Number(m[1]));
    expect(widths.length).toBeGreaterThan(0);
    expect(html).toContain('height:calc(20px * 7)');
  });

  // Regression: an explicitly-passed `undefined` prop must fall back to its default, not clobber it.
  test('an explicitly-undefined prop falls back to its default instead of breaking the CSS', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} gap={undefined} rowHeight={undefined} isFillHeight={undefined}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );

    expect(html).not.toContain('undefined');
    expect(html).toContain('gap:8px');
  });
});
