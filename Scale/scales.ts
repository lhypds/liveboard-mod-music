import { parseChord, spellNote } from "../common/chords.ts";

export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
} satisfies Record<string, number[]>;
export type ScaleName = keyof typeof SCALES;
export const SCALE_NAMES = Object.keys(SCALES) as ScaleName[];

// The letter each note is written on, counted up from the root's letter. A seven-note scale uses
// every letter once; the blues scale writes its ♭5 on the fifth's letter.
const LETTERS: Partial<Record<ScaleName, number[]>> = {
  majorPentatonic: [0, 1, 2, 4, 5],
  minorPentatonic: [0, 2, 3, 4, 6],
  blues: [0, 2, 3, 4, 4, 6],
};

export type ScaleNote = { name: string; midi: number; degree: string };

/** The scale from its root up to the root an octave higher, starting in C4–B4, each note with its
 *  degree measured against the major scale (1 2 b3 …). */
export function scaleNotes(key: string, scale: ScaleName): ScaleNote[] {
  const root = parseChord(key);
  if (!root || root.quality !== "") return [];
  const letters = LETTERS[scale] ?? SCALES[scale].map((_, i) => i);
  const notes = SCALES[scale].map((step, i) => {
    const offset = step - SCALES.major[letters[i]];
    return {
      name: spellNote(root.root, root.pitch, step, letters[i]),
      midi: 60 + root.pitch + step,
      degree: (offset < 0 ? "b".repeat(-offset) : "#".repeat(offset)) + (letters[i] + 1),
    };
  });
  return [...notes, { ...notes[0], midi: notes[0].midi + 12 }];
}

/** Semitones from each note to the next, the last one back up to the octave. */
export function scaleSteps(scale: ScaleName): number[] {
  const steps = SCALES[scale];
  return steps.map((step, i) => (steps[i + 1] ?? 12) - step);
}

// Stacked thirds, named by their shape. mMaj7 and augMaj7 only turn up in the minor scales.
const SHAPES: Record<string, string> = {
  "0,4,7": "", "0,3,7": "m", "0,3,6": "dim", "0,4,8": "aug",
  "0,4,7,11": "maj7", "0,4,7,10": "7", "0,3,7,10": "m7", "0,3,6,10": "m7b5", "0,3,6,9": "dim7",
  "0,3,7,11": "mMaj7", "0,4,8,11": "augMaj7",
};
const MINOR_SHAPES = ["m", "dim", "m7", "m7b5", "dim7", "mMaj7"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
const MARKS: Record<string, string> = { "": "", m: "", dim: "°", aug: "+", maj7: "maj7", "7": "7", m7: "7", m7b5: "ø7", dim7: "°7", mMaj7: "(maj7)", augMaj7: "+maj7" };
const SYMBOLS: Record<string, string> = { mMaj7: "m(maj7)", augMaj7: "+maj7" };

export type ScaleChord = { numeral: string; symbol: string; midis: number[] };

/** The chord on each note of a seven-note scale, built from every other note of the scale: triads,
 *  or four-note chords with `sevenths`. Scales of other sizes have none. */
export function scaleChords(key: string, scale: ScaleName, sevenths: boolean): ScaleChord[] {
  const notes = scaleNotes(key, scale).slice(0, -1);
  if (notes.length !== 7) return [];
  return notes.map((note, degree) => {
    const midis = (sevenths ? [0, 2, 4, 6] : [0, 2, 4]).map(step => notes[(degree + step) % 7].midi + (degree + step >= 7 ? 12 : 0));
    const shape = SHAPES[midis.map(midi => midi - midis[0]).join()];
    const numeral = MINOR_SHAPES.includes(shape) ? ROMAN[degree].toLowerCase() : ROMAN[degree];
    return { numeral: numeral + MARKS[shape], symbol: note.name + (SYMBOLS[shape] ?? shape), midis };
  });
}
