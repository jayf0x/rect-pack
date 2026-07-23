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
      <Grid cols={5} rows={5} isFillHeight={false} rowHeight={20} gap={3}>
        <Wrapper>
          <GridItem weight={4}>wrapped</GridItem>
        </Wrapper>
        <GridItem weight={1}>plain</GridItem>
      </Grid>,
    );

    expect(html).toContain('wrapped<');
    expect(html).toContain('plain<');
    const widths = [...html.matchAll(/width:([\d.]+)%/g)].map((m) => Number(m[1]));
    expect(Math.max(...widths)).toBeGreaterThan(60);
  });

  // Regression: `mergeDefaults` briefly only walked `rest`'s own keys, so a prop that's simply
  // never passed (not just `prop={undefined}`) lost its default outright — `<Grid>` with no
  // props at all rendered `calc(undefined / 2)` padding and `calc(undefined * NaN)` height.
  test('a <Grid> with no props at all still gets every default', () => {
    const html = renderToStaticMarkup(
      <Grid>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );

    expect(html).not.toContain('undefined');
    expect(html).not.toContain('NaN');
    expect(html).toContain('calc(8px / 2)');
  });

  test('forwards each GridItem\'s children into its cell', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} rows={5} isFillHeight={false} rowHeight={20} gap={3}>
        <GridItem weight={1}>test_</GridItem>
        <GridItem weight={2}>test_s</GridItem>
        <GridItem weight={4}>test_ww</GridItem>
      </Grid>,
    );

    expect(html).toContain('test_<');
    expect(html).toContain('test_s<');
    expect(html).toContain('test_ww<');
  });

  test('cell widths are proportional to weight, not divided evenly', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} rows={5} isFillHeight={false} rowHeight={20} gap={3}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
        <GridItem weight={4}>c</GridItem>
      </Grid>,
    );

    // None of the cells should land on an even 1/3 split (the symptom reported when weight
    // isn't reaching the packer and every item falls back to the same default weight).
    const widths = [...html.matchAll(/width:([\d.]+)%/g)].map((m) => Number(m[1]));
    for (const w of widths) {
      expect(Math.abs(w - 100 / 3)).toBeGreaterThan(0.5);
    }
  });

  test('container height reflects rowHeight * neededRows, not a stray constant', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} rows={5} isFillHeight={false} rowHeight={20} gap={3}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
        <GridItem weight={4}>c</GridItem>
      </Grid>,
    );

    expect(html).toContain('height:calc(20px * 5)');
  });

  // Regression: `{ ...DEFAULTS, ...rest }` used to let an explicitly-passed `undefined` prop
  // clobber its default (e.g. `gap={cond ? 8 : undefined}`), producing broken CSS like
  // `calc(undefined / 2)` instead of falling back to the documented default.
  test('an explicitly-undefined prop falls back to its default instead of breaking the CSS', () => {
    const html = renderToStaticMarkup(
      <Grid cols={5} rows={5} gap={undefined} rowHeight={undefined} isFillHeight={undefined}>
        <GridItem weight={1}>a</GridItem>
        <GridItem weight={2}>b</GridItem>
      </Grid>,
    );

    expect(html).not.toContain('undefined');
    expect(html).toContain('calc(8px / 2)');
  });
});
