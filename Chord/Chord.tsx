import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "@ui/Dropdown/Dropdown";
import { ROOTS, QUALITIES, TUNING, chordNotes, guitarVoicings, mod12, parseChord, pianoFingers } from "./chords";
import type { Chord as ChordValue, Voicing } from "./chords";
import { playGuitar, playPiano } from "./audio";
import styles from "./chord.module.css";

const LABELS = {
  en: {
    input: "Enter a chord", root: "Root", quality: "Chord type", piano: "Piano", guitar: "Guitar",
    position: "Root position · C4–B5", tuning: "Standard tuning · no capo", rootNote: "Root note", chordTone: "Chord tone",
    rightHand: "Right hand · 1 thumb · 2 index · 3 middle · 4 ring · 5 little", play: "Play",
    error: "Use a root A–G, optional # / ♭, then major, m, 7, maj7, m7, sus2, sus4 or dim. Example: F#7. Slash chords are not supported yet.",
    voicing: "Voicing", previous: "Previous voicing", next: "Next voicing",
    open: "○ Open string", mute: "× Do not play", fingers: "1 index · 2 middle · 3 ring · 4 little", barre: "A connecting bar means one finger holds several strings.",
    direction: "Left → right: low E → high E", fret: "Fret", notes: "Notes", frets: "Frets",
    qualities: ["Major", "Minor", "Dominant 7", "Major 7", "Minor 7", "Sus 2", "Sus 4", "Diminished"],
  },
  zh: {
    input: "输入和弦", root: "根音", quality: "和弦类型", piano: "钢琴", guitar: "吉他",
    position: "原位和弦 · C4–B5", tuning: "标准调弦 · 无变调夹", rootNote: "根音", chordTone: "和弦音",
    rightHand: "右手 · 1 拇指 · 2 食指 · 3 中指 · 4 无名指 · 5 小指", play: "播放",
    error: "请输入 A–G 根音，可加 # / ♭，以及 m、7、maj7、m7、sus2、sus4 或 dim，例如 F#7。目前不支持斜杠和弦。",
    voicing: "指型", previous: "上一个指型", next: "下一个指型",
    open: "○ 空弦", mute: "× 不弹", fingers: "1 食指 · 2 中指 · 3 无名指 · 4 小指", barre: "连接线表示用同一根手指横按多根弦。",
    direction: "从左到右：低音 E → 高音 E", fret: "品", notes: "组成音", frets: "品位",
    qualities: ["大三和弦", "小三和弦", "属七和弦", "大七和弦", "小七和弦", "挂二和弦", "挂四和弦", "减三和弦"],
  },
  ja: {
    input: "コードを入力", root: "ルート", quality: "コードの種類", piano: "ピアノ", guitar: "ギター",
    position: "基本形 · C4–B5", tuning: "標準チューニング · カポなし", rootNote: "ルート音", chordTone: "構成音",
    rightHand: "右手 · 1 親指 · 2 人差し指 · 3 中指 · 4 薬指 · 5 小指", play: "再生",
    error: "A–G、必要に応じて # / ♭ と m、7、maj7、m7、sus2、sus4、dim を入力。例：F#7。分数コードは未対応です。",
    voicing: "フォーム", previous: "前のフォーム", next: "次のフォーム",
    open: "○ 開放弦", mute: "× 弾かない", fingers: "1 人差し指 · 2 中指 · 3 薬指 · 4 小指", barre: "連結線は一本の指で複数の弦を押さえるセーハです。",
    direction: "左 → 右：低音 E → 高音 E", fret: "フレット", notes: "構成音", frets: "フレット",
    qualities: ["メジャー", "マイナー", "セブンス", "メジャー7", "マイナー7", "サス2", "サス4", "ディミニッシュ"],
  },
};
type Labels = typeof LABELS.en;
const pretty = (note: string) => note.replace(/#/g, "♯").replace(/b/g, "♭");

function PlayButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className={styles.play} aria-label={label} title={label} onClick={onClick}>
    <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1.5v7l6-3.5z" /></svg>
  </button>;
}

