import assert from "node:assert/strict";
import { test } from "node:test";
import { detectPitch, median, nearestNote, nearestString } from "./pitch.ts";

const tone = (hz, sampleRate, size, harmonics = [1]) => Float32Array.from({ length: size }, (_, i) =>
  0.3 * harmonics.reduce((sum, level, k) => sum + level * Math.sin((2 * Math.PI * hz * (k + 1) * i) / sampleRate), 0));
const cents = (actual, expected) => Math.abs(1200 * Math.log2(actual / expected));

test("finds the pitch of pure tones across the guitar's range within a few cents", () => {
  for (const sampleRate of [44100, 48000]) for (const hz of [73.42, 82.41, 110, 196, 329.63, 440, 987.77]) {
    const found = detectPitch(tone(hz, sampleRate, 2048), sampleRate);
    assert.ok(found && cents(found.hz, hz) < 3, `${sampleRate} Hz sampling, ${hz} Hz → ${found?.hz}`);
    assert.ok(found.clarity > 0.9);
  }
});

test("reads a tone with strong overtones at its fundamental, not an octave up", () => {
  for (const hz of [82.41, 110, 246.94]) {
    const found = detectPitch(tone(hz, 48000, 2048, [1, 1, 0.6, 0.4, 0.3]), 48000);
    assert.ok(found && cents(found.hz, hz) < 5, `${hz} Hz → ${found?.hz}`);
  }
});

test("gives nothing for silence or noise", () => {
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  assert.equal(detectPitch(new Float32Array(2048), 48000), null);
  assert.equal(detectPitch(tone(440, 48000, 2048).map(v => v * 0.01), 48000), null);
  assert.equal(detectPitch(Float32Array.from({ length: 2048 }, random), 48000), null);
});

test("names the nearest note and string, with the offset in cents", () => {
  assert.deepEqual(nearestNote(440), { midi: 69, name: "A", octave: 4, cents: 0 });
  const sharp = nearestNote(446);
  assert.equal(sharp.name, "A");
  assert.ok(Math.abs(sharp.cents - 23.44) < 0.01);
  assert.equal(nearestNote(261.63).name + nearestNote(261.63).octave, "C4");
  assert.equal(nearestNote(82.41).name + nearestNote(82.41).octave, "E2");
  assert.equal(Math.round(nearestNote(432, 432).cents), 0);
  assert.deepEqual(nearestString(110), { string: 1, cents: 0 });
  const d = nearestString(150);
  assert.equal(d.string, 2);
  assert.ok(Math.abs(d.cents - 37) < 1);
  assert.equal(nearestString(330).string, 5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});
