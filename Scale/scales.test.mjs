import assert from "node:assert/strict";
import { test } from "node:test";
import { ROOTS, mod12 } from "../common/chords.ts";
import { SCALES, SCALE_NAMES, scaleChords, scaleNotes, scaleSteps } from "./scales.ts";

const pitchOf = name => mod12("C D EF G A B".indexOf(name[0]) + (name.match(/#/g)?.length ?? 0) - (name.match(/b/g)?.length ?? 0));

test("spells scales on their own letters, with degrees measured against the major scale", () => {
  const names = (key, scale) => scaleNotes(key, scale).map(note => note.name);
  assert.deepEqual(names("C", "major"), ["C", "D", "E", "F", "G", "A", "B", "C"]);
  assert.deepEqual(names("F#", "major"), ["F#", "G#", "A#", "B", "C#", "D#", "E#", "F#"]);
  assert.deepEqual(names("Eb", "minor"), ["Eb", "F", "Gb", "Ab", "Bb", "Cb", "Db", "Eb"]);
  assert.deepEqual(names("A", "harmonicMinor"), ["A", "B", "C", "D", "E", "F", "G#", "A"]);
  assert.deepEqual(names("A", "blues"), ["A", "C", "D", "Eb", "E", "G", "A"]);
  assert.deepEqual(names("E", "minorPentatonic"), ["E", "G", "A", "B", "D", "E"]);
  assert.deepEqual(scaleNotes("C", "dorian").map(note => note.degree), ["1", "2", "b3", "4", "5", "6", "b7", "1"]);
  assert.deepEqual(scaleNotes("C", "blues").map(note => note.degree), ["1", "b3", "4", "b5", "5", "b7", "1"]);
  assert.deepEqual(scaleSteps("major"), [2, 2, 1, 2, 2, 2, 1]);
  assert.deepEqual(scaleSteps("minorPentatonic"), [3, 2, 2, 3, 2]);
});

test("every scale in every key fits the keyboard, and each name spells its own pitch", () => {
  for (const key of ROOTS) for (const scale of SCALE_NAMES) {
    const notes = scaleNotes(key, scale);
    assert.equal(notes.length, SCALES[scale].length + 1, `${key} ${scale}`);
    for (const note of notes) {
      assert.ok(note.midi >= 60 && note.midi <= 83, `${key} ${scale}: ${note.midi}`);
      assert.equal(pitchOf(note.name), mod12(note.midi), `${key} ${scale}: ${note.name}`);
    }
    if (SCALES[scale].length === 7) assert.equal(new Set(notes.slice(0, 7).map(note => note.name[0])).size, 7, `${key} ${scale}`);
  }
});

test("chords in the key are named by their shape, with numerals cased by quality", () => {
  const symbols = (key, scale, sevenths) => scaleChords(key, scale, sevenths).map(chord => `${chord.numeral} ${chord.symbol}`);
  assert.deepEqual(symbols("C", "major", false), ["I C", "ii Dm", "iii Em", "IV F", "V G", "vi Am", "vii° Bdim"]);
  assert.deepEqual(symbols("C", "major", true), ["Imaj7 Cmaj7", "ii7 Dm7", "iii7 Em7", "IVmaj7 Fmaj7", "V7 G7", "vi7 Am7", "viiø7 Bm7b5"]);
  assert.deepEqual(symbols("A", "harmonicMinor", false), ["i Am", "ii° Bdim", "III+ Caug", "iv Dm", "V E", "VI F", "vii° G#dim"]);
  assert.equal(symbols("A", "harmonicMinor", true).at(-1), "vii°7 G#dim7");
  assert.equal(scaleChords("C", "blues", false).length, 0);
  for (const key of ROOTS) for (const scale of SCALE_NAMES) for (const sevenths of [false, true]) {
    for (const chord of scaleChords(key, scale, sevenths)) {
      assert.ok(!`${chord.numeral}${chord.symbol}`.includes("undefined"), `${key} ${scale} ${chord.symbol}`);
      assert.equal(chord.midis.length, sevenths ? 4 : 3);
    }
  }
});