function Piano({ chord, labels }: { chord: ChordValue; labels: Labels }) {
  const notes = chordNotes(chord);
  const fingers = pianoFingers(chord);
  const whites = Array.from({ length: 14 }, (_, i) => 60 + Math.floor(i / 7) * 12 + [0, 2, 4, 5, 7, 9, 11][i % 7]);
  const blacks = whites.flatMap((midi, i) => [0, 2, 5, 7, 9].includes(midi % 12) ? [{ midi: midi + 1, x: (i + 1) * 40 - 12 }] : []);
  const drawKey = (midi: number, x: number, black: boolean) => {
    const index = notes.findIndex(n => n.midi === midi);
    const note = notes[index];
    const root = index === 0;
    const cx = x + (black ? 12 : 20);
    return <g key={midi}>
      <rect x={x + 0.5} y="0.5" width={black ? 23 : 39} height={black ? 90 : 145}
        className={note ? root ? styles.rootKey : styles.activeKey : black ? styles.blackKey : styles.whiteKey} />
      {note && <>
        <text x={cx} y={black ? 58 : 108} textAnchor="middle" className={root ? styles.lightFinger : styles.finger}>{fingers[index]}</text>
        <text x={cx} y={black ? 76 : 129} textAnchor="middle" className={root ? styles.lightText : styles.keyText}>{pretty(note.name)}</text>
      </>}
      {!black && midi % 12 === 0 && !note && <text x={cx} y="129" textAnchor="middle" className={styles.octave}>C{Math.floor(midi / 12) - 1}</text>}
    </g>;
  };
  return <svg className={styles.piano} viewBox="0 0 560 146" role="img"
    aria-label={`${labels.piano}: ${notes.map((n, i) => `${pretty(n.name)} (${n.midi}, ${fingers[i]})`).join(", ")}`}>
    <title>{pretty(chord.symbol)} · {labels.position}</title>
    {whites.map((midi, i) => drawKey(midi, i * 40, false))}
    {blacks.map(({ midi, x }) => drawKey(midi, x, true))}
  </svg>;
}

function Guitar({ chord, voicing, labels }: { chord: ChordValue; voicing: Voicing; labels: Labels }) {
  const notes = chordNotes(chord);
  const maxFret = Math.max(...voicing.frets);
  const start = maxFret <= 4 ? 1 : Math.min(...voicing.frets.filter(fret => fret > 0));
  const x = (string: number) => 48 + string * 30;
  const y = (fret: number) => 47 + (fret - start + 0.5) * 34;
  const description = voicing.frets.map((fret, i) => `${["E", "A", "D", "G", "B", "E"][i]}: ${fret < 0 ? "×" : fret === 0 ? "○" : `${fret} (${voicing.fingers[i]})`}`).join(", ");
  return <svg className={styles.guitar} viewBox="0 0 240 225" role="img" aria-label={`${labels.guitar}: ${description}`}>
    <title>{pretty(chord.symbol)} · {labels.direction}</title>
    {Array.from({ length: 5 }, (_, i) => <line key={`f${i}`} x1={x(0)} x2={x(5)} y1={47 + i * 34} y2={47 + i * 34} className={i === 0 && start === 1 ? styles.nut : styles.fret} />)}
    {Array.from({ length: 4 }, (_, i) => <text key={`n${i}`} x="28" y={69 + i * 34} textAnchor="end" className={styles.fretNumber}>{start + i}</text>)}
    {voicing.frets.map((fret, i) => <g key={i}>
      <line x1={x(i)} x2={x(i)} y1="47" y2="183" className={styles.string} style={{ strokeWidth: 1.6 - i * 0.18 }} />
      <text x={x(i)} y="16" textAnchor="middle" className={styles.stringLabel}>{["E", "A", "D", "G", "B", "e"][i]}</text>
      {fret <= 0 && <text x={x(i)} y="37" textAnchor="middle" className={styles.openMarker}>{fret < 0 ? "×" : "○"}</text>}
    </g>)}
    {voicing.barres.map(barre => <line key={`${barre.fret}-${barre.from}`} x1={x(barre.from)} x2={x(barre.to)} y1={y(barre.fret)} y2={y(barre.fret)} className={styles.barre} />)}
    {voicing.frets.map((fret, i) => {
      const pitch = mod12(TUNING[i] + fret);
      const note = fret < 0 ? undefined : notes.find(n => n.midi % 12 === pitch);
      return <g key={i}>
        {fret > 0 && <>
          <circle cx={x(i)} cy={y(fret)} r="11" className={pitch === chord.pitch ? styles.rootDot : styles.toneDot} />
          <text x={x(i)} y={y(fret) + 4} textAnchor="middle" className={pitch === chord.pitch ? styles.lightText : styles.keyText}>{voicing.fingers[i]}</text>
        </>}
        <text x={x(i)} y="207" textAnchor="middle" className={styles.noteLabel}>{note ? pretty(note.name) : "–"}</text>
      </g>;
    })}
  </svg>;
}

