import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { startPulse } from "./pulse.ts";

const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} ≠ ${expected}`);

test("books steps ahead on the clock, takes a tempo change from the next step, and skips a stall", () => {
  mock.timers.enable({ apis: ["setInterval"] });
  try {
    const clock = { currentTime: 10 };
    let seconds = 0.5;
    const steps = [];
    const pulse = startPulse(clock, () => seconds, (step, at) => steps.push([step, at]));
    assert.equal(steps.length, 1);
    near(steps[0][1], 10.06, "first step");
    assert.equal(pulse.sounding(), -1);

    clock.currentTime = 10.5;
    mock.timers.tick(25);
    assert.equal(steps.length, 2);
    near(steps[1][1], 10.56, "second step");
    assert.equal(pulse.sounding(), 0);

    seconds = 0.25;
    clock.currentTime = 11;
    mock.timers.tick(25);
    clock.currentTime = 11.25;
    mock.timers.tick(25);
    assert.deepEqual(steps.map(([step]) => step), [0, 1, 2, 3]);
    near(steps[2][1], 11.06, "booked before the change");
    near(steps[3][1], 11.31, "after the change");
    assert.equal(pulse.sounding(), 2);

    clock.currentTime = 20;
    mock.timers.tick(25);
    assert.equal(steps.length, 5, "a stall books one step, not every missed one");
    near(steps[4][1], 20.02, "resumed step");

    pulse.stop();
    clock.currentTime = 30;
    mock.timers.tick(100);
    assert.equal(steps.length, 5);
  } finally {
    mock.timers.reset();
  }
});
