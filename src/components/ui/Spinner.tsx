import styles from './Spinner.module.css';

export const Spinner = () => (
  <div className={styles.wrap} role="status" aria-live="polite">
    <div className={styles.spinner} />
  </div>
);
