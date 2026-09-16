import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "@ui/Dropdown/Dropdown";
import { audioContext, click, openChannel } from "../common/audio";
import { startPulse } from "../common/pulse";
import { pickLang } from "../common/text";
import ui from "../common/music.module.css";
import styles from "./metronome.module.css";
import { MAX_BPM, MIN_BPM, SIGNATURES, SUBDIVISIONS, barPattern, clampBpm, clicksPerSquare, tappedBpm, tempoName } from "./beats";
import type { Signature } from "./beats";

type Settings = { bpm: number; signature: Signature; subdivision: number };
const DEFAULTS: Settings = { bpm: 100, signature: "4/4", subdivision: 1 };

const LABELS = {
  en: {
    start: "Start", stop: "Stop", tap: "Tap", slower: "Slower", faster: "Faster", tempo: "Tempo",
    signature: "Time signature", subdivision: "Clicks per beat", subdivisions: ["Quarter notes", "Eighths", "Triplets", "Sixteenths"],
    eighths: "Counting eighth notes", noAudio: "This browser cannot play sound.",
  },
  zh: {
    start: "开始", stop: "停止", tap: "敲击测速", slower: "减慢", faster: "加快", tempo: "速度",
    signature: "拍号", subdivision: "每拍细分", subdivisions: ["四分音符", "八分音符", "三连音", "十六分音符"],
    eighths: "以八分音符计速", noAudio: "此浏览器无法播放声音。",
  },
  ja: {
    start: "スタート", stop: "ストップ", tap: "タップ", slower: "遅く", faster: "速く", tempo: "テンポ",
    signature: "拍子", subdivision: "1拍の分割", subdivisions: ["4分音符", "8分音符", "3連符", "16分音符"],
    eighths: "8分音符でカウント", noAudio: "このブラウザでは音を再生できません。",
  },
};

export default function Metronome({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const t = LABELS[pickLang(i18n.language)];
  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((next: Record<string, unknown>) => void) | undefined;
  const [local, setLocal] = useState<Settings>(DEFAULTS);
  const settings: Settings = {
    bpm: typeof comp?.bpm === "number" ? clampBpm(comp.bpm) : local.bpm,
    signature: SIGNATURES.find(signature => signature === comp?.signature) ?? local.signature,
    subdivision: SUBDIVISIONS.find(subdivision => subdivision === comp?.subdivision) ?? local.subdivision,
  };
  const { signature, subdivision } = settings;
  // The slider shows its value while it is dragged and saves once it is let go.
  const [dragged, setDragged] = useState<number | null>(null);
  const bpm = dragged ?? settings.bpm;
  const [playing, setPlaying] = useState(false);
  const [square, setSquare] = useState(-1);
  const [noAudio, setNoAudio] = useState(false);
  const taps = useRef<number[]>([]);
  // Read on every click, so a new tempo is heard on the next one without restarting.
  const tempo = useRef(bpm);
  useEffect(() => {
    tempo.current = bpm;
  }, [bpm]);

  const compound = signature.endsWith("/8");
  const perSquare = clicksPerSquare(signature, subdivision);
  const squares = barPattern(signature, subdivision).filter((_, i) => i % perSquare === 0);

  useEffect(() => {
    if (!playing) return;
    const channel = openChannel();
    if (!channel) return;
    const bar = barPattern(signature, subdivision);
    const per = clicksPerSquare(signature, subdivision);
    const pulse = startPulse(channel.ctx, () => 60 / tempo.current / per, (step, at) => click(channel, at, bar[step % bar.length]));
    let frame = requestAnimationFrame(function draw() {
      const step = pulse.sounding();
      setSquare(step < 0 ? -1 : Math.floor((step % bar.length) / per));
      frame = requestAnimationFrame(draw);
    });
    return () => {
      pulse.stop();
      channel.close();
      cancelAnimationFrame(frame);
    };
  }, [playing, signature, subdivision]);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setLocal(next);
    save?.({ ...comp, ...next });
  }

  function release() {
    if (dragged === null) return;
    update({ bpm: dragged });
    setDragged(null);
  }

  function tap() {
    taps.current = [...taps.current.slice(-4), performance.now()];
    const tapped = tappedBpm(taps.current);
    if (tapped !== null) update({ bpm: tapped });
  }

  function toggle() {
    if (playing) {
      setPlaying(false);
      return;
    }
    // Wake the audio inside the click itself: the effect that starts the pulse runs too late for some browsers.
    if (!audioContext()) {
      setNoAudio(true);
      return;
    }
    setPlaying(true);
  }

  return <div className={`${ui.container} ${styles.metronome}`}>
    <div className={styles.body}>
      <div className={styles.squares} aria-hidden="true">
        {squares.map((level, i) => <i key={i} data-level={level} data-on={playing && square === i} />)}
      </div>
      <div className={styles.readout}>
        <strong className={styles.bpm}>{bpm}</strong>
        <span>BPM {compound ? "♪" : "♩"}</span>
      </div>
      <p className={styles.marking}>{compound ? t.eighths : tempoName(bpm)}</p>
      <div className={styles.slider}>
        <button type="button" className={ui.square} aria-label={t.slower} disabled={bpm <= MIN_BPM} onClick={() => update({ bpm: clampBpm(bpm - 1) })}>−</button>
        <input type="range" min={MIN_BPM} max={MAX_BPM} value={bpm} aria-label={t.tempo}
          onChange={event => setDragged(Number(event.target.value))} onPointerUp={release} onKeyUp={release} onBlur={release} />
        <button type="button" className={ui.square} aria-label={t.faster} disabled={bpm >= MAX_BPM} onClick={() => update({ bpm: clampBpm(bpm + 1) })}>+</button>
      </div>
      <div className={styles.actions}>
        <button type="button" className={`${ui.button} ${ui.primary}`} onClick={toggle}>{playing ? t.stop : t.start}</button>
        <button type="button" className={ui.button} onClick={tap}>{t.tap}</button>
      </div>
      <div className={`${ui.controls} ${styles.settings}`}>
        <div className={ui.selectLabel}><span>{t.signature}</span>
          <Dropdown value={signature} ariaLabel={t.signature} options={SIGNATURES.map(value => ({ value, label: value }))} onChange={next => update({ signature: next })} />
        </div>
        {!compound && <div className={ui.selectLabel}><span>{t.subdivision}</span>
          <Dropdown value={String(subdivision)} ariaLabel={t.subdivision}
            options={SUBDIVISIONS.map((value, i) => ({ value: String(value), label: t.subdivisions[i] }))}
            onChange={next => update({ subdivision: Number(next) })} />
        </div>}
      </div>
      {noAudio && <p className={ui.error}>{t.noAudio}</p>}
    </div>
  </div>;
}
