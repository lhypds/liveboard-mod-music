import { TUNING, chordNotes, mod12 } from "./chords";
import type { Chord, Voicing } from "./chords";
import { pretty } from "./text";
import styles from "./music.module.css";

const STRINGS = ["E", "A", "D", "G", "B", "E"];

/** A guitar chord chart read low E to high E, left to right: numbered dots are fretting fingers,
 *  a bar is a barre, ○ an open string and × one not played. */
export default function ChordDiagram({ chord, voicing, label, caption, className }: {
  chord: Chord;
  voicing: Voicing;
  label: string;
  caption: string;
  className?: string;
}) {
  const notes = chordNotes(chord);
  const maxFret = Math.max(...voicing.frets);
  const start = maxFret <= 4 ? 1 : Math.min(...voicing.frets.filter(fret => fret > 0));
  const x = (string: number) => 48 + string * 30;
  const y = (fret: number) => 47 + (fret - start + 0.5) * 34;
  const description = voicing.frets.map((fret, i) => `${STRINGS[i]}: ${fret < 0 ? "×" : fret === 0 ? "○" : `${fret} (${voicing.fingers[i]})`}`).join(", ");
  return <svg className={className} viewBox="0 0 240 225" role="img" aria-label={`${label}: ${description}`}>
    <title>{pretty(chord.symbol)} · {caption}</title>
    {Array.from({ length: 5 }, (_, i) => <line key={`f${i}`} x1={x(0)} x2={x(5)} y1={47 + i * 34} y2={47 + i * 34} className={i === 0 && start === 1 ? styles.nut : styles.fret} />)}
    {Array.from({ length: 4 }, (_, i) => <text key={`n${i}`} x="28" y={69 + i * 34} textAnchor="end" className={styles.fretNumber}>{start + i}</text>)}
    {voicing.frets.map((fret, i) => <g key={i}>
      <line x1={x(i)} x2={x(i)} y1="47" y2="183" className={styles.string} style={{ strokeWidth: 1.6 - i * 0.18 }} />
      <text x={x(i)} y="16" textAnchor="middle" className={styles.stringLabel}>{i === 5 ? "e" : STRINGS[i]}</text>
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
