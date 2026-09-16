import { TUNING, mod12 } from "../common/chords.ts";

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** The pitch of a mono buffer, by the McLeod Pitch Method: how alike the signal is to itself at
 *  each lag, normalized so loud and quiet notes compare the same, then the first peak nearly as tall
 *  as the tallest, so a strong overtone is not read as the note. `clarity` is that peak's height,
 *  1 for a perfectly periodic signal. Null for silence, noise, or anything outside `minHz`–`maxHz`. */
export function detectPitch(buffer: Float32Array, sampleRate: number, minHz = 60, maxHz = 1400): { hz: number; clarity: number } | null {
  const size = buffer.length;
  let energy = 0;
  for (let i = 0; i < size; i++) energy += buffer[i] * buffer[i];
  if (Math.sqrt(energy / size) < 0.01) return null;
  const maxLag = Math.min(Math.ceil(sampleRate / minHz), Math.floor(size / 2) - 1);
  const minLag = Math.floor(sampleRate / maxHz);
  const nsdf = new Float64Array(maxLag + 2);
  for (let lag = 0; lag < nsdf.length; lag++) {
    let acf = 0;
    let norm = 0;
    for (let i = 0; i + lag < size; i++) {
      const a = buffer[i];
      const b = buffer[i + lag];
      acf += a * b;
      norm += a * a + b * b;
    }
    nsdf[lag] = norm > 0 ? (2 * acf) / norm : 0;
  }
  // Leave the lobe around lag 0, then keep the highest point of each positive lobe after it.
  let lag = 1;
  while (lag <= maxLag && nsdf[lag] > 0) lag++;
  const peaks: number[] = [];
  let best = -1;
  for (; lag <= maxLag; lag++) {
    if (nsdf[lag] > 0) {
      if (best < 0 || nsdf[lag] > nsdf[best]) best = lag;
    } else if (best >= 0) {
      peaks.push(best);
      best = -1;
    }
  }
  if (best >= 0) peaks.push(best);
  const candidates = peaks.filter(peak => peak >= minLag);
  if (!candidates.length) return null;
  const tallest = Math.max(...candidates.map(peak => nsdf[peak]));
  // A later peak as tall as the first is a whole number of periods, so the first one is the note.
  const peak = candidates.find(candidate => nsdf[candidate] >= 0.9 * tallest)!;
  // The true peak lies between samples: fit a parabola through the peak and its neighbours.
  const [a, b, c] = [nsdf[peak - 1], nsdf[peak], nsdf[peak + 1]];
  const curve = a - 2 * b + c;
  const shift = curve < 0 ? (a - c) / (2 * curve) : 0;
  const clarity = b - ((a - c) * shift) / 4;
  if (clarity < 0.8) return null;
  return { hz: sampleRate / (peak + shift), clarity };
}

/** Median of the latest readings, so one stray octave doesn't jolt the needle. */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export type Reading = { midi: number; name: string; octave: number; cents: number };

/** The equal-tempered note nearest `hz`, tuned to `a4`, and how far off it is in cents (−50 to +50). */
export function nearestNote(hz: number, a4 = 440): Reading {
  const exact = 69 + 12 * Math.log2(hz / a4);
  const midi = Math.round(exact);
  return { midi, name: NAMES[mod12(midi)], octave: Math.floor(midi / 12) - 1, cents: (exact - midi) * 100 };
}

/** The open string of a standard-tuned guitar nearest `hz`, and how far off it is in cents. */
export function nearestString(hz: number, a4 = 440): { string: number; cents: number } {
  const exact = 69 + 12 * Math.log2(hz / a4);
  let string = 0;
  TUNING.forEach((midi, i) => {
    if (Math.abs(exact - midi) < Math.abs(exact - TUNING[string])) string = i;
  });
  return { string, cents: (exact - TUNING[string]) * 100 };
}
