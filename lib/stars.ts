// Converts avg top-5 pp to an approximate star rating for lobby difficulty matching.
// Calibrated: ~30pp→2.8★  ~100pp→3.7★  ~200pp→4.3★  ~332pp→5.0★  ~500pp→5.7★
export function ppToStars(pp: number): number {
  if (pp < 100) return 2.5 + pp * 0.012;
  if (pp < 200) return 3.7 + (pp - 100) * 0.008;
  return 4.5 + (pp - 200) * 0.004;
}

export function starRange(pp: number): string {
  const t = ppToStars(pp);
  return `${(t - 1.0).toFixed(1)}–${(t + 1.0).toFixed(1)}★`;
}
