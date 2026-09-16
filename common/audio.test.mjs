import assert from "node:assert/strict";
import { test } from "node:test";
import { pluckedString } from "./audio.ts";

test("a plucked string repeats at its period, is pitched exactly by the playback rate, and dies away", () => {
  const sampleRate = 44100;
  const hz = 196; // G3
  const { samples, rate } = pluckedString(sampleRate, hz, 1.5);
  const period = Math.round(sampleRate / hz);
  assert.equal(samples.length, Math.floor(sampleRate * 1.5));
  assert.ok(Math.abs((rate * sampleRate) / period - hz) < 1e-6);

  // Once the noise burst has been averaged a few times, each period looks like the last.
  const start = 10 * period;
  let dot = 0, a = 0, b = 0;
  for (let i = start; i < start + 20 * period; i++) {
    dot += samples[i] * samples[i + period];
    a += samples[i] ** 2;
    b += samples[i + period] ** 2;
  }
  assert.ok(dot / Math.sqrt(a * b) > 0.9);

  const rms = (from, to) => Math.sqrt(samples.subarray(from, to).reduce((sum, v) => sum + v * v, 0) / (to - from));
  assert.ok(rms(samples.length - 2000, samples.length) < 0.05 * rms(start, start + 2000));
});
