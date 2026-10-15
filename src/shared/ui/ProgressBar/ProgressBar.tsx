import styles from "./ProgressBar.module.scss";

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
}

// A labelled native progress bar
const ProgressBar = ({ value, max, label }: ProgressBarProps) => (
  <div className={styles.track} data-complete={max > 0 && value === max ? "" : undefined}>
    <progress className="visually-hidden" value={value} max={Math.max(max, 1)} aria-label={label} />
    <span className={styles.fill} style={{ "--progress": max > 0 ? value / max : 0 }} aria-hidden="true" />
  </div>
);

export default ProgressBar;
