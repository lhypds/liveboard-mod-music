/** A steady pulse kept on the audio clock. Page timers wander by tens of milliseconds, which is
 *  audible, so a short timer looks ahead and books every step that falls due before it next runs
 *  (Chris Wilson, "A Tale of Two Clocks"). A hidden tab runs timers about once a second, so it
 *  books further ahead there; steps booked past a stop are silenced by closing the channel they
 *  play on. */
export type Pulse = {
  stop: () => void;
  /** The latest booked step whose time has come, or -1 before the first. */
  sounding: () => number;
};

const LOOKAHEAD = 0.12;
const HIDDEN_LOOKAHEAD = 1.5;

export function startPulse(
  clock: { readonly currentTime: number },
  stepSeconds: () => number,
  onStep: (step: number, at: number) => void,
): Pulse {
  let step = 0;
  let next = clock.currentTime + 0.06;
  const booked: { step: number; at: number }[] = [];
  const book = () => {
    // After a stall (a sleeping laptop, a suspended context) the missed steps are skipped rather
    // than played all at once.
    if (next < clock.currentTime) next = clock.currentTime + 0.02;
    const hidden = typeof document !== "undefined" && document.hidden;
    const horizon = clock.currentTime + (hidden ? HIDDEN_LOOKAHEAD : LOOKAHEAD);
    while (next < horizon) {
      onStep(step, next);
      booked.push({ step, at: next });
      step += 1;
      // Read per step, so a tempo change lands on the next beat without a restart.
      next += stepSeconds();
    }
  };
  book();
  const timer = setInterval(book, 25);
  return {
    stop: () => clearInterval(timer),
    sounding: () => {
      const now = clock.currentTime;
      while (booked.length > 1 && booked[1].at <= now) booked.shift();
      return booked.length > 0 && booked[0].at <= now ? booked[0].step : -1;
    },
  };
}
