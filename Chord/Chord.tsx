import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "@ui/Dropdown/Dropdown";
import { ROOTS, QUALITIES, TUNING, chordNotes, guitarVoicings, parseChord, pianoFingers } from "../common/chords";
import { playGuitar, playPiano } from "../common/audio";
import ChordDiagram from "../common/ChordDiagram";
import Piano from "../common/Piano";
import PlayButton from "../common/PlayButton";
import { pickLang, pretty } from "../common/text";
import ui from "../common/music.module.css";
import styles from "./chord.module.css";

const LABELS = {
  en: {
    input: "Enter a chord", root: "Root", quality: "Chord type", piano: "Piano", guitar: "Guitar",
    position: "Root position · C4–B5", tuning: "Standard tuning · no capo", rootNote: "Root note", chordTone: "Chord tone",
    rightHand: "Right hand · 1 thumb · 2 index · 3 middle · 4 ring · 5 little", play: "Play",
    error: "Use a root A–G, optional # / ♭, then major, m, 7, maj7, m7, sus2, sus4, dim, aug, m7♭5 or dim7. Example: F#7. Slash chords are not supported yet.",
    voicing: "Voicing", previous: "Previous voicing", next: "Next voicing",
    open: "○ Open string", mute: "× Do not play", fingers: "1 index · 2 middle · 3 ring · 4 little", barre: "A connecting bar means one finger holds several strings.",
    direction: "Left → right: low E → high E", fret: "Fret", notes: "Notes", frets: "Frets",
    qualities: ["Major", "Minor", "Dominant 7", "Major 7", "Minor 7", "Sus 2", "Sus 4", "Diminished", "Augmented", "Half-diminished", "Diminished 7"],
  },
  zh: {
    input: "输入和弦", root: "根音", quality: "和弦类型", piano: "钢琴", guitar: "吉他",
    position: "原位和弦 · C4–B5", tuning: "标准调弦 · 无变调夹", rootNote: "根音", chordTone: "和弦音",
    rightHand: "右手 · 1 拇指 · 2 食指 · 3 中指 · 4 无名指 · 5 小指", play: "播放",
    error: "请输入 A–G 根音，可加 # / ♭，以及 m、7、maj7、m7、sus2、sus4、dim、aug、m7♭5 或 dim7，例如 F#7。目前不支持斜杠和弦。",
    voicing: "指型", previous: "上一个指型", next: "下一个指型",
    open: "○ 空弦", mute: "× 不弹", fingers: "1 食指 · 2 中指 · 3 无名指 · 4 小指", barre: "连接线表示用同一根手指横按多根弦。",
    direction: "从左到右：低音 E → 高音 E", fret: "品", notes: "组成音", frets: "品位",
    qualities: ["大三和弦", "小三和弦", "属七和弦", "大七和弦", "小七和弦", "挂二和弦", "挂四和弦", "减三和弦", "增三和弦", "半减七和弦", "减七和弦"],
  },
  ja: {
    input: "コードを入力", root: "ルート", quality: "コードの種類", piano: "ピアノ", guitar: "ギター",
    position: "基本形 · C4–B5", tuning: "標準チューニング · カポなし", rootNote: "ルート音", chordTone: "構成音",
    rightHand: "右手 · 1 親指 · 2 人差し指 · 3 中指 · 4 薬指 · 5 小指", play: "再生",
    error: "A–G、必要に応じて # / ♭ と m、7、maj7、m7、sus2、sus4、dim、aug、m7♭5、dim7 を入力。例：F#7。分数コードは未対応です。",
    voicing: "フォーム", previous: "前のフォーム", next: "次のフォーム",
    open: "○ 開放弦", mute: "× 弾かない", fingers: "1 人差し指 · 2 中指 · 3 薬指 · 4 小指", barre: "連結線は一本の指で複数の弦を押さえるセーハです。",
    direction: "左 → 右：低音 E → 高音 E", fret: "フレット", notes: "構成音", frets: "フレット",
    qualities: ["メジャー", "マイナー", "セブンス", "メジャー7", "マイナー7", "サス2", "サス4", "ディミニッシュ", "オーギュメント", "ハーフディミニッシュ", "ディミニッシュ7"],
  },
};

