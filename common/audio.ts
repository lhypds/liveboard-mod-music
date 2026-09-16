/** Sound for the music cards through the Web Audio API: an additive struck-string tone for the
 *  piano, a Karplus-Strong plucked string for the guitar and a short tick for the metronome.
 *  Everything is synthesized, nothing is downloaded. */
export const frequency = (midi: number, a4 = 440) => a4 * 2 ** ((midi - 69) / 12);

/** Where a sound goes: the shared context and the node to connect to. */
export type Target = { ctx: AudioContext; out: AudioNode };
export type Channel = Target & { close: () => void };

let context: AudioContext | undefined;
let master: GainNode | undefined;

// Browsers only let audio start from a user gesture, so the context is created on the first click.
function output(): Target | undefined {
  if (typeof AudioContext === "undefined") return undefined;
  if (!context || !master) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.createDynamicsCompressor()).connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return { ctx: context, out: master };
}

/** The shared context, created or woken on first use. Call it from the click that starts a player:
 *  some browsers only let audio start inside the gesture itself. */
export function audioContext(): AudioContext | undefined {
  return output()?.ctx;
}

/** A gain stage of its own on the shared output, so one player can be cut off, notes it has
 *  already booked included, without touching another. */
export function openChannel(): Channel | undefined {
  const audio = output();
  if (!audio) return undefined;
  const { ctx } = audio;
  const gain = ctx.createGain();
  gain.connect(audio.out);
  return {
    ctx,
    out: gain,
    close: () => {
      // A short fade rather than a hard cut, which would click.
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      setTimeout(() => gain.disconnect(), 300);
    },
  };
}

/** A burst of noise circulating through a delay line, averaged on every pass so the highs fade
 *  first. The line is a whole number of samples, so the exact pitch comes from `rate`, the
 *  playbackRate that makes the buffer sound at `hz`. */
export function pluckedString(sampleRate: number, hz: number, seconds: number): { samples: Float32Array; rate: number } {
  const period = Math.max(2, Math.round(sampleRate / hz));
  const total = Math.floor(sampleRate * seconds);
  const samples = new Float32Array(total);
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  // Each slot is rewritten once per period, so the fade is set per pass round the line.
  const decay = 0.001 ** (period / total);
  for (let i = 0, at = 0; i < total; i++, at = (at + 1) % period) {
    samples[i] = ring[at];
    ring[at] = 0.5 * (ring[at] + ring[(at + 1) % period]) * decay;
  }
  return { samples, rate: (hz * period) / sampleRate };
}

function strike({ ctx, out }: Target, midi: number, at: number, seconds: number) {
  const hz = frequency(midi);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(1, at + 0.008);
  envelope.connect(out);
  // Stiff strings push the partials slightly sharp, and the upper ones die away sooner.
  const partials: [number, number][] = [[1, 1], [2, 0.5], [3, 0.25], [4, 0.12], [5, 0.06]];
  for (const [n, level] of partials) {
    const osc = ctx.createOscillator();
    osc.frequency.value = hz * n * Math.sqrt(1 + 0.0004 * n * n);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level * 0.2, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds / n ** 0.6);
    osc.connect(gain).connect(envelope);
    osc.start(at);
    osc.stop(at + seconds + 0.05);
  }
}

/** Sounds the notes together at `at`, with the slight roll of a hand landing on the keys. */
export function pianoChord(target: Target, midis: number[], at: number, seconds = 2.2) {
  midis.forEach((midi, i) => strike(target, midi, at + i * 0.012, seconds));
}

/** Plays the notes one after another, `gap` seconds apart. */
export function pianoMelody(target: Target, midis: number[], at: number, gap: number) {
  midis.forEach((midi, i) => strike(target, midi, at + i * gap, gap * 3));
}

/** Strums the strings at `at`, from the lowest given upward, pitched against `a4`. */
export function guitarStrum({ ctx, out }: Target, midis: number[], at: number, a4 = 440) {
  midis.forEach((midi, i) => {
    const { samples, rate } = pluckedString(ctx.sampleRate, frequency(midi, a4), 2.5);
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.getChannelData(0).set(samples);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    source.connect(gain).connect(out);
    source.start(at + i * 0.04);
  });
}

/** A short tick at `at`: level 2 for the first beat of a bar, 1 for any other beat, 0 between beats. */
export function click({ ctx, out }: Target, at: number, level: 0 | 1 | 2) {
  const osc = ctx.createOscillator();
  osc.frequency.value = [1100, 1600, 2200][level];
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime([0.3, 0.6, 0.9][level], at + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + 0.06);
}

/** Sounds the notes together now, as a block chord. */
export function playPiano(midis: number[]) {
  const audio = output();
  if (audio) pianoChord(audio, midis, audio.ctx.currentTime + 0.02);
}

/** Strums the strings now, from the lowest given upward. */
export function playGuitar(midis: number[], a4 = 440) {
  const audio = output();
  if (audio) guitarStrum(audio, midis, audio.ctx.currentTime + 0.02, a4);
}
