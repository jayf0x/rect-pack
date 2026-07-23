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
      <Grid cols={5} height={20} gap={3}>
        <Wrapper>
          <GridItem weight={4}>wrapped</GridItem>
        </Wrapper>
        <GridItem weight={1}>plain</GridItem>
      </Grid>,
    );

    expect(html).toContain('wrapped<');
    expect(html).toContain('plain<');
    expect(html).toContain('grid-column:span 4');
    expect(html).toContain('grid-column:span 1');
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

  test("forwards each GridItem's children into its cell", () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} height={20} gap={3}>
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

    expect(html).toContain('grid-column:span 2;grid-row:span 2');
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

  test('mode="order" uses strict source order; default packs (dense back-fill)', () => {
    const packed = renderToStaticMarkup(
      <Grid cols={12}>
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );
    const strict = renderToStaticMarkup(
      <Grid cols={12} mode="order">
        <GridItem weight={1}>a</GridItem>
      </Grid>,
    );

    expect(packed).toContain('grid-auto-flow:row dense');
    expect(strict).toContain('grid-auto-flow:row');
    expect(strict).not.toContain('dense');
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
      <Grid cols={12}>
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

    // Two gradients (vertical + horizontal), sized by cols and rows.
    expect(html).toContain('background-size:calc(100% / 6) calc(100% / 4)');
    expect((html.match(/linear-gradient/g) ?? []).length).toBe(2);
  });

  test('mode="treemap" uses the fractional squarified engine', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} mode="treemap" height={20} gap={3}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
        <GridItem weight={4}>c</GridItem>
      </Grid>,
    );

    const widths = [...html.matchAll(/width:([\d.]+)%/g)].map((m) => Number(m[1]));
    expect(widths.length).toBeGreaterThan(0);
    // height = rowHeight * neededRows(3, cols=5, rows=7 default) = 20 * 7.
    expect(html).toContain('height:calc(20px * 7)');
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
