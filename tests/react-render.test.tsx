import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Grid, GridItem } from '../src/react';

// Regression test: a user reported <Grid> rendering empty, unweighted cells with a published
// version. Root-caused to their environment (see conversation), not this library — this pins
// down the actual contract so a real regression here fails loudly instead of shipping silently.
describe('Grid (SSR render)', () => {
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
