import { mod12, parseChord } from "../common/chords.ts";
import type { Chord } from "../common/chords.ts";

/** One chord of a chart: the beats it holds, its bar, and the beat of that bar it starts on. */
export type Slot = { chord: Chord; beats: number; bar: number; start: number };
export type Chart = { slots: Slot[]; invalid: string[]; crowded: boolean };

/** Reads a chord chart. Bars are split by `|`, and the chords in one bar share its beats, the earlier
 *  ones taking any left over (`C G Am` in 4/4 is 2 + 1 + 1). Without a `|`, each chord is a bar. */
export function parseChart(text: string, beatsPerBar: number): Chart {
  const bars = text.includes("|") ? text.split("|") : text.trim().split(/\s+/);
  const slots: Slot[] = [];
  const invalid: string[] = [];
  let crowded = false;
  let bar = 0;
  for (const cell of bars) {
    const tokens = cell.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    if (tokens.length > beatsPerBar) crowded = true;
    let start = 0;
    tokens.forEach((token, i) => {
      const chord = parseChord(token);
      const beats = Math.floor(beatsPerBar / tokens.length) + (i < beatsPerBar % tokens.length ? 1 : 0);
      if (!chord) invalid.push(token);
      else if (beats > 0) slots.push({ chord, beats, bar, start });
      start += beats;
    });
    bar += 1;
  }
  return { slots, invalid, crowded };
}

export const isPlayable = (chart: Chart) => chart.slots.length > 0 && chart.invalid.length === 0 && !chart.crowded;

export type Beat = { slot: number; inBar: number; first: boolean; downbeat: boolean };

/** Every beat of one pass through the chart: the slot sounding, which beat of its bar it is, and
 *  whether a chord or a bar starts there. */
export function beatsOf(slots: Slot[]): Beat[] {
  return slots.flatMap((slot, i) => Array.from({ length: slot.beats }, (_, beat) => ({
    slot: i, inBar: slot.start + beat, first: beat === 0, downbeat: slot.start + beat === 0,
  })));
}

const MAJOR_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const MINOR_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];

/** The chord moved by `semitones`, its root spelled the way that key is usually written: D♭ and A♭
 *  for major chords, C♯ and G♯ for minor ones. */
export function transposeChord(chord: Chord, semitones: number): string {
  const minor = ["m", "m7", "dim", "m7b5", "dim7"].includes(chord.quality);
  return (minor ? MINOR_NAMES : MAJOR_NAMES)[mod12(chord.pitch + semitones)] + chord.quality;
}

/** Transposes every chord of a chart, keeping its bar lines and spacing. */
export function transposeChart(text: string, semitones: number): string {
  return text.replace(/[^\s|]+/g, token => {
    const chord = parseChord(token);
    return chord ? transposeChord(chord, semitones) : token;
  });
}

export const PRESETS = [
  { id: "pop", text: "C G Am F" },
  { id: "fifties", text: "C Am F G" },
  { id: "jazz", text: "Dm7 G7 Cmaj7 Cmaj7" },
  { id: "minorJazz", text: "Bm7b5 E7 Am Am" },
  { id: "canon", text: "D A | Bm F#m | G D | G A" },
  { id: "andalusian", text: "Am G F E" },
  { id: "blues", text: "A7 D7 A7 A7 D7 D7 A7 A7 E7 D7 A7 E7" },
] as const;
export type PresetId = typeof PRESETS[number]["id"];
