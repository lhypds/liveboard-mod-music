import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "@ui/Dropdown/Dropdown";
import { TUNING, chordNotes, guitarVoicings, pianoFingers } from "../common/chords";
import type { Chord } from "../common/chords";
import { audioContext, click, guitarStrum, openChannel, pianoChord, playGuitar, playPiano } from "../common/audio";
import ChordDiagram from "../common/ChordDiagram";
import Piano from "../common/Piano";
import { startPulse } from "../common/pulse";
import { pickLang, pretty } from "../common/text";
import ui from "../common/music.module.css";
import styles from "./progression.module.css";
import { PRESETS, beatsOf, isPlayable, parseChart, transposeChart } from "./chart";
import type { PresetId } from "./chart";

type Instrument = "piano" | "guitar";
type Settings = { chart: string; bpm: number; beatsPerBar: number; instrument: Instrument; click: boolean };
const DEFAULTS: Settings = { chart: "C G Am F", bpm: 90, beatsPerBar: 4, instrument: "piano", click: true };
const INSTRUMENTS: Instrument[] = ["piano", "guitar"];
const BEATS_PER_BAR = [2, 3, 4, 6];
const MIN_BPM = 40;
const MAX_BPM = 240;
const clampBpm = (bpm: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));

/** What an instrument sounds for a chord: the root-position notes on piano, the first voicing's strings on guitar. */
function soundOf(chord: Chord, instrument: Instrument): number[] {
  if (instrument === "piano") return chordNotes(chord).map(note => note.midi);
  return guitarVoicings(chord)[0].frets.flatMap((fret, i) => fret < 0 ? [] : [TUNING[i] + fret]);
}

const LABELS = {
  en: {
    chart: "Chords", placeholder: "C G Am F  or  | C G | Am F |", presets: "Presets", choose: "Choose…",
    presetNames: { pop: "I–V–vi–IV", fifties: "I–vi–IV–V", jazz: "ii–V–I", minorJazz: "Minor ii–V–i", canon: "Canon", andalusian: "Andalusian cadence", blues: "12-bar blues" },
    play: "Play", stop: "Stop", tempo: "BPM", slower: "Slower", faster: "Faster", beats: "Beats per bar", sound: "Sound",
    instruments: { piano: "Piano", guitar: "Guitar" }, click: "Click", transpose: "Transpose", down: "Down a semitone", up: "Up a semitone",
    help: "Each chord is a bar; | C G | puts several chords in one bar. Enter to save.",
    error: "Not a chord: {chords}. Use symbols such as C, Am, F#7 or Bm7♭5.", crowded: "A bar can hold at most one chord per beat.", empty: "Enter some chords.",
    bar: "Bar", notes: "Notes", position: "Root position · C4–B5", direction: "Left → right: low E → high E", noAudio: "This browser cannot play sound.",
  },
  zh: {
    chart: "和弦", placeholder: "C G Am F  或  | C G | Am F |", presets: "预设", choose: "选择…",
    presetNames: { pop: "I–V–vi–IV", fifties: "I–vi–IV–V", jazz: "ii–V–I", minorJazz: "小调 ii–V–i", canon: "卡农", andalusian: "安达卢西亚终止", blues: "十二小节布鲁斯" },
    play: "播放", stop: "停止", tempo: "BPM", slower: "减慢", faster: "加快", beats: "每小节拍数", sound: "音色",
    instruments: { piano: "钢琴", guitar: "吉他" }, click: "节拍声", transpose: "移调", down: "降半音", up: "升半音",
    help: "每个和弦占一小节；| C G | 可把多个和弦放进同一小节。按回车保存。",
    error: "无法识别的和弦：{chords}。请使用 C、Am、F#7、Bm7♭5 等写法。", crowded: "每小节的和弦数不能多于拍数。", empty: "请输入和弦。",
    bar: "小节", notes: "组成音", position: "原位和弦 · C4–B5", direction: "从左到右：低音 E → 高音 E", noAudio: "此浏览器无法播放声音。",
  },
  ja: {
    chart: "コード", placeholder: "C G Am F  または  | C G | Am F |", presets: "プリセット", choose: "選択…",
    presetNames: { pop: "I–V–vi–IV", fifties: "I–vi–IV–V", jazz: "ii–V–I", minorJazz: "マイナー ii–V–i", canon: "カノン進行", andalusian: "アンダルシア進行", blues: "12小節ブルース" },
    play: "再生", stop: "停止", tempo: "BPM", slower: "遅く", faster: "速く", beats: "1小節の拍数", sound: "音色",
    instruments: { piano: "ピアノ", guitar: "ギター" }, click: "クリック", transpose: "移調", down: "半音下げる", up: "半音上げる",
    help: "1コード1小節。| C G | で1小節に複数のコードを入れられます。Enter で保存。",
    error: "コードとして読めません：{chords}。C、Am、F#7、Bm7♭5 のように入力してください。", crowded: "1小節に入るコードは拍数までです。", empty: "コードを入力してください。",
    bar: "小節", notes: "構成音", position: "基本形 · C4–B5", direction: "左 → 右：低音 E → 高音 E", noAudio: "このブラウザでは音を再生できません。",
  },
};

