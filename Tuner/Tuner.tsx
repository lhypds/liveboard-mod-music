import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "@ui/Dropdown/Dropdown";
import { TUNING } from "../common/chords";
import { audioContext, frequency, playGuitar } from "../common/audio";
import { pickLang, pretty } from "../common/text";
import ui from "../common/music.module.css";
import styles from "./tuner.module.css";
import { detectPitch, median, nearestNote, nearestString } from "./pitch";

type Mode = "chromatic" | "guitar";
type Problem = "insecure" | "denied" | "missing" | "failed" | "noAudio";
type Settings = { mode: Mode; a4: number };
const MODES: Mode[] = ["chromatic", "guitar"];
const MIN_A4 = 415;
const MAX_A4 = 466;
const IN_TUNE_CENTS = 5;
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

const LABELS = {
  en: {
    mode: "Mode", modes: ["Chromatic", "Guitar · standard"], reference: "Reference A4", lower: "Lower the reference", higher: "Raise the reference",
    start: "Start listening", stop: "Stop", idle: "Listens through the microphone. Nothing is recorded or sent.", listen: "Play one note at a time…",
    inTune: "In tune", flat: "Flat · tune up", sharp: "Sharp · tune down", strings: "Open strings", hear: "Hear",
    problems: {
      insecure: "The microphone needs a secure page: open the board over HTTPS, or on localhost.",
      denied: "Microphone access was refused. Allow it in the browser's site settings, then start again.",
      missing: "No microphone was found.",
      failed: "The microphone could not be started.",
      noAudio: "This browser cannot process audio.",
    },
  },
  zh: {
    mode: "模式", modes: ["半音阶", "吉他 · 标准调弦"], reference: "基准 A4", lower: "降低基准音", higher: "升高基准音",
    start: "开始收音", stop: "停止", idle: "通过麦克风收音，不会录音或上传。", listen: "请一次弹一个音…",
    inTune: "音准正确", flat: "偏低 · 请调高", sharp: "偏高 · 请调低", strings: "空弦", hear: "试听",
    problems: {
      insecure: "麦克风需要安全连接：请通过 HTTPS 或 localhost 打开看板。",
      denied: "麦克风权限被拒绝。请在浏览器的网站设置中允许后重新开始。",
      missing: "未找到麦克风。",
      failed: "无法启动麦克风。",
      noAudio: "此浏览器无法处理音频。",
    },
  },
  ja: {
    mode: "モード", modes: ["クロマチック", "ギター · 標準"], reference: "基準 A4", lower: "基準音を下げる", higher: "基準音を上げる",
    start: "マイクで聴く", stop: "停止", idle: "マイクで音を聴き取ります。録音や送信はしません。", listen: "1音ずつ弾いてください…",
    inTune: "合っています", flat: "低い · 上げてください", sharp: "高い · 下げてください", strings: "開放弦", hear: "試聴",
    problems: {
      insecure: "マイクには安全な接続が必要です。HTTPS か localhost でボードを開いてください。",
      denied: "マイクの使用が拒否されました。ブラウザのサイト設定で許可してから、もう一度開始してください。",
      missing: "マイクが見つかりません。",
      failed: "マイクを開始できませんでした。",
      noAudio: "このブラウザでは音声を処理できません。",
    },
  },
};

