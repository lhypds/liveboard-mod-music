import assert from "node:assert/strict";
import { test } from "node:test";
import { SIGNATURES, SUBDIVISIONS, barPattern, clicksPerSquare, tappedBpm, tempoName } from "./beats.ts";

test("a bar accents its downbeat, subdivides quarter-note beats and groups eighths", () => {
  assert.deepEqual(barPattern("4/4", 1), [2, 1, 1, 1]);
  assert.deepEqual(barPattern("3/4", 2), [2, 0, 1, 0, 1, 0]);
  assert.deepEqual(barPattern("6/8", 1), [2, 0, 0, 1, 0, 0]);
  assert.deepEqual(barPattern("7/8", 1), [2, 0, 1, 0, 1, 0, 0]);
  assert.deepEqual(barPattern("12/8", 3), [2, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]);
  for (const signature of SIGNATURES) for (const subdivision of SUBDIVISIONS) {
    const pattern = barPattern(signature, subdivision);
    const top = Number(signature.split("/")[0]);
    assert.equal(pattern.length, top * clicksPerSquare(signature, subdivision), signature);
    assert.equal(pattern.filter(level => level === 2).length, 1, signature);
    assert.equal(pattern[0], 2, signature);
  }
});

test("tap tempo averages the latest gaps, starts over after a pause and stays in range", () => {
  assert.equal(tappedBpm([]), null);
  assert.equal(tappedBpm([0]), null);
  assert.equal(tappedBpm([0, 500, 1000, 1500]), 120);
  assert.equal(tappedBpm([0, 600, 5000, 5500, 6000]), 120);
  assert.equal(tappedBpm([0, 1900]), 32);
  assert.equal(tappedBpm([0, 100, 200]), 300);
});

test("tempo markings", () => {
  assert.equal(tempoName(30), "Grave");
  assert.equal(tempoName(60), "Larghetto");
  assert.equal(tempoName(100), "Andante");
  assert.equal(tempoName(120), "Allegro");
  assert.equal(tempoName(240), "Prestissimo");
});
