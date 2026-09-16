import { pretty } from "./text";
import styles from "./music.module.css";

/** A key to fill: the root is drawn dark, the rest gold, and `tag` (a finger, a scale degree) sits over the note name. */
export type PianoMark = { midi: number; name: string; tag?: string | number; root?: boolean };

const WHITE_STEPS = [0, 2, 4, 5, 7, 9, 11];

/** Two octaves of keyboard, C4–B5. `onPress` makes every key playable with a click. */
export default function Piano({ marks, label, title, onPress }: {
  marks: PianoMark[];
  label: string;
  title: string;
  onPress?: (midi: number) => void;
}) {
  const whites = Array.from({ length: 14 }, (_, i) => 60 + Math.floor(i / 7) * 12 + WHITE_STEPS[i % 7]);
  const blacks = whites.flatMap((midi, i) => [0, 2, 5, 7, 9].includes(midi % 12) ? [{ midi: midi + 1, x: (i + 1) * 40 - 12 }] : []);
  const drawKey = (midi: number, x: number, black: boolean) => {
    const mark = marks.find(m => m.midi === midi);
    const cx = x + (black ? 12 : 20);
    return <g key={midi} className={onPress ? styles.pressable : undefined} onClick={onPress && (() => onPress(midi))}>
      <rect x={x + 0.5} y="0.5" width={black ? 23 : 39} height={black ? 90 : 145}
        className={mark ? mark.root ? styles.rootKey : styles.activeKey : black ? styles.blackKey : styles.whiteKey} />
      {mark && <>
        {mark.tag !== undefined && <text x={cx} y={black ? 58 : 108} textAnchor="middle" className={mark.root ? styles.lightFinger : styles.finger}>{pretty(String(mark.tag))}</text>}
        <text x={cx} y={black ? 76 : 129} textAnchor="middle" className={mark.root ? styles.lightText : styles.keyText}>{pretty(mark.name)}</text>
      </>}
      {!black && midi % 12 === 0 && !mark && <text x={cx} y="129" textAnchor="middle" className={styles.octave}>C{Math.floor(midi / 12) - 1}</text>}
    </g>;
  };
  return <svg className={styles.piano} viewBox="0 0 560 146" role="img" aria-label={label}>
    <title>{title}</title>
    {whites.map((midi, i) => drawKey(midi, i * 40, false))}
    {blacks.map(({ midi, x }) => drawKey(midi, x, true))}
  </svg>;
}