export default function Chord({ config }: { config: Record<string, unknown> }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0];
  const t = LABELS[lang === "zh" || lang === "ja" ? lang : "en"];
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

  return <div className={styles.container}>
    <div className={styles.controls}>
      <label className={styles.inputLabel} htmlFor={id}>
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
      <div className={styles.selectLabel}><span>{t.root}</span>
        <Dropdown value={chord.root} ariaLabel={t.root}
          options={[...new Set([...ROOTS, chord.root])].map(root => ({ value: root, label: pretty(root) }))}
          onChange={root => commit(root + chord.quality)} />
      </div>
      <div className={styles.selectLabel}><span>{t.quality}</span>
        <Dropdown value={chord.quality} ariaLabel={t.quality}
          options={QUALITIES.map((quality, i) => ({ value: quality, label: t.qualities[i] }))}
          onChange={quality => commit(chord.root + quality)} />
      </div>
    </div>
    {error && <p id={`${id}-hint`} role="status" className={styles.error}>{t.error}</p>}
    <div className={styles.summary} aria-live="polite">
      <strong>{pretty(chord.symbol)}</strong>
      <span>{t.notes}<b>{notes.map(note => pretty(note.name)).join(" · ")}</b></span>
    </div>
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}><h3>{t.piano}</h3><PlayButton label={`${t.play}: ${t.piano}`} onClick={() => playPiano(notes.map(note => note.midi))} /></div>
        <span>{t.position}</span>
      </div>
      <Piano chord={chord} labels={t} />
      <div className={styles.legend}>
        <span><i className={styles.rootSwatch} />{t.rootNote}</span>
        <span><i className={styles.toneSwatch} />{t.chordTone}</span>
        <span>{t.rightHand}</span>
      </div>
    </section>
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}><h3>{t.guitar}</h3><PlayButton label={`${t.play}: ${t.guitar}`} onClick={() => playGuitar(voicing.frets.flatMap((fret, i) => fret < 0 ? [] : [TUNING[i] + fret]))} /></div>
        <span>{t.tuning}</span>
      </div>
      <div className={styles.guitarRow}>
        <Guitar chord={chord} voicing={voicing} labels={t} />
        <div className={styles.guitarHelp}>
          <div className={styles.voicingControls}>
            <button type="button" aria-label={t.previous} disabled={index === 0} onClick={() => commit(chord.symbol, index - 1)}>‹</button>
            <span>{t.voicing} {index + 1}/{voicings.length}</span>
            <button type="button" aria-label={t.next} disabled={index === voicings.length - 1} onClick={() => commit(chord.symbol, index + 1)}>›</button>
          </div>
          <p>{t.fret}: {Math.min(...voicing.frets.filter(fret => fret > 0))}</p>
          <p className={styles.tabular}>{t.frets}<br />{voicing.frets.map(fret => fret < 0 ? "×" : fret).join(" · ")}</p>
          <p>{t.open}<br />{t.mute}</p>
          <p>{t.fingers}</p>
          {voicing.barres.length > 0 && <p>{t.barre}</p>}
        </div>
      </div>
      <p className={styles.direction}>{t.direction}</p>
    </section>
  </div>;
}
