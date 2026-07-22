/** Neutral tint per index — a quiet grayscale sequence so weight/size reads clearly without
 * rainbow noise. The hero block gets the accent color instead (set in Block.jsx). */
export function tintFor(i) {
  const steps = [96, 90, 84, 92, 88, 94];
  return `oklch(${steps[i % steps.length]}% 0.006 250)`;
}
