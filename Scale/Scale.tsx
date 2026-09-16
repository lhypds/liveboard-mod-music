import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "@ui/Dropdown/Dropdown";
import { ROOTS } from "../common/chords";
import { openChannel, pianoChord, pianoMelody, playGuitar, playPiano } from "../common/audio";
import type { Channel } from "../common/audio";
import Piano from "../common/Piano";
import PlayButton from "../common/PlayButton";
import { pickLang, pretty } from "../common/text";
import ui from "../common/music.module.css";
import Fretboard from "./Fretboard";
import styles from "./scale.module.css";
import { SCALE_NAMES, scaleChords, scaleNotes, scaleSteps } from "./scales";
import type { ScaleName } from "./scales";

type Settings = { key: string; scale: ScaleName; sevenths: boolean };
const DEFAULTS: Settings = { key: "C", scale: "major", sevenths: false };

const LABELS = {
  en: {
    key: "Key", scale: "Scale", notes: "Notes", degrees: "Degrees", steps: "Steps", whole: "W", half: "H", wholeHalf: "W+H",
    playScale: "Play the scale up and down", piano: "Piano", pianoCaption: "Degrees on the keys · click a key to hear it",
    guitar: "Guitar", fretCaption: "Frets 0–12 · high e on top · click a dot to hear it", root: "Root", scaleNote: "Scale note",
    chords: "Chords in the key", triads: "Triads", sevenths: "Sevenths", play: "Play",
    noChords: "Chords in the key are listed for seven-note scales.",
    names: {
      major: "Major", minor: "Natural minor", harmonicMinor: "Harmonic minor", melodicMinor: "Melodic minor",
      dorian: "Dorian", phrygian: "Phrygian", lydian: "Lydian", mixolydian: "Mixolydian", locrian: "Locrian",
      majorPentatonic: "Major pentatonic", minorPentatonic: "Minor pentatonic", blues: "Blues",
    },
  },
  zh: {
    key: "调", scale: "音阶", notes: "音名", degrees: "级数", steps: "音程", whole: "全", half: "半", wholeHalf: "全+半",
    playScale: "上行再下行播放音阶", piano: "钢琴", pianoCaption: "琴键上标出级数 · 点击琴键试听",
    guitar: "吉他", fretCaption: "0–12 品 · 最上方为高音 e 弦 · 点击圆点试听", root: "主音", scaleNote: "音阶音",
    chords: "调内和弦", triads: "三和弦", sevenths: "七和弦", play: "播放",
    noChords: "七声音阶才列出调内和弦。",
    names: {
      major: "大调", minor: "自然小调", harmonicMinor: "和声小调", melodicMinor: "旋律小调",
      dorian: "多利亚调式", phrygian: "弗里几亚调式", lydian: "利底亚调式", mixolydian: "混合利底亚调式", locrian: "洛克里亚调式",
      majorPentatonic: "大调五声音阶", minorPentatonic: "小调五声音阶", blues: "布鲁斯音阶",
    },
  },
  ja: {
    key: "キー", scale: "スケール", notes: "音名", degrees: "度数", steps: "音程", whole: "全", half: "半", wholeHalf: "全+半",
    playScale: "スケールを上行・下行で再生", piano: "ピアノ", pianoCaption: "鍵盤に度数 · クリックで試聴",
    guitar: "ギター", fretCaption: "0–12 フレット · 上が高音 e 弦 · 丸をクリックで試聴", root: "主音", scaleNote: "スケール音",
    chords: "ダイアトニックコード", triads: "三和音", sevenths: "四和音", play: "再生",
    noChords: "ダイアトニックコードは7音のスケールで表示します。",
    names: {
      major: "メジャー", minor: "ナチュラルマイナー", harmonicMinor: "ハーモニックマイナー", melodicMinor: "メロディックマイナー",
      dorian: "ドリアン", phrygian: "フリジアン", lydian: "リディアン", mixolydian: "ミクソリディアン", locrian: "ロクリアン",
      majorPentatonic: "メジャーペンタトニック", minorPentatonic: "マイナーペンタトニック", blues: "ブルース",
    },
  },
};

