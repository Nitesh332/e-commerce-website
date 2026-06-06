'use client';

import { useStore } from '@/lib/store';
import styles from './Toast.module.css';

export default function Toast() {
  const { state } = useStore();

  return (
    <div
      className={`${styles.toast} ${state.toast ? styles.show : ''}`}
      role="alert"
      aria-live="polite"
    >
      {state.toast}
    </div>
  );
}
