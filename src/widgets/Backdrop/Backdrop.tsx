import styles from "./Backdrop.module.scss";

const ORBS = [1, 2, 3, 4, 5] as const;

// The aurora, stars, waves and grain behind the app
const Backdrop = () => (
  <div className={styles.backdrop} aria-hidden="true">
    <div className={styles.aurora}>
      {ORBS.map((orb) => (
        <span key={orb} className={styles.orb} data-orb={orb} />
      ))}
    </div>
    <div className={styles.stars} />
    <div className={styles.waves} />
    <div className={styles.grain} />
  </div>
);

export default Backdrop;
