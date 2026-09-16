import { TUNING, mod12 } from "../common/chords";
import { pretty } from "../common/text";
import ui from "../common/music.module.css";
import styles from "./scale.module.css";
import type { ScaleNote } from "./scales";

const FRETS = 12;
const NUT = 44;
const FRET_WIDTH = 40;
const MARKERS = [3, 5, 7, 9, 12];
const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

/** The scale across the first twelve frets, laid out like tab: high e on top, the nut on the left
 *  and open strings just before it. Root dots are dark; clicking a dot plays that note. */
export default function Fretboard({ notes, label, onPress }: { notes: ScaleNote[]; label: string; onPress: (midi: number) => void }) {
  const names = new Map(notes.map(note => [mod12(note.midi), note.name]));
  const root = mod12(notes[0]?.midi ?? 0);
  const x = (fret: number) => fret === 0 ? NUT - 16 : NUT + (fret - 0.5) * FRET_WIDTH;
  const y = (string: number) => 14 + (5 - string) * 22;
  return <svg className={styles.fretboard} viewBox="0 0 532 150" role="img" aria-label={label}>
    {TUNING.map((_, string) => <g key={string}>
      <line x1={NUT} x2={NUT + FRETS * FRET_WIDTH} y1={y(string)} y2={y(string)} className={ui.string} style={{ strokeWidth: 1.6 - string * 0.18 }} />
      <text x="4" y={y(string) + 4} className={ui.stringLabel}>{STRING_LABELS[string]}</text>
    </g>)}
    <line x1={NUT} x2={NUT} y1={y(5)} y2={y(0)} className={ui.nut} />
    {Array.from({ length: FRETS }, (_, i) => <line key={i} x1={NUT + (i + 1) * FRET_WIDTH} x2={NUT + (i + 1) * FRET_WIDTH} y1={y(5)} y2={y(0)} className={ui.fret} />)}
    {MARKERS.map(fret => <text key={fret} x={x(fret)} y="146" textAnchor="middle" className={ui.fretNumber}>{fret}</text>)}
    {TUNING.flatMap((open, string) => Array.from({ length: FRETS + 1 }, (_, fret) => {
      const midi = open + fret;
      const name = names.get(mod12(midi));
      if (!name) return null;
      const isRoot = mod12(midi) === root;
      return <g key={`${string}-${fret}`} className={ui.pressable} onClick={() => onPress(midi)}>
        <circle cx={x(fret)} cy={y(string)} r="9" className={isRoot ? ui.rootDot : ui.toneDot} />
        <text x={x(fret)} y={y(string) + 3.5} textAnchor="middle" className={isRoot ? styles.lightDotText : styles.dotText}>{pretty(name)}</text>
      </g>;
    }))}
  </svg>;
}
