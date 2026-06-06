'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { CATEGORIES } from '@/lib/data';
import styles from './Header.module.css';

export default function Header() {
  const { state, showPage, setFilter, doSearch } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [searchCat, setSearchCat] = useState('All');
  const [activeNav, setActiveNav] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const cartCount = state.cart.reduce((a, i) => a + i.qty, 0);

  const handleSearch = useCallback(() => {
    doSearch(searchInput, searchCat);
  }, [doSearch, searchInput, searchCat]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const handleNavClick = (idx: number, action: () => void) => {
    setActiveNav(idx);
    action();
  };

  const handleAuthClick = () => {
    if (state.user) showPage('profile');
    else {
      const event = new CustomEvent('openAuthModal');
      window.dispatchEvent(event);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <a
          className={styles.logo}
          onClick={() => { showPage('home'); setActiveNav(0); }}
          role="button"
          tabIndex={0}
          aria-label="ShopWave Home"
        >
          Shop<span>Wave</span>
        </a>

        <div className={styles.searchBar} role="search">
          <select
            className={styles.searchCategory}
            value={searchCat}
            onChange={e => setSearchCat(e.target.value)}
            aria-label="Search category"
          >
            <option>All</option>
            {CATEGORIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search products, brands and more…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleKeyPress}
            aria-label="Search products"
          />
          <button
            className={styles.searchBtn}
            onClick={handleSearch}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.hbtn} onClick={handleAuthClick} aria-label="Account">
            <span className={styles.small}>
              {state.user ? `Hello, ${state.user.name.split(' ')[0]}` : 'Hello, Sign in'}
            </span>
            <span className={styles.big}>Account &amp; Orders</span>
          </button>
          <button
            className={`${styles.hbtn} ${styles.cartBtn}`}
            onClick={() => showPage('cart')}
            aria-label={`Cart with ${cartCount} items`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={styles.cartCount}>{cartCount}</span>
            Cart
          </button>
        </div>
      </div>

      <nav className={styles.headerBottom} aria-label="Main navigation">
        <button
          className={`${styles.navLink} ${activeNav === 0 ? styles.active : ''}`}
          onClick={() => handleNavClick(0, () => showPage('home'))}
        >
          🏠 Home
        </button>
        {CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            className={`${styles.navLink} ${activeNav === idx + 1 ? styles.active : ''}`}
            onClick={() => handleNavClick(idx + 1, () => { setFilter(cat.name); showPage('home'); })}
          >
            {cat.icon} {cat.label || cat.name}
          </button>
        ))}
        <button
          className={`${styles.navLink} ${activeNav === 9 ? styles.active : ''}`}
          onClick={() => handleNavClick(9, () => showPage('profile'))}
        >
          👤 Account
        </button>
      </nav>
    </header>
  );
}
