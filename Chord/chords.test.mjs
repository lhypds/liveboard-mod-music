import assert from "node:assert/strict";
import { test } from "node:test";
import { ROOTS, QUALITIES, INTERVALS, TUNING, parseChord, chordNotes, guitarVoicings, pianoFingers, mod12 } from "./chords.ts";

test("normalizes common chord notation without confusing major and minor", () => {
  for (const [input, expected] of [[" c ", "C"], ["a minor", "Am"], ["F♯7", "F#7"], ["B♭maj7", "Bbmaj7"], ["CM7", "Cmaj7"], ["Cm7", "Cm7"], ["CΔ", "Cmaj7"], ["D°", "Ddim"]]) {
    assert.equal(parseChord(input)?.symbol, expected, input);
  }
  for (const input of ["", "H", "C/E", "C9", "hello", "C##", "C7junk", "Cconstructor"]) assert.equal(parseChord(input), null, input);
});

test("spells enharmonic notes by degree and keeps piano notes within the keyboard", () => {
  for (const [symbol, names] of [["C", ["C", "E", "G"]], ["Am", ["A", "C", "E"]], ["C#", ["C#", "E#", "G#"]], ["Bbmaj7", ["Bb", "D", "F", "A"]], ["Bdim", ["B", "D", "F"]], ["F#dim", ["F#", "A", "C"]]]) {
    assert.deepEqual(chordNotes(parseChord(symbol)).map(note => note.name), names);
  }
  for (const root of ROOTS) for (const quality of QUALITIES) {
    const notes = chordNotes(parseChord(root + quality));
    assert.ok(notes.every(note => note.midi >= 60 && note.midi <= 83));
    assert.equal(new Set(notes.map(note => note.midi)).size, notes.length);
  }
});

test("piano fingering gives every note a finger, thumb on the root and little finger on top, in rising order", () => {
  for (const root of ROOTS) for (const quality of QUALITIES) {
    const chord = parseChord(root + quality);
    const fingers = pianoFingers(chord);
    assert.equal(fingers.length, chordNotes(chord).length, chord.symbol);
    assert.equal(fingers[0], 1, chord.symbol);
    assert.equal(fingers.at(-1), 5, chord.symbol);
    assert.ok(fingers.every((finger, i) => i === 0 || finger > fingers[i - 1]), chord.symbol);
  }
});

test("every guitar voicing plays all and only the chord tones, with the root in the bass", () => {
  for (const root of [...ROOTS, "Cb", "B#", "E#", "Fb"]) for (const quality of QUALITIES) {
    const chord = parseChord(root + quality);
    const expected = new Set(INTERVALS[quality].map(interval => mod12(chord.pitch + interval)));
    const voicings = guitarVoicings(chord);
    assert.ok(voicings.length > 0, chord.symbol);
    for (const voicing of voicings) {
      const context = `${chord.symbol}: ${voicing.frets.join(" ")}`;
      const pitches = voicing.frets.flatMap((fret, i) => fret < 0 ? [] : [mod12(TUNING[i] + fret)]);
      assert.deepEqual(new Set(pitches), expected, context);
      assert.equal(pitches[0], chord.pitch, context);
      assert.equal(voicing.frets.length, 6);
      assert.equal(voicing.fingers.length, 6);
      const pressed = voicing.frets.filter(fret => fret > 0);
      assert.ok(Math.max(...pressed) - Math.min(...pressed) <= 3, context);
      assert.ok(Math.max(...pressed) <= 14, context);
      voicing.frets.forEach((fret, i) => {
        assert.ok(fret > 0 ? voicing.fingers[i] >= 1 && voicing.fingers[i] <= 4 : voicing.fingers[i] === 0, context);
      });
      for (let finger = 1; finger <= 4; finger++) {
        const strings = voicing.fingers.flatMap((value, i) => value === finger ? [i] : []);
        if (strings.length <= 1) continue;
        assert.equal(new Set(strings.map(i => voicing.frets[i])).size, 1, context);
        assert.ok(voicing.barres.some(barre => barre.finger === finger && barre.from <= strings[0] && barre.to >= strings.at(-1)), context);
      }
      for (const barre of voicing.barres) {
        for (let string = barre.from; string <= barre.to; string++) {
          assert.ok(voicing.frets[string] === -1 || voicing.frets[string] >= barre.fret, context);
        }
      }
    }
  }
});

test("familiar open chords come first and alternate fingerings are distinct", () => {
  assert.deepEqual(guitarVoicings(parseChord("C"))[0].frets, [-1, 3, 2, 0, 1, 0]);
  assert.deepEqual(guitarVoicings(parseChord("Am"))[0].frets, [-1, 0, 2, 2, 1, 0]);
  assert.deepEqual(guitarVoicings(parseChord("F"))[0].frets, [1, 3, 3, 2, 1, 1]);
  for (const root of ROOTS) for (const quality of QUALITIES) {
    const voicings = guitarVoicings(parseChord(root + quality));
    assert.equal(new Set(voicings.map(v => v.frets.join())).size, voicings.length);
  }
});
