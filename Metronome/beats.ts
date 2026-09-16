export const MIN_BPM = 30;
export const MAX_BPM = 300;
export const SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"] as const;
export type Signature = typeof SIGNATURES[number];
export const SUBDIVISIONS = [1, 2, 3, 4] as const;
export type Level = 0 | 1 | 2;

export const clampBpm = (bpm: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));

/** One bar of clicks and how hard each lands: 2 on the downbeat, 1 on each other beat, 0 between.
 *  In x/4 every beat is a quarter note that `subdivision` splits; in x/8 every click is an eighth,
 *  grouped in threes (twos and a closing three for 5/8 and 7/8), each group starting on a beat. */
export function barPattern(signature: Signature, subdivision: number): Level[] {
  const [top, bottom] = signature.split("/").map(Number);
  if (bottom === 8) {
    const groups = top % 3 === 0 ? Array<number>(top / 3).fill(3) : [...Array<number>((top - 3) / 2).fill(2), 3];
    return groups.flatMap((size, group) => Array.from({ length: size }, (_, i): Level => i > 0 ? 0 : group === 0 ? 2 : 1));
  }
  return Array.from({ length: top * subdivision }, (_, i): Level => i % subdivision ? 0 : i === 0 ? 2 : 1);
}

/** Clicks per lit square: each eighth of an x/8 bar has a square of its own, a subdivided x/4 beat shares one. */
export const clicksPerSquare = (signature: Signature, subdivision: number) => signature.endsWith("/8") ? 1 : subdivision;

const MARKINGS: [number, string][] = [
  [40, "Grave"], [60, "Largo"], [66, "Larghetto"], [76, "Adagio"], [108, "Andante"],
  [120, "Moderato"], [168, "Allegro"], [200, "Presto"], [Infinity, "Prestissimo"],
];

/** The Italian tempo marking a quarter-note tempo usually goes by. */
export const tempoName = (bpm: number) => MARKINGS.find(([below]) => bpm < below)![1];

/** The tempo of the latest taps, from the mean of up to four gaps; a pause of over two seconds starts the count over. */
export function tappedBpm(taps: number[]): number | null {
  const gaps: number[] = [];
  for (let i = taps.length - 1; i > 0 && gaps.length < 4; i--) {
    const gap = taps[i] - taps[i - 1];
    if (gap > 2000) break;
    gaps.push(gap);
  }
  if (!gaps.length) return null;
  return clampBpm(60000 / (gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length));
}
