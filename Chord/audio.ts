/** Chord playback through the Web Audio API: an additive struck-string tone for the piano and a
 *  Karplus-Strong plucked string for the guitar. Everything is synthesized, nothing is downloaded. */
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

let context: AudioContext | undefined;
let master: GainNode | undefined;

// Browsers only let audio start from a user gesture, so the context is created on the first click.
function output(): { ctx: AudioContext; out: AudioNode } | undefined {
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

function strike(ctx: AudioContext, out: AudioNode, midi: number, at: number, seconds: number) {
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

/** Sounds the notes together, with the slight roll of a hand landing on the keys. */
export function playPiano(midis: number[]) {
  const audio = output();
  if (!audio) return;
  const start = audio.ctx.currentTime + 0.02;
  midis.forEach((midi, i) => strike(audio.ctx, audio.out, midi, start + i * 0.012, 2.2));
}

/** Strums the strings from the lowest given upward. */
export function playGuitar(midis: number[]) {
  const audio = output();
  if (!audio) return;
  const { ctx, out } = audio;
  const start = ctx.currentTime + 0.02;
  midis.forEach((midi, i) => {
    const { samples, rate } = pluckedString(ctx.sampleRate, frequency(midi), 2.5);
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.getChannelData(0).set(samples);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    source.connect(gain).connect(out);
    source.start(start + i * 0.04);
  });
}
