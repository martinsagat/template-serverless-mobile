/**
 * Compare two semver-ish dotted versions (e.g. "2.3.0" vs "2.10.1").
 * Returns -1 if a < b, 0 if equal, 1 if a > b. Non-numeric segments are
 * treated as 0. Tolerant of missing segments and "v" prefixes.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (s: string) =>
    s
      .replace(/^v/i, '')
      .split('.')
      .map((seg) => Number.parseInt(seg, 10) || 0);
  const left = parse(a);
  const right = parse(b);
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i++) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    if (l < r) return -1;
    if (l > r) return 1;
  }
  return 0;
}