export default function Chord({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const t = LABELS[pickLang(i18n.language)];
  const id = useId();
  const comp = config.comp as Record<string, unknown> | undefined;
  const save = config._save as ((next: Record<string, unknown>) => void) | undefined;
  const [local, setLocal] = useState({ chord: "C", voicing: 0 });
  const saved = typeof comp?.chord === "string" && parseChord(comp.chord) ? comp.chord : local.chord;
  const savedChord = parseChord(saved)!;
  const [draft, setDraft] = useState<{ value: string; source: string } | null>(null);
  const value = draft?.source === saved ? draft.value : saved;
  const typed = parseChord(value);
  // A valid symbol previews as it is typed; anything unparsable leaves the saved chord on screen.
  const chord = typed ?? savedChord;
  const notes = chordNotes(chord);
  const fingers = pianoFingers(chord);
  const voicings = guitarVoicings(chord);
  const storedIndex = typeof comp?.voicing === "number" ? comp.voicing : local.voicing;
  const index = chord.symbol === savedChord.symbol && Number.isInteger(storedIndex) && storedIndex >= 0 && storedIndex < voicings.length ? storedIndex : 0;
  const voicing = voicings[index];
  const error = !typed && value.trim().length > 0;

  function commit(symbol: string, voicing = 0) {
    const parsed = parseChord(symbol);
    if (!parsed) return;
    const next = { chord: parsed.symbol, voicing };
    setLocal(next);
    setDraft(null);
    save?.({ ...comp, ...next });
  }

  return <div className={ui.container}>
    <div className={ui.controls}>
      <label className={ui.inputLabel} htmlFor={id}>
        <span>{t.input}</span>
        <input id={id} value={value} placeholder="C, Am, F#7, B♭maj7" autoComplete="off" spellCheck={false}
          aria-invalid={error} aria-describedby={error ? `${id}-hint` : undefined}
          onChange={event => setDraft({ value: event.target.value, source: saved })}
          onBlur={() => { if (typed) commit(typed.symbol, index); else setDraft(null); }}
          onKeyDown={event => {
            if (event.key === "Enter" && typed) { event.preventDefault(); commit(typed.symbol, index); }
            if (event.key === "Escape") setDraft(null);
          }} />
      </label>
      <div className={ui.selectLabel}><span>{t.root}</span>
        <Dropdown value={chord.root} ariaLabel={t.root}
          options={[...new Set([...ROOTS, chord.root])].map(root => ({ value: root, label: pretty(root) }))}
          onChange={root => commit(root + chord.quality)} />
      </div>
      <div className={ui.selectLabel}><span>{t.quality}</span>
        <Dropdown value={chord.quality} ariaLabel={t.quality}
          options={QUALITIES.map((quality, i) => ({ value: quality, label: t.qualities[i] }))}
          onChange={quality => commit(chord.root + quality)} />
      </div>
    </div>
    {error && <p id={`${id}-hint`} role="status" className={ui.error}>{t.error}</p>}
    <div className={ui.summary} aria-live="polite">
      <strong>{pretty(chord.symbol)}</strong>
      <span>{t.notes}<b>{notes.map(note => pretty(note.name)).join(" · ")}</b></span>
    </div>
    <section className={ui.section}>
      <div className={ui.sectionHead}>
        <div className={ui.sectionTitle}><h3>{t.piano}</h3><PlayButton label={`${t.play}: ${t.piano}`} onClick={() => playPiano(notes.map(note => note.midi))} /></div>
        <span>{t.position}</span>
      </div>
      <Piano marks={notes.map((note, i) => ({ midi: note.midi, name: note.name, tag: fingers[i], root: i === 0 }))}
        label={`${t.piano}: ${notes.map((n, i) => `${pretty(n.name)} (${n.midi}, ${fingers[i]})`).join(", ")}`}
        title={`${pretty(chord.symbol)} · ${t.position}`} />
      <div className={ui.legend}>
        <span><i className={ui.rootSwatch} />{t.rootNote}</span>
        <span><i className={ui.toneSwatch} />{t.chordTone}</span>
        <span>{t.rightHand}</span>
      </div>
    </section>
    <section className={ui.section}>
      <div className={ui.sectionHead}>
        <div className={ui.sectionTitle}><h3>{t.guitar}</h3><PlayButton label={`${t.play}: ${t.guitar}`} onClick={() => playGuitar(voicing.frets.flatMap((fret, i) => fret < 0 ? [] : [TUNING[i] + fret]))} /></div>
        <span>{t.tuning}</span>
      </div>
      <div className={styles.guitarRow}>
        <ChordDiagram chord={chord} voicing={voicing} label={t.guitar} caption={t.direction} className={styles.guitar} />
        <div className={styles.guitarHelp}>
          <div className={styles.voicingControls}>
            <button type="button" className={ui.square} aria-label={t.previous} disabled={index === 0} onClick={() => commit(chord.symbol, index - 1)}>‹</button>
            <span>{t.voicing} {index + 1}/{voicings.length}</span>
            <button type="button" className={ui.square} aria-label={t.next} disabled={index === voicings.length - 1} onClick={() => commit(chord.symbol, index + 1)}>›</button>
          </div>
          <p>{t.fret}: {Math.min(...voicing.frets.filter(fret => fret > 0))}</p>
          <p className={ui.tabular}>{t.frets}<br />{voicing.frets.map(fret => fret < 0 ? "×" : fret).join(" · ")}</p>
          <p>{t.open}<br />{t.mute}</p>
          <p>{t.fingers}</p>
          {voicing.barres.length > 0 && <p>{t.barre}</p>}
        </div>
      </div>
      <p className={styles.direction}>{t.direction}</p>
    </section>
  </div>;
}