export default function Progression({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const t = LABELS[pickLang(i18n.language)];
  const id = useId();
  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((next: Record<string, unknown>) => void) | undefined;
  const [local, setLocal] = useState<Settings>(DEFAULTS);
  const beatsPerBar = BEATS_PER_BAR.find(beats => beats === comp?.beatsPerBar) ?? local.beatsPerBar;
  const savedChart = typeof comp?.chart === "string" && isPlayable(parseChart(comp.chart, beatsPerBar)) ? comp.chart : local.chart;
  const settings: Settings = {
    chart: savedChart,
    bpm: typeof comp?.bpm === "number" ? clampBpm(comp.bpm) : local.bpm,
    beatsPerBar,
    instrument: INSTRUMENTS.find(instrument => instrument === comp?.instrument) ?? local.instrument,
    click: typeof comp?.click === "boolean" ? comp.click : local.click,
  };
  const chart = useMemo(() => parseChart(savedChart, beatsPerBar), [savedChart, beatsPerBar]);
  const beats = useMemo(() => beatsOf(chart.slots), [chart]);

  // The chart saves on Enter or on leaving the field; until then an unreadable one keeps its hint and the saved chart plays on.
  const [draft, setDraft] = useState<{ value: string; source: string } | null>(null);
  const value = draft?.source === savedChart ? draft.value : savedChart;
  const typed = parseChart(value, beatsPerBar);
  const draftProblem = draft?.source === savedChart && !isPlayable(typed)
    ? typed.invalid.length ? t.error.replace("{chords}", typed.invalid.join(", ")) : typed.crowded ? t.crowded : t.empty
    : null;
  const [crowdedBeats, setCrowdedBeats] = useState(false);
  const problem = draftProblem ?? (crowdedBeats ? t.crowded : null);
  const [bpmDraft, setBpmDraft] = useState<string | null>(null);
  const [noAudio, setNoAudio] = useState(false);

  const [run, setRun] = useState<{ from: number; id: number } | null>(null);
  const [sounding, setSounding] = useState<{ id: number; beat: number } | null>(null);
  const [selected, setSelected] = useState(0);
  // Tempo, sound and click are read on every beat, so changing them doesn't restart the loop.
  const live = useRef(settings);
  useEffect(() => {
    live.current = settings;
  });

  useEffect(() => {
    if (!run) return;
    const channel = openChannel();
    if (!channel) return;
    const offset = Math.max(0, beats.findIndex(beat => beat.slot === run.from && beat.first));
    const pulse = startPulse(channel.ctx, () => 60 / live.current.bpm, (step, at) => {
      const beat = beats[(offset + step) % beats.length];
      const { instrument, bpm } = live.current;
      if (live.current.click) click(channel, at, beat.downbeat ? 2 : 1);
      if (!beat.first) return;
      const slot = chart.slots[beat.slot];
      if (instrument === "piano") pianoChord(channel, soundOf(slot.chord, "piano"), at, Math.min((slot.beats * 60) / bpm, 4) + 0.2);
      else guitarStrum(channel, soundOf(slot.chord, "guitar"), at);
    });
    let frame = requestAnimationFrame(function draw() {
      const step = pulse.sounding();
      if (step >= 0) {
        const beat = (offset + step) % beats.length;
        setSounding(prev => prev?.id === run.id && prev.beat === beat ? prev : { id: run.id, beat });
      }
      frame = requestAnimationFrame(draw);
    });
    return () => {
      pulse.stop();
      channel.close();
      cancelAnimationFrame(frame);
    };
  }, [run, beats, chart]);

  const position = run && sounding?.id === run.id ? beats[sounding.beat] ?? null : null;
  const shownIndex = position ? position.slot : Math.min(selected, chart.slots.length - 1);
  const shown = chart.slots[shownIndex].chord;
  const notes = chordNotes(shown);
  const fingers = pianoFingers(shown);
  const bars = chart.slots.reduce<number[][]>((groups, slot, index) => {
    (groups[slot.bar] ??= []).push(index);
    return groups;
  }, []);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setLocal(next);
    setCrowdedBeats(false);
    save?.({ ...comp, ...next });
  }

  function commitChart() {
    if (draft?.source !== savedChart || !isPlayable(typed)) return;
    update({ chart: value.trim().replace(/\s+/g, " ") });
    setDraft(null);
  }

  function commitBpm() {
    if (bpmDraft === null) return;
    const next = Number(bpmDraft);
    if (bpmDraft.trim() && Number.isFinite(next)) update({ bpm: clampBpm(next) });
    setBpmDraft(null);
  }

  function changeBeats(next: number) {
    if (!isPlayable(parseChart(savedChart, next))) {
      setCrowdedBeats(true);
      return;
    }
    update({ beatsPerBar: next });
  }

  function transpose(semitones: number) {
    update({ chart: transposeChart(savedChart, semitones) });
    setDraft(null);
  }

  function pick(index: number) {
    if (run) {
      setRun({ from: index, id: run.id + 1 });
      return;
    }
    setSelected(index);
    const { chord } = chart.slots[index];
    if (settings.instrument === "piano") playPiano(soundOf(chord, "piano"));
    else playGuitar(soundOf(chord, "guitar"));
  }

  function toggle() {
    if (run) {
      if (position) setSelected(position.slot);
      setRun(null);
      return;
    }
    // Wake the audio inside the click itself: the effect that starts the pulse runs too late for some browsers.
    if (!audioContext()) {
      setNoAudio(true);
      return;
    }
    setRun({ from: shownIndex, id: (sounding?.id ?? 0) + 1 });
  }

  return <div className={ui.container}>
    <div className={ui.controls}>
      <label className={ui.inputLabel} htmlFor={id}>
        <span>{t.chart}</span>
        <input id={id} value={value} placeholder={t.placeholder} autoComplete="off" spellCheck={false}
          aria-invalid={draftProblem !== null} aria-describedby={`${id}-help`}
          onChange={event => setDraft({ value: event.target.value, source: savedChart })}
          onBlur={commitChart}
          onKeyDown={event => {
            if (event.key === "Enter") { event.preventDefault(); commitChart(); }
            if (event.key === "Escape") setDraft(null);
          }} />
      </label>
      <div className={ui.selectLabel}><span>{t.presets}</span>
        <Dropdown<PresetId | ""> value={PRESETS.find(preset => preset.text === savedChart)?.id ?? ""} ariaLabel={t.presets}
          options={[{ value: "", label: t.choose }, ...PRESETS.map(preset => ({ value: preset.id, label: t.presetNames[preset.id] }))]}
          onChange={next => {
            const preset = PRESETS.find(item => item.id === next);
            if (!preset) return;
            update({ chart: preset.text });
            setDraft(null);
          }} />
      </div>
    </div>
    <p id={`${id}-help`} className={styles.help} data-problem={problem !== null} role={problem ? "status" : undefined}>{problem ?? t.help}</p>

    <div className={`${ui.controls} ${styles.transport}`}>
      <button type="button" className={`${ui.button} ${ui.primary}`} onClick={toggle}>{run ? `■ ${t.stop}` : `▶ ${t.play}`}</button>
      <div className={ui.selectLabel}><span>{t.tempo}</span>
        <div className={styles.row}>
          <button type="button" className={ui.square} aria-label={t.slower} disabled={settings.bpm <= MIN_BPM} onClick={() => update({ bpm: clampBpm(settings.bpm - 1) })}>−</button>
          <input className={styles.number} type="number" inputMode="numeric" min={MIN_BPM} max={MAX_BPM} aria-label={t.tempo}
            value={bpmDraft ?? settings.bpm} onChange={event => setBpmDraft(event.target.value)} onBlur={commitBpm}
            onKeyDown={event => { if (event.key === "Enter") commitBpm(); }} />
          <button type="button" className={ui.square} aria-label={t.faster} disabled={settings.bpm >= MAX_BPM} onClick={() => update({ bpm: clampBpm(settings.bpm + 1) })}>+</button>
        </div>
      </div>
      <div className={ui.selectLabel}><span>{t.beats}</span>
        <Dropdown value={String(beatsPerBar)} ariaLabel={t.beats}
          options={BEATS_PER_BAR.map(beats => ({ value: String(beats), label: String(beats) }))} onChange={next => changeBeats(Number(next))} />
      </div>
      <div className={ui.selectLabel}><span>{t.sound}</span>
        <Dropdown value={settings.instrument} ariaLabel={t.sound}
          options={INSTRUMENTS.map(instrument => ({ value: instrument, label: t.instruments[instrument] }))} onChange={next => update({ instrument: next })} />
      </div>
      <button type="button" className={ui.button} aria-pressed={settings.click} onClick={() => update({ click: !settings.click })}>{t.click}</button>
      <div className={ui.selectLabel}><span>{t.transpose}</span>
        <div className={styles.row}>
          <button type="button" className={ui.square} aria-label={t.down} title={t.down} onClick={() => transpose(-1)}>♭</button>
          <button type="button" className={ui.square} aria-label={t.up} title={t.up} onClick={() => transpose(1)}>♯</button>
        </div>
      </div>
    </div>

    <div className={styles.chart}>
      {bars.map((indexes, bar) => <div key={bar} className={styles.bar}>
        {indexes.map(index => {
          const slot = chart.slots[index];
          return <button key={index} type="button" className={styles.chip} style={{ flexGrow: slot.beats }}
            aria-current={shownIndex === index ? "true" : undefined} data-playing={position?.slot === index}
            onClick={() => pick(index)}>
            {pretty(slot.chord.symbol)}
          </button>;
        })}
      </div>)}
    </div>
    <div className={styles.beats} aria-hidden="true">
      {Array.from({ length: beatsPerBar }, (_, i) => <i key={i} data-down={i === 0} data-on={position?.inBar === i} />)}
      {position && <span>{t.bar} {chart.slots[position.slot].bar + 1}</span>}
    </div>

    <section className={ui.section}>
      <div className={ui.summary}>
        <strong>{pretty(shown.symbol)}</strong>
        <span>{t.notes}<b>{notes.map(note => pretty(note.name)).join(" · ")}</b></span>
      </div>
      {settings.instrument === "piano"
        ? <Piano marks={notes.map((note, i) => ({ midi: note.midi, name: note.name, tag: fingers[i], root: i === 0 }))}
          label={`${t.instruments.piano}: ${notes.map(note => pretty(note.name)).join(", ")}`} title={`${pretty(shown.symbol)} · ${t.position}`} />
        : <ChordDiagram chord={shown} voicing={guitarVoicings(shown)[0]} label={t.instruments.guitar} caption={t.direction} className={styles.diagram} />}
    </section>
    {noAudio && <p className={ui.error}>{t.noAudio}</p>}
  </div>;
}
