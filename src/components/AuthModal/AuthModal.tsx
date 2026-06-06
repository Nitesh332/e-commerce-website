'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import styles from './AuthModal.module.css';

export default function AuthModal() {
  const { setUser, showToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('openAuthModal', handler);
    return () => window.removeEventListener('openAuthModal', handler);
  }, []);

  const close = () => setIsOpen(false);

  const handleLogin = useCallback(() => {
    if (!loginEmail || !loginPass) { showToast('⚠️ Please fill all fields'); return; }
    const name = loginEmail.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setUser({ name, email: loginEmail });
    close();
    showToast(`👋 Welcome back, ${name.split(' ')[0]}!`);
  }, [loginEmail, loginPass, setUser, showToast]);

  const handleRegister = useCallback(() => {
    if (!regName || !regEmail || !regPass) { showToast('⚠️ Fill all fields'); return; }
    if (regPass.length < 6) { showToast('⚠️ Password ≥ 6 chars'); return; }
    setUser({ name: regName, email: regEmail });
    close();
    showToast(`🎉 Welcome, ${regName.split(' ')[0]}!`);
  }, [regName, regEmail, regPass, setUser, showToast]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={close} role="dialog" aria-modal="true" aria-label="Authentication">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={close} aria-label="Close modal">✕</button>
        <div className={styles.inner}>
          <h2 className={styles.title}>Welcome to ShopWave</h2>
          <p className={styles.subtitle}>Sign in or create your account</p>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'login' ? styles.activeTab : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`${styles.tab} ${tab === 'register' ? styles.activeTab : ''}`} onClick={() => setTab('register')}>Create Account</button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
              <div className={styles.formGroup}>
                <label htmlFor="login-email">Email</label>
                <input id="login-email" className={styles.formInput} type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Enter your email" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="login-pass">Password</label>
                <input id="login-pass" className={styles.formInput} type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Enter your password" />
              </div>
              <button type="submit" className={styles.submitBtn}>Sign In</button>
            </form>
          ) : (
            <form onSubmit={e => { e.preventDefault(); handleRegister(); }}>
              <div className={styles.formGroup}>
                <label htmlFor="reg-name">Full Name</label>
                <input id="reg-name" className={styles.formInput} type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="reg-email">Email</label>
                <input id="reg-email" className={styles.formInput} type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Your email address" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="reg-pass">Password</label>
                <input id="reg-pass" className={styles.formInput} type="password" value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Create a password (min 6 chars)" />
              </div>
              <button type="submit" className={styles.submitBtn}>Create Account</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
