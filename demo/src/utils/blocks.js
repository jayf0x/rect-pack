/** Builds the fixed demo dataset: one "hero" block plus a mix of weight-1/weight-2 filler. */
export function buildBlocks(count, heroWeight) {
  return Array.from({ length: count }, (_, i) => ({
    i,
    weight: i === 0 ? heroWeight : i % 6 === 0 ? 2 : 1,
  }));
}
