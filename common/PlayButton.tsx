import styles from "./music.module.css";

/** The small square ▶ button; `playing` turns it into ■. */
export default function PlayButton({ label, onClick, playing = false }: { label: string; onClick: () => void; playing?: boolean }) {
  return <button type="button" className={styles.play} aria-label={label} title={label} onClick={onClick}>
    <svg viewBox="0 0 10 10" aria-hidden="true">{playing ? <path d="M2 2h6v6H2z" /> : <path d="M2.5 1.5v7l6-3.5z" />}</svg>
  </button>;
}
