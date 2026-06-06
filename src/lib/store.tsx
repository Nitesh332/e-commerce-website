'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { CartItem, EngravingData, PageName, Product, User } from '@/lib/types';
import { PRODUCTS } from '@/lib/data';
import { getStorageItem, setStorageItem } from '@/utils/helpers';

interface State {
  cart: CartItem[];
  wishlist: number[];
  user: User | null;
  currentPage: PageName;
  currentFilter: string;
  currentProduct: Product | null;
  searchQuery: string;
  searchResults: Product[];
  toast: string;
}

type Action =
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'SET_WISHLIST'; payload: number[] }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PAGE'; payload: PageName }
  | { type: 'SET_FILTER'; payload: string }
  | { type: 'SET_PRODUCT'; payload: Product | null }
  | { type: 'SET_SEARCH'; payload: { query: string; results: Product[] } }
  | { type: 'SET_TOAST'; payload: string };

const initialState: State = {
  cart: [],
  wishlist: [],
  user: null,
  currentPage: 'home',
  currentFilter: '',
  currentProduct: null,
  searchQuery: '',
  searchResults: [],
  toast: '',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CART': return { ...state, cart: action.payload };
    case 'SET_WISHLIST': return { ...state, wishlist: action.payload };
    case 'SET_USER': return { ...state, user: action.payload };
    case 'SET_PAGE': return { ...state, currentPage: action.payload };
    case 'SET_FILTER': return { ...state, currentFilter: action.payload };
    case 'SET_PRODUCT': return { ...state, currentProduct: action.payload };
    case 'SET_SEARCH': return { ...state, searchQuery: action.payload.query, searchResults: action.payload.results };
    case 'SET_TOAST': return { ...state, toast: action.payload };
    default: return state;
  }
}

interface StoreContextType {
  state: State;
  addToCart: (id: number, qty?: number, engraving?: EngravingData) => void;
  removeFromCart: (id: number, isEngraved: boolean) => void;
  updateQty: (id: number, delta: number, isEngraved: boolean) => void;
  toggleWishlist: (id: number) => void;
  setUser: (user: User | null) => void;
  showPage: (page: PageName) => void;
  setFilter: (category: string) => void;
  setCurrentProduct: (product: Product | null) => void;
  doSearch: (query: string, category: string) => void;
  clearCart: () => void;
  showToast: (message: string) => void;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch({ type: 'SET_CART', payload: getStorageItem('sw_cart', []) });
    dispatch({ type: 'SET_WISHLIST', payload: getStorageItem('sw_wish', []) });
    dispatch({ type: 'SET_USER', payload: getStorageItem('sw_user', null) });
  }, []);

  const persistCart = useCallback((cart: CartItem[]) => {
    dispatch({ type: 'SET_CART', payload: cart });
    setStorageItem('sw_cart', cart);
  }, []);

  const persistWishlist = useCallback((wishlist: number[]) => {
    dispatch({ type: 'SET_WISHLIST', payload: wishlist });
    setStorageItem('sw_wish', wishlist);
  }, []);

  const showToast = useCallback((message: string) => {
    dispatch({ type: 'SET_TOAST', payload: message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      dispatch({ type: 'SET_TOAST', payload: '' });
    }, 3200);
  }, []);

  const addToCart = useCallback((id: number, qty = 1, engraving?: EngravingData) => {
    const newCart = [...state.cart];
    if (engraving) {
      const existing = newCart.find(x => x.id === id && x.engraving);
      if (existing) {
        existing.qty += qty;
        existing.engraving = engraving;
      } else {
        newCart.push({ id, qty, engraving });
      }
    } else {
      const existing = newCart.find(x => x.id === id && !x.engraving);
      if (existing) existing.qty += qty;
      else newCart.push({ id, qty });
    }
    persistCart(newCart);
    const p = PRODUCTS.find(x => x.id === id);
    showToast(`🛒 Added: ${p?.name.substring(0, 28)}`);
  }, [state.cart, persistCart, showToast]);

  const removeFromCart = useCallback((id: number, isEngraved: boolean) => {
    const idx = isEngraved
      ? state.cart.findIndex(x => x.id === id && x.engraving)
      : state.cart.findIndex(x => x.id === id && !x.engraving);
    if (idx > -1) {
      const newCart = [...state.cart];
      newCart.splice(idx, 1);
      persistCart(newCart);
      showToast('🗑️ Item removed');
    }
  }, [state.cart, persistCart, showToast]);

  const updateQty = useCallback((id: number, delta: number, isEngraved: boolean) => {
    const newCart = [...state.cart];
    const item = isEngraved
      ? newCart.find(x => x.id === id && x.engraving)
      : newCart.find(x => x.id === id && !x.engraving);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      newCart.splice(newCart.indexOf(item), 1);
    }
    persistCart(newCart);
  }, [state.cart, persistCart]);

  const toggleWishlist = useCallback((id: number) => {
    const newWishlist = state.wishlist.includes(id)
      ? state.wishlist.filter(x => x !== id)
      : [...state.wishlist, id];
    persistWishlist(newWishlist);
    showToast(newWishlist.includes(id) ? '❤️ Added to wishlist' : 'Removed from wishlist');
  }, [state.wishlist, persistWishlist, showToast]);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
    setStorageItem('sw_user', user);
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'SET_USER', payload: null });
    localStorage.removeItem('sw_user');
    showToast('👋 Signed out');
  }, [showToast]);

  const showPage = useCallback((page: PageName) => {
    dispatch({ type: 'SET_PAGE', payload: page });
    window.scrollTo(0, 0);
  }, []);

  const setFilter = useCallback((category: string) => {
    dispatch({ type: 'SET_FILTER', payload: category });
  }, []);

  const setCurrentProduct = useCallback((product: Product | null) => {
    dispatch({ type: 'SET_PRODUCT', payload: product });
  }, []);

  const doSearch = useCallback((query: string, category: string) => {
    const q = query.trim().toLowerCase();
    if (!q) { showToast('Enter a search term'); return; }
    const results = PRODUCTS.filter(p => {
      const match = p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q);
      return match && (category === 'All' || p.category === category);
    });
    dispatch({ type: 'SET_SEARCH', payload: { query: q, results } });
    dispatch({ type: 'SET_PAGE', payload: 'search' });
  }, [showToast]);

  const clearCart = useCallback(() => {
    persistCart([]);
  }, [persistCart]);

  return (
    <StoreContext.Provider value={{
      state, addToCart, removeFromCart, updateQty, toggleWishlist,
      setUser, showPage, setFilter, setCurrentProduct, doSearch, clearCart, showToast, logout
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