export default function Scale({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const t = LABELS[pickLang(i18n.language)];
  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((next: Record<string, unknown>) => void) | undefined;
  const [local, setLocal] = useState<Settings>(DEFAULTS);
  const settings: Settings = {
    key: ROOTS.find(root => root === comp?.key) ?? local.key,
    scale: SCALE_NAMES.find(name => name === comp?.scale) ?? local.scale,
    sevenths: typeof comp?.sevenths === "boolean" ? comp.sevenths : local.sevenths,
  };
  const { key, scale, sevenths } = settings;
  const channel = useRef<Channel | undefined>(undefined);
  const notes = scaleNotes(key, scale);
  const steps = scaleSteps(scale);
  const chords = scaleChords(key, scale, sevenths);
  const title = `${pretty(key)} ${t.names[scale]}`;
  const run = notes.map(note => note.midi);
  const stepLabel = (semitones: number) => semitones === 1 ? t.half : semitones === 2 ? t.whole : t.wholeHalf;

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setLocal(next);
    save?.({ ...comp, ...next });
  }

  // A scale run or a chord cuts off the one before, so they don't pile up under the next click.
  function play(sound: (target: Channel, at: number) => void) {
    channel.current?.close();
    channel.current = openChannel();
    if (channel.current) sound(channel.current, channel.current.ctx.currentTime + 0.02);
  }

  return <div className={ui.container}>
    <div className={ui.controls}>
      <div className={ui.selectLabel}><span>{t.key}</span>
        <Dropdown value={key} ariaLabel={t.key} options={ROOTS.map(root => ({ value: root, label: pretty(root) }))} onChange={next => update({ key: next })} />
      </div>
      <div className={ui.selectLabel}><span>{t.scale}</span>
        <Dropdown value={scale} ariaLabel={t.scale} options={SCALE_NAMES.map(name => ({ value: name, label: t.names[name] }))} onChange={next => update({ scale: next })} />
      </div>
    </div>
    <div className={styles.heading}>
      <strong aria-live="polite">{title}</strong>
      <PlayButton label={t.playScale} onClick={() => play((target, at) => pianoMelody(target, [...run, ...run.slice(0, -1).reverse()], at, 0.24))} />
    </div>
    <div className={styles.table} style={{ gridTemplateColumns: `auto repeat(${notes.length}, minmax(0, 1fr))` }}>
      <span className={styles.rowLabel}>{t.notes}</span>
      {notes.map((note, i) => <b key={`n${i}`}>{pretty(note.name)}</b>)}
      <span className={styles.rowLabel}>{t.degrees}</span>
      {notes.map((note, i) => <span key={`d${i}`} className={styles.degree}>{pretty(note.degree)}</span>)}
      <span className={styles.rowLabel}>{t.steps}</span>
      {notes.map((_, i) => <span key={`s${i}`} className={styles.step}>{i < steps.length ? stepLabel(steps[i]) : ""}</span>)}
    </div>
    <section className={ui.section}>
      <div className={ui.sectionHead}><h3>{t.piano}</h3><span>{t.pianoCaption}</span></div>
      <Piano marks={notes.map((note, i) => ({ midi: note.midi, name: note.name, tag: note.degree, root: i === 0 || i === notes.length - 1 }))}
        label={`${t.piano}: ${notes.map(note => pretty(note.name)).join(", ")}`} title={title} onPress={midi => playPiano([midi])} />
      <div className={ui.legend}>
        <span><i className={ui.rootSwatch} />{t.root}</span>
        <span><i className={ui.toneSwatch} />{t.scaleNote}</span>
      </div>
    </section>
    <section className={ui.section}>
      <div className={ui.sectionHead}><h3>{t.guitar}</h3><span>{t.fretCaption}</span></div>
      <Fretboard notes={notes} label={`${t.guitar}: ${title}`} onPress={midi => playGuitar([midi])} />
    </section>
    <section className={ui.section}>
      <div className={ui.sectionHead}>
        <h3>{t.chords}</h3>
        {chords.length > 0 && <div className={styles.toggle} role="group" aria-label={t.chords}>
          <button type="button" className={ui.button} aria-pressed={!sevenths} onClick={() => update({ sevenths: false })}>{t.triads}</button>
          <button type="button" className={ui.button} aria-pressed={sevenths} onClick={() => update({ sevenths: true })}>{t.sevenths}</button>
        </div>}
      </div>
      {chords.length > 0
        ? <div className={styles.chords}>
          {chords.map(chord => <button key={chord.numeral} type="button" className={styles.chord} title={`${t.play}: ${pretty(chord.symbol)}`}
            onClick={() => play((target, at) => pianoChord(target, chord.midis, at))}>
            <span>{chord.numeral}</span><b>{pretty(chord.symbol)}</b>
          </button>)}
        </div>
        : <p className={ui.hint}>{t.noChords}</p>}
    </section>
  </div>;
}
