export const ROOTS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
export const QUALITIES = ["", "m", "7", "maj7", "m7", "sus2", "sus4", "dim", "aug", "m7b5", "dim7"] as const;
export type Quality = typeof QUALITIES[number];
export type Chord = { root: string; pitch: number; quality: Quality; symbol: string };
export const INTERVALS: Record<Quality, number[]> = {
  "": [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10], maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6],
  aug: [0, 4, 8], m7b5: [0, 3, 6, 10], dim7: [0, 3, 6, 9],
};
export const NATURALS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const mod12 = (value: number) => ((value % 12) + 12) % 12;

export function parseChord(input: string): Chord | null {
  const clean = input.trim().replace(/♯/g, "#").replace(/♭/g, "b").replace(/\s+/g, "");
  const match = /^([a-g])([#b]?)(.*)$/i.exec(clean);
  if (!match) return null;
  const root = match[1].toUpperCase() + match[2];
  const aliases: Record<string, Quality> = {
    major: "", maj: "", minor: "m", min: "m", min7: "m7", "-": "m", "-7": "m7", "°": "dim",
    "+": "aug", "ø": "m7b5", "ø7": "m7b5", "m7-5": "m7b5", "-7b5": "m7b5", min7b5: "m7b5", "°7": "dim7",
  };
  // Uppercase M means major, so it must be handled before lowercasing.
  const suffix = match[3] === "M" ? "" : ["M7", "Δ7", "Δ"].includes(match[3]) ? "maj7" : match[3].toLowerCase();
  const quality = aliases[suffix] ?? suffix;
  if (!QUALITIES.includes(quality as Quality)) return null;
  const pitch = mod12(NATURALS[root[0]] + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0));
  return { root, pitch, quality: quality as Quality, symbol: root + quality };
}

/** Names the note `interval` semitones above `root`, written on the letter `degree` steps up from
 *  the root's letter, so C# major's third is E#, not F. */
export function spellNote(root: string, rootPitch: number, interval: number, degree: number): string {
  const letters = "CDEFGAB";
  const letter = letters[(letters.indexOf(root[0]) + degree) % 7];
  let accidental = mod12(rootPitch + interval - NATURALS[letter]);
  if (accidental > 6) accidental -= 12;
  return letter + (accidental >= 0 ? "#".repeat(accidental) : "b".repeat(-accidental));
}

/** Spell chord tones by their scale degrees (e.g. C# major is C# E# G#). */
export function chordNotes(chord: Chord): { name: string; midi: number }[] {
  const degrees = chord.quality === "sus2" ? [0, 1, 4] : chord.quality === "sus4" ? [0, 3, 4] : [0, 2, 4, 6];
  return INTERVALS[chord.quality].map((interval, index) => ({
    name: spellNote(chord.root, chord.pitch, interval, degrees[index]),
    midi: 60 + chord.pitch + interval,
  }));
}

/** Right-hand fingering for the root-position chord: thumb on the root, little finger on the top note. */
export function pianoFingers(chord: Chord): number[] {
  if (INTERVALS[chord.quality].length === 4) return [1, 2, 3, 5];
  return chord.quality === "sus4" ? [1, 4, 5] : chord.quality === "sus2" ? [1, 2, 5] : [1, 3, 5];
}

export type Voicing = {
  frets: number[]; // Low E to high E; -1 means muted.
  fingers: number[]; // 0 means open/muted, 1–4 are fretting fingers.
  barres: { fret: number; from: number; to: number; finger: number }[];
};
export const TUNING = [40, 45, 50, 55, 59, 64];
type Shape = { root: number; frets: number[]; fingers: number[]; barre?: [number, number] };
const A_SHAPES: Record<Quality, Shape> = {
  "": { root: 9, frets: [-1, 0, 2, 2, 2, -1], fingers: [0, 1, 2, 3, 4, 0] },
  m: { root: 9, frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1], barre: [1, 5] },
  "7": { root: 9, frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 1, 2, 1, 3, 1], barre: [1, 5] },
  maj7: { root: 9, frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1], barre: [1, 5] },
  m7: { root: 9, frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1], barre: [1, 5] },
  sus2: { root: 9, frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 1, 3, 4, 1, 1], barre: [1, 5] },
  sus4: { root: 9, frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 1, 2, 3, 4, 1], barre: [1, 5] },
  dim: { root: 9, frets: [-1, 0, 1, 2, 1, -1], fingers: [0, 1, 2, 4, 3, 0] },
  aug: { root: 9, frets: [-1, 0, 3, 2, 2, -1], fingers: [0, 1, 4, 2, 3, 0] },
  m7b5: { root: 9, frets: [-1, 0, 1, 0, 1, -1], fingers: [0, 1, 2, 1, 3, 0], barre: [1, 3] },
  // Root on the A string's first fret, so the open form is B♭dim7 and the lowest string under it is the G.
  dim7: { root: 10, frets: [-1, 1, 2, 0, 2, -1], fingers: [0, 2, 3, 1, 4, 0] },
};
const E_SHAPES: Partial<Record<Quality, Shape>> = {
  "": { root: 4, frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: [0, 5] },
  m: { root: 4, frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], barre: [0, 5] },
  "7": { root: 4, frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], barre: [0, 5] },
  maj7: { root: 4, frets: [0, -1, 1, 1, 0, -1], fingers: [1, 0, 3, 4, 2, 0] },
  m7: { root: 4, frets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], barre: [0, 5] },
  sus4: { root: 4, frets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1], barre: [0, 5] },
  dim: { root: 4, frets: [0, 1, 2, 0, -1, -1], fingers: [1, 2, 3, 1, 0, 0], barre: [0, 3] },
  // Root on the low E's first fret, with the fifth and seventh a fret lower on the B and D strings.
  m7b5: { root: 5, frets: [1, -1, 1, 1, 0, -1], fingers: [2, 0, 3, 4, 1, 0] },
  dim7: { root: 5, frets: [1, -1, 0, 1, 0, -1], fingers: [2, 0, 1, 3, 1, 0], barre: [2, 4] },
};
// Familiar open-position choices take priority over movable shapes.
const OPEN: Record<string, [number[], number[]]> = {
  C: [[-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0]],
  D: [[-1, -1, 0, 2, 3, 2], [0, 0, 0, 1, 3, 2]],
  E: [[0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0]],
  G: [[3, 2, 0, 0, 0, 3], [2, 1, 0, 0, 0, 3]],
  A: [[-1, 0, 2, 2, 2, 0], [0, 0, 1, 2, 3, 0]],
  Am: [[-1, 0, 2, 2, 1, 0], [0, 0, 2, 3, 1, 0]],
  Dm: [[-1, -1, 0, 2, 3, 1], [0, 0, 0, 2, 3, 1]],
  Em: [[0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0]],
  D7: [[-1, -1, 0, 2, 1, 2], [0, 0, 0, 2, 1, 3]],
  E7: [[0, 2, 0, 1, 0, 0], [0, 2, 0, 1, 0, 0]],
  G7: [[3, 2, 0, 0, 0, 1], [3, 2, 0, 0, 0, 1]],
  A7: [[-1, 0, 2, 0, 2, 0], [0, 0, 1, 0, 2, 0]],
  B7: [[-1, 2, 1, 2, 0, 2], [0, 2, 1, 3, 0, 4]],
  Cmaj7: [[-1, 3, 2, 0, 0, 0], [0, 3, 2, 0, 0, 0]],
  Dmaj7: [[-1, -1, 0, 2, 2, 2], [0, 0, 0, 1, 2, 3]],
  Emaj7: [[0, 2, 1, 1, 0, 0], [0, 3, 1, 2, 0, 0]],
  Gmaj7: [[3, 2, 0, 0, 0, 2], [3, 2, 0, 0, 0, 1]],
  Amaj7: [[-1, 0, 2, 1, 2, 0], [0, 0, 2, 1, 3, 0]],
  Am7: [[-1, 0, 2, 0, 1, 0], [0, 0, 2, 0, 1, 0]],
  Dm7: [[-1, -1, 0, 2, 1, 1], [0, 0, 0, 2, 1, 1]],
  Em7: [[0, 2, 0, 0, 0, 0], [0, 2, 0, 0, 0, 0]],
  Dsus2: [[-1, -1, 0, 2, 3, 0], [0, 0, 0, 1, 3, 0]],
  Dsus4: [[-1, -1, 0, 2, 3, 3], [0, 0, 0, 1, 3, 4]],
};

