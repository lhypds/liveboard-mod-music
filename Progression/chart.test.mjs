import assert from "node:assert/strict";
import { test } from "node:test";
import { PRESETS, beatsOf, isPlayable, parseChart, transposeChart } from "./chart.ts";

const layout = chart => chart.slots.map(slot => [slot.chord.symbol, slot.beats, slot.bar, slot.start]);

test("reads one bar per chord, or bars split by | that share their beats", () => {
  assert.deepEqual(layout(parseChart("C G Am F", 4)), [["C", 4, 0, 0], ["G", 4, 1, 0], ["Am", 4, 2, 0], ["F", 4, 3, 0]]);
  assert.deepEqual(layout(parseChart("| C G Am | F |", 4)), [["C", 2, 0, 0], ["G", 1, 0, 2], ["Am", 1, 0, 3], ["F", 4, 1, 0]]);
  assert.deepEqual(layout(parseChart("D A | Bm", 3)), [["D", 2, 0, 0], ["A", 1, 0, 2], ["Bm", 3, 1, 0]]);
  assert.deepEqual(parseChart("C H7 Xm", 4).invalid, ["H7", "Xm"]);
  assert.equal(parseChart("| C D E F G |", 4).crowded, true);
  assert.equal(isPlayable(parseChart("   ", 4)), false);
  assert.equal(isPlayable(parseChart("C H7", 4)), false);
  assert.equal(isPlayable(parseChart("C G", 4)), true);
});

test("a pass marks where chords and bars start", () => {
  const beats = beatsOf(parseChart("| C G | F |", 4).slots);
  assert.deepEqual(beats.map(beat => `${beat.slot}${beat.first ? "c" : ""}${beat.downbeat ? "b" : ""}`), ["0cb", "0", "1c", "1", "2cb", "2", "2", "2"]);
});

test("transposes with the usual key spellings and comes back", () => {
  assert.equal(transposeChart("C G Am F", 1), "Db Ab Bbm F#");
  assert.equal(transposeChart("Db Ab Bbm F#", -1), "C G Am F");
  assert.equal(transposeChart("| Am7 E7 | Bm7b5 |", 2), "| Bm7 F#7 | C#m7b5 |");
  assert.equal(transposeChart("B7 Caug", 1), "C7 Dbaug");
});

test("every preset is playable in 4/4", () => {
  for (const preset of PRESETS) assert.ok(isPlayable(parseChart(preset.text, 4)), preset.id);
});
