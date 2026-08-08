import type { ReactNode } from 'react';
import { LanguageSelector } from '../components/LanguageSelector/LanguageSelector';
import styles from './AuthLayout.module.css';

export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className={styles.page}>
    <div className={styles.topBar}>
      <LanguageSelector width="50%" />
    </div>
    <div className={styles.content}>{children}</div>
  </div>
);