export default function Tuner({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const t = LABELS[pickLang(i18n.language)];
  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((next: Record<string, unknown>) => void) | undefined;
  const [local, setLocal] = useState<Settings>({ mode: "chromatic", a4: 440 });
  const settings: Settings = {
    mode: MODES.find(mode => mode === comp?.mode) ?? local.mode,
    a4: typeof comp?.a4 === "number" && comp.a4 >= MIN_A4 && comp.a4 <= MAX_A4 ? Math.round(comp.a4) : local.a4,
  };
  const { mode, a4 } = settings;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [hz, setHz] = useState<number | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!stream) return;
    const ctx = audioContext();
    if (!ctx) return;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buffer = new Float32Array(analyser.fftSize);
    const recent: number[] = [];
    let heardAt = 0;
    const timer = setInterval(() => {
      analyser.getFloatTimeDomainData(buffer);
      const found = detectPitch(buffer, ctx.sampleRate);
      const now = performance.now();
      if (found) {
        recent.push(found.hz);
        if (recent.length > 5) recent.shift();
        heardAt = now;
        setHz(median(recent));
      } else if (now - heardAt > 500) {
        // A note has to die away for half a second before the reading clears, so it doesn't flicker between plucks.
        recent.length = 0;
        setHz(null);
      }
    }, 50);
    return () => {
      clearInterval(timer);
      source.disconnect();
      stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setLocal(next);
    save?.({ ...comp, ...next });
  }

  async function start() {
    setProblem(null);
    // Browsers leave mediaDevices undefined on plain-HTTP pages.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setProblem("insecure");
      return;
    }
    // Wake the audio inside the click itself; an analyser on a suspended context hears nothing.
    if (!audioContext()) {
      setProblem("noAudio");
      return;
    }
    setStarting(true);
    try {
      const next = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      // The card may have been removed while the browser was asking.
      if (mounted.current) setStream(next);
      else next.getTracks().forEach(track => track.stop());
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setProblem(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "missing" : "failed");
    } finally {
      if (mounted.current) setStarting(false);
    }
  }

  const heard = stream ? hz : null;
  const string = heard !== null && mode === "guitar" ? nearestString(heard, a4) : null;
  const reading = heard === null ? null
    : string ? { ...nearestNote(frequency(TUNING[string.string], a4), a4), cents: string.cents }
    : nearestNote(heard, a4);
  const tune = !reading ? undefined : Math.abs(reading.cents) <= IN_TUNE_CENTS ? "in" : reading.cents < 0 ? "flat" : "sharp";
  const needle = 150 + Math.max(-50, Math.min(50, reading?.cents ?? 0)) * 2.6;

  return <div className={`${ui.container} ${styles.tuner}`}>
    <div className={ui.controls}>
      <div className={ui.selectLabel}><span>{t.mode}</span>
        <Dropdown value={mode} ariaLabel={t.mode} options={MODES.map((value, i) => ({ value, label: t.modes[i] }))} onChange={next => update({ mode: next })} />
      </div>
      <div className={ui.selectLabel}><span>{t.reference}</span>
        <div className={styles.stepper}>
          <button type="button" className={ui.square} aria-label={t.lower} disabled={a4 <= MIN_A4} onClick={() => update({ a4: a4 - 1 })}>−</button>
          <span className={ui.tabular}>{a4} Hz</span>
          <button type="button" className={ui.square} aria-label={t.higher} disabled={a4 >= MAX_A4} onClick={() => update({ a4: a4 + 1 })}>+</button>
        </div>
      </div>
    </div>
    <div className={styles.body}>
      <div className={styles.note}>{reading ? <>{pretty(reading.name)}<sub>{reading.octave}</sub></> : "–"}</div>
      <p className={styles.detail}>
        {reading && heard !== null ? `${reading.cents < 0 ? "−" : "+"}${Math.abs(Math.round(reading.cents))} ¢ · ${heard.toFixed(1)} Hz` : stream ? t.listen : t.idle}
      </p>
      <svg className={styles.meter} viewBox="0 0 300 64" aria-hidden="true">
        <rect x={150 - IN_TUNE_CENTS * 2.6} y="12" width={IN_TUNE_CENTS * 5.2} height="34" className={styles.band} />
        {Array.from({ length: 11 }, (_, i) => {
          const cents = (i - 5) * 10;
          return <line key={cents} x1={150 + cents * 2.6} x2={150 + cents * 2.6} y1={cents === 0 ? 8 : 20} y2="46" className={styles.tick} />;
        })}
        {[-50, 0, 50].map(cents => <text key={cents} x={150 + cents * 2.6} y="62" textAnchor="middle" className={styles.tickLabel}>{cents > 0 ? `+${cents}` : cents}</text>)}
        <line x1="0" x2="0" y1="2" y2="50" className={styles.needle} data-tune={tune} style={{ transform: `translateX(${needle}px)`, opacity: reading ? 1 : 0.15 }} />
      </svg>
      <p className={styles.status} data-tune={tune} role="status">{tune === "in" ? t.inTune : tune === "flat" ? t.flat : tune === "sharp" ? t.sharp : ""}</p>
      {mode === "guitar" && <div className={styles.strings} role="group" aria-label={t.strings}>
        {TUNING.map((midi, i) => <button key={i} type="button" className={ui.button} data-near={string?.string === i}
          title={`${t.hear} ${STRING_LABELS[i]}`} onClick={() => playGuitar([midi], a4)}>{STRING_LABELS[i]}</button>)}
      </div>}
      <button type="button" className={`${ui.button} ${ui.primary}`} disabled={starting} onClick={stream ? () => setStream(null) : start}>{stream ? t.stop : t.start}</button>
      {problem && <p className={ui.error} role="alert">{t.problems[problem]}</p>}
    </div>
  </div>;
}