export function guitarVoicings(chord: Chord): Voicing[] {
  const shapes = [A_SHAPES[chord.quality], E_SHAPES[chord.quality]].filter((shape): shape is Shape => !!shape);
  const movable = shapes.map((shape): Voicing => {
    const offset = mod12(chord.pitch - shape.root);
    return {
      frets: shape.frets.map(fret => fret < 0 ? -1 : fret + offset),
      fingers: shape.fingers.map((finger, i) => shape.frets[i] < 0 || (offset === 0 && shape.frets[i] === 0) ? 0 : finger),
      barres: offset > 0 && shape.barre ? [{ fret: offset, from: shape.barre[0], to: shape.barre[1], finger: 1 }] : [],
    };
  }).sort((a, b) => Math.max(...a.frets) - Math.max(...b.frets));
  const natural = Object.keys(NATURALS).find(note => NATURALS[note] === chord.pitch);
  const open = natural ? OPEN[natural + chord.quality] : undefined;
  const result: Voicing[] = open ? [{ frets: open[0], fingers: open[1], barres: natural === "D" && chord.quality === "m7" ? [{ fret: 1, from: 4, to: 5, finger: 1 }] : [] }, ...movable] : movable;
  return result.filter((v, i) => result.findIndex(other => other.frets.join() === v.frets.join()) === i);
}
