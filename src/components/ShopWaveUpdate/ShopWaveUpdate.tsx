'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './ShopWaveUpdate.module.css';
import {
  ENGRAVE_CHARGE,
  FONTS,
  PRODUCTS,
  type AIRecommendation,
  type CartItem,
  type EngravingEffect,
  type EngravingSnapshot,
  type Product,
  type UserProfile,
} from '@/lib/shopwave-data';

const CATEGORY_OPTIONS = [
  'All',
  'Electronics',
  'Clothing',
  'Home',
  'Books',
  'Sports',
  'Beauty',
  'Toys',
  'Garden',
];

const PRICE_FILTERS = [
  { value: '', label: 'Any Price' },
  { value: '0-500', label: 'Under ₹500' },
  { value: '500-2000', label: '₹500–₹2,000' },
  { value: '2000-10000', label: '₹2,000–₹10,000' },
  { value: '10000-999999', label: 'Over ₹10,000' },
];

const RATING_FILTERS = [
  { value: '', label: 'Any Rating' },
  { value: '4', label: '4★ & Up' },
  { value: '3', label: '3★ & Up' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Sort: Featured' },
  { value: 'price-asc', label: 'Price: Low→High' },
  { value: 'price-desc', label: 'Price: High→Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'Name A–Z' },
];

type PageKey = 'home' | 'search' | 'product-detail' | 'cart' | 'checkout' | 'profile' | 'success';

const SEARCH_HEADER_EMPTY = 'Search results appear here.';

const PAYMENT_OPTIONS = [
  { value: 'upi', label: 'UPI Payment', description: 'GPay, PhonePe, Paytm', icon: '📱' },
  { value: 'card', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay', icon: '💳' },
  { value: 'cod', label: 'Cash on Delivery', description: 'Pay when delivered', icon: '💵' },
];

const COLOR_OPTIONS = [
  { color: '#FFD700', title: 'Gold' },
  { color: '#C0C0C0', title: 'Silver' },
  { color: '#ffffff', title: 'White', border: 'rgba(255,255,255,.3)' },
  { color: '#1a1a1a', title: 'Black', border: 'rgba(255,255,255,.15)' },
  { color: '#7c3aed', title: 'Purple' },
  { color: '#0ea5e9', title: 'Blue' },
  { color: '#ef4444', title: 'Red' },
  { color: '#10b981', title: 'Teal' },
];

const HERO_PARTICLES = [
  { left: '10%', width: 4, height: 4, background: '#7c3aed', duration: '8s', delay: '0s' },
  { left: '25%', width: 3, height: 3, background: '#ff6b00', duration: '11s', delay: '2s' },
  { left: '60%', width: 5, height: 5, background: '#3b82f6', duration: '9s', delay: '4s' },
  { left: '80%', width: 3, height: 3, background: '#10b981', duration: '12s', delay: '1s' },
];

const NAV_LINKS: Array<{ label: string; page?: PageKey; category?: string }> = [
  { label: '🏠 Home', page: 'home' },
  { label: '📱 Electronics', category: 'Electronics' },
  { label: '👗 Fashion', category: 'Clothing' },
  { label: '🏡 Home', category: 'Home' },
  { label: '📚 Books', category: 'Books' },
  { label: '⚽ Sports', category: 'Sports' },
  { label: '💄 Beauty', category: 'Beauty' },
  { label: '🧸 Toys', category: 'Toys' },
  { label: '🌱 Garden', category: 'Garden' },
  { label: '👤 Account', page: 'profile' },
];

const ORDER_HISTORY = [
  { emoji: '📱', name: 'iPhone 15 Pro Max', date: 'Jun 1, 2025', status: 'delivered', engraving: 'Rahul' },
  { emoji: '💻', name: 'MacBook Air M3', date: 'May 20, 2025', status: 'delivered', engraving: 'My MacBook' },
  { emoji: '🎧', name: 'Sony WH-1000XM5', date: 'May 10, 2025', status: 'delivered', engraving: null },
  { emoji: '👟', name: 'Nike Air Max 270', date: 'Apr 28, 2025', status: 'transit', engraving: null },
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function formatPrice(value: number) {
  return '₹' + value.toLocaleString('en-IN');
}

function starsLabel(rating: number) {
  const fullStars = Math.floor(rating);
  const stars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  return `${stars} ${rating}`;
}

function badgeLabel(badge?: Product['badge']) {
  if (badge === 'prime') return '⚡ PRIME';
  if (badge === 'sale') return 'SALE';
  if (badge === 'new') return 'NEW';
  return '';
}

function fontCss(font: { fontFamily: string }, size: number) {
  return `bold ${size}px ${font.fontFamily}`;
}

function drawBase(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  width: number,
  height: number,
  product: Product,
  dark: boolean,
) {
  const background = ctx.createLinearGradient(0, 0, width, height);
  if (dark) {
    background.addColorStop(0, '#1c1c24');
    background.addColorStop(0.4, '#23232e');
    background.addColorStop(1, '#141418');
  } else {
    background.addColorStop(0, '#e8e8ec');
    background.addColorStop(1, '#d0d0d8');
  }

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${0.01 + Math.sin(y / 8) * 0.008})`;
    ctx.fillRect(0, y, width, 1);
  }

  if (image) {
    const aspect = image.naturalWidth / image.naturalHeight;
    let dw = width * 0.8;
    let dh = dw / aspect;
    if (dh > height * 0.8) {
      dh = height * 0.8;
      dw = dh * aspect;
    }
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;
    ctx.save();
    ctx.globalAlpha = 0.92;
    try {
      ctx.drawImage(image, dx, dy, dw, dh);
    } catch {
      // ignore image draw errors
    }
    ctx.restore();

    const glow = ctx.createRadialGradient(width / 2, height * 0.85, 0, width / 2, height * 0.85, width * 0.35);
    glow.addColorStop(0, 'rgba(255,255,255,0.07)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.font = `${width * 0.28}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(product.emoji, width / 2, height / 2);
  }
}

function drawRealisticEngraving(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontIdx: number,
  color: string,
  size: number,
  opacity: number,
  effect: EngravingEffect,
) {
  if (!text.trim()) return;
  const font = FONTS[fontIdx];
  ctx.save();
  ctx.font = fontCss(font, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  if (effect === 'laser') {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.8;
    ctx.fillStyle = `rgba(${r},${g},${b},${opacity * 0.15})`;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(text, x + 1.5, y + 1.5);
    const grad = ctx.createLinearGradient(x - textWidth / 2, y - size / 2, x + textWidth / 2, y + size / 2);
    grad.addColorStop(0, `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},${opacity})`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},${opacity})`);
    grad.addColorStop(0.7, `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},${opacity * 0.9})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},${opacity * 0.8})`);
    ctx.fillStyle = grad;
    ctx.fillText(text, x, y);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(${Math.min(255, r + 100)},${Math.min(255, g + 100)},${Math.min(255, b + 100)},0.3)`;
    ctx.fillText(text, x, y - size * 0.06);
    ctx.restore();
    ctx.strokeStyle = `rgba(${r},${g},${b},${opacity * 0.6})`;
    ctx.lineWidth = 0.8;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(x - textWidth / 2 - 8, y + size * 0.55);
    ctx.lineTo(x + textWidth / 2 + 8, y + size * 0.55);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (effect === 'emboss') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(text, x + 3, y + 3);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillText(text, x + 1.5, y + 1.5);
    ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
    ctx.fillText(text, x, y);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(text, x - 1, y - 1);
  } else if (effect === 'neon') {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 1.5;
    ctx.fillStyle = `rgba(${r},${g},${b},0.3)`;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = size * 0.8;
    ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = size * 0.3;
    ctx.fillStyle = `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},${opacity})`;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 3;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(text, x, y);
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(text, x, y);
    ctx.fillStyle = `rgba(${Math.min(255, r + 100)},${Math.min(255, g + 100)},${Math.min(255, b + 100)},0.4)`;
    ctx.fillText(text, x, y + 2);
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillText(text, x, y - 1);
    ctx.fillStyle = `rgba(${r},${g},${b},${opacity * 0.7})`;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}

function getPriceRangeRange(value: string) {
  const [min, max] = value.split('-').map(Number);
  return { min, max };
}

function usePersistentState<T>(storageKey: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized.current) return;
    isInitialized.current = true;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setValue(safeParse(stored, initialValue));
    }
  }, [storageKey, initialValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue] as const;
}

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

const ShopWaveUpdate = () => {
  const [currentPage, setCurrentPage] = useState<PageKey>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<string>('All');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailImageIndex, setDetailImageIndex] = useState<number>(0);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [cart, setCart] = usePersistentState<CartItem[]>('sw_cart2', []);
  const [wishlist, setWishlist] = usePersistentState<number[]>('sw_wish2', []);
  const [user, setUser] = usePersistentState<UserProfile | null>('sw_user2', null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [engravingOpen, setEngravingOpen] = useState(false);
  const [engravingProduct, setEngravingProduct] = useState<Product | null>(null);
  const [engravingText, setEngravingText] = useState('');
  const [engravingFontIdx, setEngravingFontIdx] = useState(0);
  const [engravingColor, setEngravingColor] = useState('#FFD700');
  const [engravingSize, setEngravingSize] = useState(22);
  const [engravingOpacity, setEngravingOpacity] = useState(0.9);
  const [engravingEffect, setEngravingEffect] = useState<EngravingEffect>('laser');
  const [engravingView, setEngravingView] = useState<'back' | 'front'>('back');
  const [engravingX, setEngravingX] = useState(0.5);
  const [engravingY, setEngravingY] = useState(0.78);
  const [engravingImage, setEngravingImage] = useState<HTMLImageElement | null>(null);
  const [engravingBackImage, setEngravingBackImage] = useState<HTMLImageElement | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[] | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [checkoutAddress, setCheckoutAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    pin: '',
    phone: '',
  });
  const [orderId, setOrderId] = useState('');
  const [placedEngravingNotes, setPlacedEngravingNotes] = useState<string[]>([]);

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const compareBeforeRef = useRef<HTMLCanvasElement | null>(null);
  const compareAfterRef = useRef<HTMLCanvasElement | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const shopNowRef = useRef<HTMLDivElement | null>(null);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

  const filteredProducts = useMemo(() => {
    let list = PRODUCTS.slice();
    if (selectedCategory) {
      list = list.filter((product) => product.category === selectedCategory);
    }
    if (priceFilter) {
      const { min, max } = getPriceRangeRange(priceFilter);
      list = list.filter((product) => product.price >= min && product.price <= max);
    }
    if (ratingFilter) {
      list = list.filter((product) => product.rating >= Number(ratingFilter));
    }
    if (sortOption === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [selectedCategory, priceFilter, ratingFilter, sortOption]);

  const productsHeading = selectedCategory ? `${selectedCategory} Products` : 'Featured Products';

  const searchHeader = useMemo(() => {
    if (!searchQuery.trim()) return SEARCH_HEADER_EMPTY;
    return `Showing ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"${searchCategory !== 'All' ? ` in ${searchCategory}` : ''}`;
  }, [searchQuery, searchCategory, searchResults.length]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      const inCategory = searchCategory === 'All' || product.category === searchCategory;
      const matches =
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.desc.toLowerCase().includes(query);
      return inCategory && matches;
    });
  }, [searchCategory, searchQuery]);

  const checkoutTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const product = PRODUCTS.find((product) => product.id === item.id);
      if (!product) return sum;
      const engravingCharge = item.engraving ? ENGRAVE_CHARGE * item.qty : 0;
      return sum + product.price * item.qty + engravingCharge;
    }, 0);
    const delivery = subtotal > 499 ? 0 : 49;
    const discount = Math.round(subtotal * 0.05);
    const total = subtotal + delivery - discount;
    return { subtotal, delivery, discount, total };
  }, [cart]);

  const profileInitials = useMemo(() => {
    if (!user) return 'SW';
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const profileWishlistProducts = useMemo(
    () => wishlist.map((id) => PRODUCTS.find((product) => product.id === id)).filter(Boolean) as Product[],
    [wishlist],
  );

  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const product = PRODUCTS.find((product) => product.id === item.id);
      if (!product) return sum;
      const engravingCharge = item.engraving ? ENGRAVE_CHARGE * item.qty : 0;
      return sum + product.price * item.qty + engravingCharge;
    }, 0);
    const originalTotal = cart.reduce((sum, item) => {
      const product = PRODUCTS.find((product) => product.id === item.id);
      if (!product) return sum;
      return sum + product.originalPrice * item.qty;
    }, 0);
    const engravingTotal = cart.reduce((sum, item) => (item.engraving ? sum + ENGRAVE_CHARGE * item.qty : sum), 0);
    const savings = originalTotal - subtotal + engravingTotal;
    const delivery = subtotal > 499 ? 0 : 49;
    return { subtotal, engravingTotal, savings, delivery, total: subtotal + delivery, quantity: cart.reduce((sum, item) => sum + item.qty, 0) };
  }, [cart]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastVisible(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const openPage = useCallback((page: typeof currentPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFilterNavigation = useCallback(
    (category?: string, page?: typeof currentPage) => {
      if (category) {
        setSelectedCategory(category);
        setSortOption('');
        setPriceFilter('');
        setRatingFilter('');
      }
      if (page) {
        openPage(page);
      } else {
        openPage('home');
      }
      if (category) {
        setTimeout(() => shopNowRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
      }
    },
    [openPage],
  );

  const performSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      showToast('Enter a search term');
      return;
    }
    setSearchResults(searchMatches);
    openPage('search');
  }, [openPage, searchMatches, searchQuery, showToast]);

  const openProduct = useCallback((productId: number) => {
    const product = PRODUCTS.find((item) => item.id === productId);
    if (!product) return;
    setDetailProduct(product);
    setDetailImageIndex(0);
    setDetailQty(1);
    openPage('product-detail');
  }, [openPage]);

  const setActiveNavItem = useCallback((page: typeof currentPage) => {
    setCurrentPage(page);
  }, []);

  const addToCartById = useCallback(
    (productId: number, qty = 1, engraving?: EngravingSnapshot) => {
      setCart((previousCart) => {
        const existingIndex = previousCart.findIndex((item) => item.id === productId && Boolean(item.engraving) === Boolean(engraving));
        if (existingIndex >= 0) {
          const next = [...previousCart];
          next[existingIndex] = { ...next[existingIndex], qty: next[existingIndex].qty + qty };
          return next;
        }
        return [...previousCart, { id: productId, qty, engraving }];
      });
      const product = PRODUCTS.find((item) => item.id === productId);
      if (product) {
        showToast(`🛒 Added: ${product.name.substring(0, 28)}`);
      }
    },
    [showToast],
  );

  const addToCartByEvent = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, productId: number) => {
      event.stopPropagation();
      addToCartById(productId, 1);
    },
    [addToCartById],
  );

  const addToCartDetail = useCallback(() => {
    if (detailProduct) {
      addToCartById(detailProduct.id, detailQty);
    }
  }, [addToCartById, detailProduct, detailQty]);

  const buyNow = useCallback(() => {
    addToCartDetail();
    openPage('checkout');
  }, [addToCartDetail, openPage]);

  const toggleWishlist = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, productId: number) => {
      event.stopPropagation();
      setWishlist((previousWishlist) => {
        const exists = previousWishlist.includes(productId);
        if (exists) {
          showToast('Removed from wishlist');
          return previousWishlist.filter((id) => id !== productId);
        }
        showToast('❤️ Added to wishlist');
        return [...previousWishlist, productId];
      });
    },
    [showToast],
  );

  const toggleWishlistDetail = useCallback(() => {
    if (!detailProduct) return;
    setWishlist((previousWishlist) => {
      const exists = previousWishlist.includes(detailProduct.id);
      if (exists) {
        showToast('Removed from wishlist');
        return previousWishlist.filter((id) => id !== detailProduct.id);
      }
      showToast('❤️ Saved to wishlist');
      return [...previousWishlist, detailProduct.id];
    });
  }, [detailProduct, showToast]);

  const selectPayment = useCallback((value: string) => {
    setPaymentMethod(value);
  }, []);

  const changeDetailQty = useCallback((value: number) => {
    setDetailQty(value);
  }, []);

  const openAuthModal = useCallback(() => {
    setAuthTab('login');
    setAuthOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthOpen(false);
  }, []);

  const handleAuthTab = useCallback((tab: 'login' | 'register') => {
    setAuthTab(tab);
  }, []);

  const updateAuthUI = useCallback(() => {
    if (user) {
      setAuthName(user.name);
      setAuthEmail(user.email);
    } else {
      setAuthName('');
      setAuthEmail('');
    }
  }, [user]);

  useEffect(() => {
    updateAuthUI();
  }, [updateAuthUI]);

  const doLogin = useCallback(() => {
    if (!authEmail || !authPassword) {
      showToast('⚠️ Please fill all fields');
      return;
    }
    const name = authEmail.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const account: UserProfile = { name, email: authEmail };
    setUser(account);
    closeAuthModal();
    showToast(`👋 Welcome back, ${name.split(' ')[0]}!`);
  }, [authEmail, authPassword, closeAuthModal, setUser, showToast]);

  const doRegister = useCallback(() => {
    if (!authName || !authEmail || !authPassword) {
      showToast('⚠️ Fill all fields');
      return;
    }
    if (authPassword.length < 6) {
      showToast('⚠️ Password ≥ 6 chars');
      return;
    }
    const account: UserProfile = { name: authName, email: authEmail };
    setUser(account);
    closeAuthModal();
    showToast(`🎉 Welcome, ${authName.split(' ')[0]}!`);
  }, [authEmail, authName, authPassword, closeAuthModal, setUser, showToast]);

  const doLogout = useCallback(() => {
    setUser(null);
    showToast('👋 Signed out');
    openPage('home');
  }, [openPage, setUser, showToast]);

  const handleEngravingOpen = useCallback(
    async (productId: number, event?: React.MouseEvent<HTMLButtonElement>) => {
      event?.stopPropagation();
      const product = PRODUCTS.find((item) => item.id === productId);
      if (!product) return;
      setEngravingProduct(product);
      setEngravingText('');
      setEngravingFontIdx(0);
      setEngravingColor('#FFD700');
      setEngravingSize(22);
      setEngravingOpacity(0.9);
      setEngravingEffect('laser');
      setEngravingView('back');
      setEngravingX(0.5);
      setEngravingY(0.78);
      setEngravingOpen(true);
      const loadedFront = await loadImage(product.img);
      const loadedBack = product.backImg ? await loadImage(product.backImg) : null;
      setEngravingImage(loadedFront);
      setEngravingBackImage(loadedBack || loadedFront);
    },
    [],
  );

  const closeEngraving = useCallback(() => {
    setEngravingOpen(false);
  }, []);

  const handleEngravingText = useCallback((value: string) => {
    const sanitized = value.slice(0, 20);
    setEngravingText(sanitized);
  }, []);

  const handleFontSelect = useCallback((index: number) => {
    setEngravingFontIdx(index);
  }, []);

  const handleSizeChange = useCallback((value: number) => {
    setEngravingSize(value);
  }, []);

  const handleOpacityChange = useCallback((value: number) => {
    setEngravingOpacity(value / 100);
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setEngravingColor(color);
  }, []);

  const handleEffectSelect = useCallback((effect: EngravingEffect) => {
    setEngravingEffect(effect);
  }, []);

  const handleViewSelect = useCallback((view: 'back' | 'front') => {
    setEngravingView(view);
  }, []);

  const handleEngravingConfirm = useCallback(() => {
    if (!engravingProduct) return;
    if (!engravingText.trim()) {
      showToast('⚠️ Please enter text to engrave');
      return;
    }
    const engravingSnapshot: EngravingSnapshot = {
      text: engravingText,
      fontIdx: engravingFontIdx,
      color: engravingColor,
      size: engravingSize,
      opacity: engravingOpacity,
      effect: engravingEffect,
      xPct: engravingX,
      yPct: engravingY,
    };
    addToCartById(engravingProduct.id, 1, engravingSnapshot);
    closeEngraving();
    showToast(`✨ "${engravingText}" engraved! +₹499`);
  }, [addToCartById, closeEngraving, engravingColor, engravingEffect, engravingFontIdx, engravingProduct, engravingOpacity, engravingSize, engravingText, engravingX, engravingY, showToast]);

  const updateQty = useCallback((productId: number, delta: number, engraved: boolean) => {
    setCart((previousCart) => {
      const next = previousCart.map((item) => {
        if (item.id !== productId) return item;
        const isEngraved = Boolean(item.engraving);
        if (isEngraved !== engraved) return item;
        return { ...item, qty: item.qty + delta };
      });
      return next.filter((item) => item.qty > 0);
    });
  }, []);

  const removeCartItem = useCallback((productId: number, engraved: boolean) => {
    setCart((previousCart) => previousCart.filter((item) => item.id !== productId || Boolean(item.engraving) !== engraved));
    showToast('🗑️ Item removed');
  }, [showToast]);

  const selectThumbnail = useCallback((index: number) => {
    setDetailImageIndex(index);
  }, []);

  const loadAIRecommendations = useCallback(async () => {
    setAiLoading(true);
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 700,
            messages: [
              {
                role: 'user',
                content: `You are ShopWave India AI. Pick 4 varied products from the catalog and return ONLY valid JSON array: [{"id": number, "reason": "text"}].`,
              },
            ],
          }),
        });
        const data = await response.json();
        const text = data?.content?.map?.((item: any) => item.text || '').join('') ?? '';
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        setAiRecommendations(parsed);
      } catch {
        const randomPicks = PRODUCTS.sort(() => Math.random() - 0.5).slice(0, 4).map((product) => ({ id: product.id, reason: 'Top rated pick' }));
        setAiRecommendations(randomPicks);
      }
    } else {
      const fallback = PRODUCTS.sort(() => Math.random() - 0.5).slice(0, 4).map((product) => ({ id: product.id, reason: 'Top rated pick' }));
      setAiRecommendations(fallback);
    }
    setAiLoading(false);
  }, []);

  useEffect(() => {
    loadAIRecommendations();
  }, [loadAIRecommendations]);

  const handleOrderPlace = useCallback(() => {
    if (!checkoutAddress.address || !checkoutAddress.city || !checkoutAddress.firstName) {
      showToast('⚠️ Please fill delivery address');
      return;
    }
    const newOrderId = `SW${Date.now().toString().slice(-8)}`;
    setOrderId(newOrderId);
    const engravingNotes = cart
      .filter((item) => item.engraving)
      .map((item) => {
        const product = PRODUCTS.find((product) => product.id === item.id);
        return product ? `${product.name.substring(0, 28)} — "${item.engraving?.text}"` : '';
      })
      .filter(Boolean) as string[];
    setPlacedEngravingNotes(engravingNotes);
    setCart([]);
    showToast('🎉 Order placed!');
    openPage('success');
  }, [cart, checkoutAddress.address, checkoutAddress.city, checkoutAddress.firstName, openPage, setCart, showToast]);

  const handleCheckoutInput = useCallback((field: keyof typeof checkoutAddress, value: string) => {
    setCheckoutAddress((previous) => ({ ...previous, [field]: value }));
  }, []);

  const compareProducts = currentPage === 'search' ? searchResults : filteredProducts;

  useEffect(() => {
    if (currentPage === 'search' && searchQuery.trim()) {
      setSearchResults(searchMatches);
    }
  }, [currentPage, searchMatches, searchQuery]);

  const renderMainCanvas = useCallback(() => {
    if (!mainCanvasRef.current || !engravingProduct) return;
    const canvas = mainCanvasRef.current;
    const width = 380;
    const height = 380;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawImage = engravingView === 'back' ? engravingBackImage || engravingImage : engravingImage || engravingBackImage;
    drawBase(ctx, drawImage, width, height, engravingProduct, true);

    if (engravingView === 'back') {
      if (engravingText.trim()) {
        drawRealisticEngraving(
          ctx,
          engravingText,
          engravingX * width,
          engravingY * height,
          engravingFontIdx,
          engravingColor,
          engravingSize,
          engravingOpacity,
          engravingEffect,
        );
      } else {
        ctx.fillStyle = 'rgba(124,58,237,0.3)';
        ctx.font = "bold 13px 'Outfit',sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Type text → see live engraving', width / 2, height * 0.82);
        ctx.strokeStyle = 'rgba(124,58,237,0.25)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(width / 2, height * 0.78, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = "bold 11px 'Outfit',sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('← Switch to Back for engraving', width / 2, height - 12);
    }

    if (compareBeforeRef.current) {
      const compareBefore = compareBeforeRef.current;
      compareBefore.width = 110;
      compareBefore.height = 110;
      const beforeCtx = compareBefore.getContext('2d');
      if (beforeCtx) {
        drawBase(beforeCtx, engravingBackImage || engravingImage, 110, 110, engravingProduct, true);
      }
    }

    if (compareAfterRef.current) {
      const compareAfter = compareAfterRef.current;
      compareAfter.width = 110;
      compareAfter.height = 110;
      const afterCtx = compareAfter.getContext('2d');
      if (afterCtx) {
        drawBase(afterCtx, engravingBackImage || engravingImage, 110, 110, engravingProduct, true);
        if (engravingText.trim()) {
          drawRealisticEngraving(
            afterCtx,
            engravingText,
            110 / 2,
            110 * 0.75,
            engravingFontIdx,
            engravingColor,
            Math.max(10, engravingSize * 0.5),
            engravingOpacity,
            engravingEffect,
          );
        }
      }
    }
  }, [engravingBackImage, engravingColor, engravingEffect, engravingFontIdx, engravingImage, engravingOpen, engravingOpacity, engravingProduct, engravingSize, engravingText, engravingView, engravingX, engravingY]);

  useEffect(() => {
    if (engravingOpen) {
      requestAnimationFrame(renderMainCanvas);
    }
  }, [engravingOpen, renderMainCanvas]);

  useEffect(() => {
    if (!engravingOpen) return;
    requestAnimationFrame(renderMainCanvas);
  }, [engravingText, engravingFontIdx, engravingColor, engravingSize, engravingOpacity, engravingEffect, engravingView, engravingX, engravingY, renderMainCanvas, engravingImage, engravingBackImage, engravingProduct, engravingOpen]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragMove = useCallback(
    (event: PointerEvent) => {
      if (!engravingOpen || !isDragging) return;
      const rect = canvasWrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp((event.clientX - rect.left) / rect.width, 0.05, 0.95);
      const y = clamp((event.clientY - rect.top) / rect.height, 0.05, 0.95);
      setEngravingX(x);
      setEngravingY(y);
    },
    [engravingOpen, isDragging],
  );

  useEffect(() => {
    const onPointerUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [handleDragMove]);

  const handleDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const cartItemElements = useMemo(
    () =>
      cart.map((item) => {
        const product = PRODUCTS.find((product) => product.id === item.id);
        if (!product) return null;
        const engraving = item.engraving;
        const itemTotal = product.price * item.qty + (engraving ? ENGRAVE_CHARGE * item.qty : 0);
        return (
          <div className={styles['cart-item']} key={`${item.id}-${engraving ? 'engraved' : 'standard'}`}>
            <div className={styles['cart-item-img']}>
              <img src={product.img} alt={product.name} />
            </div>
            {engraving ? (
              <div className={styles['cart-engrave-preview']}>
                <MiniEngravingPreview product={product} engraving={engraving} />
              </div>
            ) : null}
            <div className={styles['cart-item-info']}>
              <button type="button" className={styles['cart-item-name']} onClick={() => openProduct(product.id)}>
                {product.name}
              </button>
              <div className={styles['cart-item-brand']}>
                {product.brand} · {product.category}
              </div>
              {engraving ? (
                <div className={styles['cart-item-engrave']}>
                  ✍️ Engraved: "{engraving.text}" · {FONTS[engraving.fontIdx]?.name ?? 'Classic Serif'} · +₹{ENGRAVE_CHARGE}
                </div>
              ) : null}
              <div className={styles['cart-item-meta']}>
                <div className={styles['qty-control']}>
                  <button type="button" className={styles['qty-btn']} onClick={() => updateQty(product.id, -1, Boolean(engraving))}>
                    −
                  </button>
                  <span className={styles['qty-display']}>{item.qty}</span>
                  <button type="button" className={styles['qty-btn']} onClick={() => updateQty(product.id, 1, Boolean(engraving))}>
                    +
                  </button>
                </div>
                <button type="button" className={styles['remove-btn']} onClick={() => removeCartItem(product.id, Boolean(engraving))}>
                  Delete
                </button>
              </div>
            </div>
            <div className={styles['cart-item-price']}>
              <div className={styles.amount}>{formatPrice(itemTotal)}</div>
              {item.qty > 1 ? <div className={styles['cart-item-subtotal']}>{formatPrice(product.price + (engraving ? ENGRAVE_CHARGE : 0))} each</div> : null}
              {engraving ? <div className={styles['cart-item-engrave-note']}>incl. ✍️ engraving</div> : null}
            </div>
          </div>
        );
      }).filter(Boolean),
    [cart, removeCartItem, updateQty],
  );

  function MiniEngravingPreview({ product, engraving }: { product: Product; engraving: EngravingSnapshot }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      const drawPreview = async () => {
        if (!canvasRef.current) return;
        const image = await loadImage(product.backImg || product.img);
        const canvas = canvasRef.current;
        const width = 58;
        const height = 58;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        drawBase(ctx, image, width, height, product, true);
        if (engraving.text) {
          drawRealisticEngraving(
            ctx,
            engraving.text,
            (engraving.xPct || 0.5) * width,
            (engraving.yPct || 0.75) * height,
            engraving.fontIdx || 0,
            engraving.color || '#FFD700',
            Math.max(8, engraving.size * 0.4),
            engraving.opacity || 0.9,
            engraving.effect || 'laser',
          );
        }
      };
      drawPreview();
    }, [engraving, product]);

    return <canvas ref={canvasRef} />;
  }

  const searchResultsContent = searchResults.length ? (
    searchResults.map((product) => (
      <ProductCard key={product.id} product={product} openProduct={openProduct} addToCartByEvent={addToCartByEvent} handleEngravingOpen={handleEngravingOpen} isWishlisted={wishlist.includes(product.id)} toggleWishlist={toggleWishlist} />
    ))
  ) : (
    <div className={styles['empty-state']}>
      <div className={styles['empty-icon']}>🔍</div>
      <h3>No results</h3>
      <p>Try different keywords.</p>
    </div>
  );

  function ProductCard({
    product,
    openProduct,
    addToCartByEvent,
    handleEngravingOpen,
    isWishlisted,
    toggleWishlist,
  }: {
    product: Product;
    openProduct: (id: number) => void;
    addToCartByEvent: (event: React.MouseEvent<HTMLButtonElement>, productId: number) => void;
    handleEngravingOpen: (id: number, event?: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
    isWishlisted: boolean;
    toggleWishlist: (event: React.MouseEvent<HTMLButtonElement>, id: number) => void;
  }) {
    const discount = Math.round((1 - product.price / product.originalPrice) * 100);
    return (
      <div className={styles['product-card']} onClick={() => openProduct(product.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openProduct(product.id)}>
        <div className={styles['product-img-wrap']}>
          <img src={product.img} alt={product.name} />
          {product.badge ? <span className={cx(styles.badge, styles[`badge-${product.badge}`])}>{badgeLabel(product.badge)}</span> : null}
          {product.engravable ? <span className={styles['badge-engrave']}>✍️ Engravable</span> : null}
          <button type="button" className={styles['wishlist-btn']} onClick={(event) => { event.stopPropagation(); toggleWishlist(event, product.id); }} aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>
        <div className={styles['product-info']}>
          <div className={styles['product-brand']}>{product.brand}</div>
          <div className={styles['product-name']}>{product.name}</div>
          <div className={styles.stars}>{starsLabel(product.rating)}</div>
          <div className={styles['reviews-count']}>({product.reviews.toLocaleString('en-US')} reviews)</div>
          <div className={styles['price-row']}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            <span className={styles['price-original']}>{formatPrice(product.originalPrice)}</span>
            <span className={styles.discount}>-{discount}%</span>
          </div>
          {product.engravable ? <div className={styles['engrave-tag']}>✍️ Laser Engrave · +₹499</div> : null}
          <div className={styles['card-btns']}>
            <button type="button" className={styles['atc-btn']} onClick={(event) => { event.stopPropagation(); addToCartByEvent(event, product.id); }}>
              Add to Cart
            </button>
            {product.engravable ? (
              <button type="button" className={styles['engrave-btn']} onClick={(event) => { event.stopPropagation(); handleEngravingOpen(product.id, event); }}>
                ✍️ Engrave
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={cx(styles.toast, toastVisible ? styles.show : '')} role="status" aria-live="polite">
        {toastMessage}
      </div>

      <div className={cx(styles['modal-overlay'], engravingOpen ? styles.open : '')} role="dialog" aria-modal="true" hidden={!authOpen}>
        <div className={styles.modal}>
          <button type="button" className={styles['modal-close']} onClick={closeAuthModal} aria-label="Close authentication dialog">
            ✕
          </button>
          <div className={styles['auth-modal-inner']}>
            <h2 className={styles['auth-title']}>Welcome to ShopWave</h2>
            <p className={styles['auth-subtitle']}>Sign in or create your account</p>
            <div className={styles['auth-tabs']}>
              <button type="button" className={cx(styles['auth-tab'], authTab === 'login' ? styles.active : '')} onClick={() => handleAuthTab('login')}>
                Sign In
              </button>
              <button type="button" className={cx(styles['auth-tab'], authTab === 'register' ? styles.active : '')} onClick={() => handleAuthTab('register')}>
                Create Account
              </button>
            </div>
            {authTab === 'login' ? (
              <div>
                <div className={styles['form-group']}>
                  <label htmlFor="login-email">Email</label>
                  <input id="login-email" type="email" className={styles['form-input']} value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="Enter your email" />
                </div>
                <div className={styles['form-group']}>
                  <label htmlFor="login-password">Password</label>
                  <input id="login-password" type="password" className={styles['form-input']} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Enter your password" />
                </div>
                <button type="button" className={styles['form-submit']} onClick={doLogin}>
                  Sign In
                </button>
              </div>
            ) : (
              <div>
                <div className={styles['form-group']}>
                  <label htmlFor="reg-name">Full Name</label>
                  <input id="reg-name" type="text" className={styles['form-input']} value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Your full name" />
                </div>
                <div className={styles['form-group']}>
                  <label htmlFor="reg-email">Email</label>
                  <input id="reg-email" type="email" className={styles['form-input']} value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="Your email address" />
                </div>
                <div className={styles['form-group']}>
                  <label htmlFor="reg-password">Password</label>
                  <input id="reg-password" type="password" className={styles['form-input']} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Create a password (min 6 chars)" />
                </div>
                <button type="button" className={styles['form-submit']} onClick={doRegister}>
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={cx(styles['eng-overlay'], engravingOpen ? styles.open : '')} aria-hidden={!engravingOpen}>
        <div className={styles['eng-studio']}>
          <div className={styles['eng-studio-header']}>
            <div className={styles['studio-icon']}>✍️</div>
            <div>
              <h2>Engraving Studio</h2>
              <p className={styles['eng-studio-subtitle']}>
                Personalise your {engravingProduct?.name ?? 'product'}
              </p>
            </div>
            <button type="button" className={styles['close-studio']} onClick={closeEngraving}>
              ✕ Close
            </button>
          </div>
          <div className={styles['eng-studio-body']}>
            <div className={styles['eng-panel-left']}>
              <div>
                <div className={styles['eng-section-label']}>Your Text</div>
                <input
                  id="eng-text"
                  className={styles['eng-text-input']}
                  type="text"
                  value={engravingText}
                  onChange={(event) => handleEngravingText(event.target.value)}
                  placeholder="Type name, message…"
                  maxLength={20}
                />
                <div className={styles['char-tracker']}>
                  <div className={styles['char-bar']}>
                    <div className={styles['char-bar-fill']} style={{ width: `${(engravingText.length / 20) * 100}%` }} />
                  </div>
                  <span className={styles['char-count']}>{20 - engravingText.length}/20</span>
                </div>
              </div>
              <div>
                <div className={styles['eng-section-label']}>Font Style</div>
                <div className={styles['font-grid']}>
                  {FONTS.map((font, index) => (
                    <button
                      key={font.name}
                      type="button"
                      className={cx(styles['font-opt'], engravingFontIdx === index ? styles.sel : '')}
                      onClick={() => handleFontSelect(index)}
                    >
                      <div className={styles.fn}>{font.name}</div>
                      <div className={styles.fs} style={{ fontFamily: font.fontFamily, letterSpacing: font.letterSpacing, fontWeight: index === 1 ? 900 : 700, fontSize: index === 2 ? 14 : 13 }}>
                        {font.preview}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={styles['size-row']}>
                  <div className={styles['eng-section-label']} style={{ marginBottom: 0 }}>
                    Font Size
                  </div>
                  <span className={styles['size-val']}>{engravingSize}px</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={42}
                  value={engravingSize}
                  className={styles['eng-slider']}
                  onChange={(event) => handleSizeChange(Number(event.target.value))}
                />
              </div>
              <div>
                <div className={styles['eng-section-label']}>Engraving Color</div>
                <div className={styles['color-palette']}>
                  {COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.color}
                      type="button"
                      className={cx(styles.clr, engravingColor === option.color ? styles.sel : '')}
                      style={{ background: option.color, border: option.border ?? 'transparent' }}
                      onClick={() => handleColorSelect(option.color)}
                      title={option.title}
                      aria-label={option.title}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className={styles['size-row']}>
                  <div className={styles['eng-section-label']} style={{ marginBottom: 0 }}>
                    Opacity
                  </div>
                  <span className={styles['opacity-val']}>{Math.round(engravingOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={Math.round(engravingOpacity * 100)}
                  className={styles['eng-slider']}
                  onChange={(event) => handleOpacityChange(Number(event.target.value))}
                />
              </div>
              <div>
                <div className={styles['eng-section-label']}>Engraving Effect</div>
                <div className={styles['effect-grid']}>
                  {(['laser', 'emboss', 'neon', 'deboss'] as EngravingEffect[]).map((effect) => (
                    <button
                      key={effect}
                      type="button"
                      className={cx(styles['effect-opt'], engravingEffect === effect ? styles.sel : '')}
                      onClick={() => handleEffectSelect(effect)}
                    >
                      <span className={styles.ei}>{effect === 'laser' ? '⚡' : effect === 'emboss' ? '🔷' : effect === 'neon' ? '💡' : '🔲'}</span>
                      {effect === 'laser' ? 'Laser Cut' : effect === 'emboss' ? 'Embossed' : effect === 'neon' ? 'Neon Glow' : 'Debossed'}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles['realistic-badge']}>
                <strong>🔬 Photo-Realistic Engraving</strong>
                Canvas engine simulates actual laser engraving with reflection & depth
              </div>
            </div>
            <div className={styles['eng-panel-center']}>
              <div className={styles['view-toggle']}>
                <button type="button" className={cx(styles['view-btn'], engravingView === 'back' ? styles.sel : '')} onClick={() => handleViewSelect('back')}>
                  📱 Back (Engravable)
                </button>
                <button type="button" className={cx(styles['view-btn'], engravingView === 'front' ? styles.sel : '')} onClick={() => handleViewSelect('front')}>
                  🖥 Front View
                </button>
              </div>
              <div className={styles['eng-canvas-wrap']} ref={canvasWrapRef}>
                <canvas ref={mainCanvasRef} className={styles['eng-canvas']} width={380} height={380} aria-label="Engraving preview canvas" />
                <div
                  className={styles['drag-handle']}
                  ref={dragHandleRef}
                  style={{ left: `${engravingX * 100}%`, top: `${engravingY * 100}%` }}
                  onPointerDown={handleDragStart}
                >
                  <div className={styles['drag-handle-dot']} />
                </div>
              </div>
              <div className={styles['eng-canvas-hint']}>
                Drag the <span>purple dot ●</span> to reposition engraving
              </div>
            </div>
            <div className={styles['eng-panel-right']}>
              <div>
                <div className={styles['eng-section-label']}>Before vs After</div>
                <div className={styles['compare-row']}>
                  <div className={cx(styles['cmp-card'], styles.before)}>
                    <div className={styles['cmp-canvas-wrap']}>
                      <canvas ref={compareBeforeRef} width={110} height={110} aria-label="Original preview canvas" />
                    </div>
                    <div className={styles['cmp-label']}>Original</div>
                  </div>
                  <div className={cx(styles['cmp-card'], styles.after)}>
                    <div className={styles['cmp-canvas-wrap']}>
                      <canvas ref={compareAfterRef} width={110} height={110} aria-label="Engraved preview canvas" />
                    </div>
                    <div className={styles['cmp-label']}>✨ Engraved</div>
                  </div>
                </div>
              </div>
              <div className={styles['preview-product-info']}>
                <div className={styles['preview-secondary']}>Selected Product</div>
                <div className={styles['preview-name']}>{engravingProduct?.name}</div>
                <div className={styles['preview-brand']}>{engravingProduct?.brand}</div>
              </div>
              <div className={styles['price-breakdown']}>
                <div className={styles['price-breakdown-title']}>Price Breakdown</div>
                <div className={styles['pb-row']}>
                  <span>Base Price</span>
                  <span>{engravingProduct ? formatPrice(engravingProduct.price) : '₹0'}</span>
                </div>
                <div className={cx(styles['pb-row'], styles.eng)}>
                  <span>✨ Laser Engraving</span>
                  <span>+ ₹499</span>
                </div>
                <div className={cx(styles['pb-row'], styles.tot)}>
                  <span>Your Total</span>
                  <span>{engravingProduct ? formatPrice(engravingProduct.price + ENGRAVE_CHARGE) : formatPrice(ENGRAVE_CHARGE)}</span>
                </div>
              </div>
              <button type="button" className={styles['eng-add-btn']} onClick={handleEngravingConfirm}>
                ✨ Add Engraved to Cart
              </button>
              <button type="button" className={styles['eng-cancel-btn']} onClick={closeEngraving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <header>
        <div className={styles['header-top']}>
          <button type="button" className={styles.logo} onClick={() => handleFilterNavigation('', 'home')}>
            Shop<span>Wave</span>
          </button>
          <div className={styles['search-bar']}>
            <label htmlFor="search-category" className={styles['visually-hidden']}>
              Search category
            </label>
            <select id="search-category" className={styles['search-select']} value={searchCategory} onChange={(event) => setSearchCategory(event.target.value)}>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <label htmlFor="search-input" className={styles['visually-hidden']}>
              Search products
            </label>
            <input
              id="search-input"
              className={styles['search-input']}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') performSearch();
              }}
              placeholder="Search products, brands and more…"
            />
            <button type="button" className={styles['search-btn']} onClick={performSearch} aria-label="Search products">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className={styles['header-actions']}>
            <button type="button" className={styles.hbtn} onClick={user ? () => openPage('profile') : openAuthModal}>
              <span className={styles.small}>Hello, {user ? user.name.split(' ')[0] : 'Sign in'}</span>
              <span className={styles.big}>Account & Orders</span>
            </button>
            <button type="button" className={cx(styles.hbtn, styles['cart-btn'])} onClick={() => openPage('cart')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={styles['cart-count']}>{cartCount}</span>
              Cart
            </button>
          </div>
        </div>
        <div className={styles['header-bottom']}>
          {NAV_LINKS.map((link) => {
            const active = link.page === 'home' && currentPage === 'home' ? true : link.page === currentPage;
            return (
              <button
                key={link.label}
                type="button"
                className={cx(styles['nav-link'], active ? styles.active : '')}
                onClick={() => {
                  if (link.page) {
                    openPage(link.page);
                  }
                  if (link.category) {
                    handleFilterNavigation(link.category);
                  }
                }}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </header>

      <main>
        <section className={cx(styles.page, currentPage === 'home' ? styles.active : '')} id="home-page">
          <div className={styles.hero}>
            {HERO_PARTICLES.map((particle, index) => (
              <div
                key={index}
                className={styles.particle}
                style={{
                  left: particle.left,
                  width: particle.width,
                  height: particle.height,
                  background: particle.background,
                  animationDuration: particle.duration,
                  animationDelay: particle.delay,
                }}
              />
            ))}
            <div className={styles['hero-inner']}>
              <div className={styles['hero-eyebrow']}>✨ Now with Laser Engraving Studio</div>
              <h1>Everything You Need,<br />
                <em>Delivered Fast.</em>
              </h1>
              <p>Shop millions of products. Personalise electronics with our photorealistic laser engraving.</p>
              <div className={styles['hero-btns']}>
                <button type="button" className={cx(styles.btn, styles['btn-primary'])} onClick={() => shopNowRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                  🛍️ Shop Now
                </button>
                <button type="button" className={cx(styles.btn, styles['btn-purple'])} onClick={() => handleFilterNavigation('Electronics')}>
                  ✍️ Try Engraving Studio
                </button>
                <button type="button" className={cx(styles.btn, styles['btn-ghost'])} onClick={() => handleFilterNavigation('Clothing')}>
                  👗 Fashion
                </button>
              </div>
            </div>
          </div>

          <div className={styles['page-inner']}>
            <div className={styles['promo-band']}>
              <div className={styles['promo-band-inner']}>
                <div className={styles['promo-glow']}>✍️</div>
                <div>
                  <div className={styles['promo-title']}>🔥 Realistic Laser Engraving — Drag & Drop Positioning!</div>
                  <div className={styles['promo-copy']}>See your name engraved on iPhone, MacBook, AirPods & more with 4 effects. Perfect gift idea.</div>
                </div>
                <button type="button" className={cx(styles.btn, styles['btn-purple'], styles['promo-action'])} onClick={() => handleFilterNavigation('Electronics')}>
                  Engrave Now →
                </button>
              </div>
            </div>
          </div>

          <section className={styles['categories-section']}>
            <h2 className={styles['section-title']}>Shop by Category</h2>
            <div className={styles['cat-grid']}>
              {['Electronics', 'Clothing', 'Home', 'Books', 'Sports', 'Beauty', 'Toys', 'Garden'].map((category) => (
                <button key={category} type="button" className={styles['cat-card']} onClick={() => handleFilterNavigation(category)}>
                  <span className={styles['cat-icon']}>{
                    category === 'Electronics' ? '📱' : category === 'Clothing' ? '👗' : category === 'Home' ? '🏡' : category === 'Books' ? '📚' : category === 'Sports' ? '⚽' : category === 'Beauty' ? '💄' : category === 'Toys' ? '🧸' : '🌱'
                  }</span>
                  <div className={styles['cat-name']}>{category === 'Clothing' ? 'Fashion' : category}</div>
                </button>
              ))}
            </div>
          </section>

          <div className={styles['page-inner']}>
            <div className={styles['deals-banner']}>
              <div className={styles['deals-inner']}>
                <span className={styles['deal-badge']}>⚡ LIVE</span>
                <span className={styles['deal-copy']}>Deal of the Day — Up to 70% Off!</span>
                <div className={styles['deal-timer']}>
                  Ends in:
                  <span className={styles['timer-unit']} id="t-h">04</span>:
                  <span className={styles['timer-unit']} id="t-m">32</span>:
                  <span className={styles['timer-unit']} id="t-s">10</span>
                </div>
              </div>
            </div>
          </div>

          <section className={styles['ai-section']}>
            <div className={styles['ai-header']}>
              <div className={styles['ai-icon']}>🤖</div>
              <div>
                <h2 className={styles['ai-title']}>AI Picks Just For You</h2>
                <p className={styles['ai-subtitle']}>Personalised by Claude AI</p>
              </div>
              <button type="button" className={cx(styles.btn, styles['btn-sm'], styles['btn-ghost'], styles['ai-refresh'])} onClick={loadAIRecommendations}>
                ↻ Refresh
              </button>
            </div>
            <div className={styles['ai-grid']}>
              {aiLoading ? (
                <div className={styles['ai-loading']}>
                  <div className={styles.spinner} />
                  <p>Getting your picks…</p>
                </div>
              ) : aiRecommendations?.length ? (
                aiRecommendations.map((recommendation) => {
                  const product = PRODUCTS.find((item) => item.id === recommendation.id);
                  if (!product) return null;
                  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
                  return (
                    <div 
                      key={product.id} 
                      className={styles['ai-card']} 
                      role="button" 
                      tabIndex={0}
                      onClick={() => openProduct(product.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openProduct(product.id);
                        }
                      }}
                    >
                      <img src={product.img} alt={product.name} />
                      <div className={styles['ai-brand']}>{product.brand}</div>
                      <div className={styles['ai-name']}>{product.name}</div>
                      <span className={styles['ai-reason']}>✨ {recommendation.reason}</span>
                      {product.engravable ? <span className={styles['ai-engravable-badge']}>✍️ Engravable</span> : null}
                      <div className={styles['ai-price-row']}>
                        <span className={styles['ai-price']}>{formatPrice(product.price)}</span>
                        <span className={styles['ai-discount']}>-{discount}%</span>
                      </div>
                      <button type="button" className={styles['atc-btn']} onClick={(event) => {
                        event.stopPropagation();
                        addToCartByEvent(event, product.id);
                      }}>
                        Add to Cart
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className={styles['ai-loading']}>
                  <p>No recommendations available right now.</p>
                </div>
              )}
            </div>
          </section>

          <section className={styles['products-section']} id="shop-now" ref={shopNowRef}>
            <h2 className={styles['section-title']} id="products-heading">{productsHeading}</h2>
            <div className={styles['filters-row']}>
              <select className={styles['filter-select']} value={sortOption} onChange={(event) => setSortOption(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select className={styles['filter-select']} value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                <option value="">All Categories</option>
                {CATEGORY_OPTIONS.slice(1).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select className={styles['filter-select']} value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                {PRICE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select className={styles['filter-select']} value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
                {RATING_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className={styles['results-count']}>
                {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className={styles['product-grid']}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  openProduct={openProduct}
                  addToCartByEvent={addToCartByEvent}
                  handleEngravingOpen={handleEngravingOpen}
                  isWishlisted={wishlist.includes(product.id)}
                  toggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          </section>
        </section>

        <section className={cx(styles.page, currentPage === 'search' ? styles.active : '')} id="search-page">
          <div className={styles['search-results-header']} id="search-header">
            {searchHeader}
          </div>
          <div className={styles['products-section']}>
            <div className={styles['product-grid']}>{searchResultsContent}</div>
          </div>
        </section>

        <section className={cx(styles.page, currentPage === 'product-detail' ? styles.active : '')} id="product-detail-page">
          {detailProduct ? (
            <div className={styles['detail-layout']}>
              <div className={styles['detail-images']}>
                <div className={styles['main-img-box']}>
                  <img src={detailProduct.imgs[detailImageIndex] || detailProduct.img} alt={detailProduct.name} />
                </div>
                <div className={styles['thumb-row']}>
                  {detailProduct.imgs.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      className={cx(styles.thumb, detailImageIndex === index ? styles.active : '')}
                      onClick={() => selectThumbnail(index)}
                    >
                      <img src={image} alt={`${detailProduct.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={styles['detail-brand']}>{detailProduct.brand}</div>
                <h1 className={styles['detail-title']}>{detailProduct.name}</h1>
                <div className={styles['detail-rating']}>
                  <span className={styles.stars}>{starsLabel(detailProduct.rating)}</span>
                  <span className={styles['detail-rating-meta']}>{detailProduct.rating} · {detailProduct.reviews.toLocaleString('en-US')} ratings</span>
                </div>
                <div className={styles['detail-price']}>
                  <div className={styles.current}>{formatPrice(detailProduct.price)}</div>
                  <div className={styles.was}>
                    M.R.P.: <s>{formatPrice(detailProduct.originalPrice)}</s> <span className={styles['detail-save']}>Save {formatPrice(detailProduct.originalPrice - detailProduct.price)} ({Math.round((1 - detailProduct.price / detailProduct.originalPrice) * 100)}%)</span>
                  </div>
                </div>
                {detailProduct.engravable ? (
                  <div className={styles['engrave-promo']}>
                    <span className={styles['engrave-promo-icon']}>✍️</span>
                    <div>
                      <h4>Laser Engraving Studio</h4>
                      <p>Realistic preview · Drag & drop · 4 effects · +₹499</p>
                    </div>
                    <button type="button" className={styles['ep-btn']} onClick={() => handleEngravingOpen(detailProduct.id)}>
                      Open Studio
                    </button>
                  </div>
                ) : null}
                <div className={styles['detail-desc']}>{detailProduct.desc}</div>
                <ul className={styles['detail-features']}>
                  {detailProduct.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className={styles['spec-grid']}>
                  {Object.entries(detailProduct.specs).map(([label, value]) => (
                    <div key={label} className={styles['spec-item']}>
                      <span className={styles['spec-label']}>{label}</span>
                      <span className={styles['spec-value']}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <aside className={styles['buy-box']}>
                <div className={styles.price}>{formatPrice(detailProduct.price)}</div>
                <div className={styles['detail-limited']}>-{Math.round((1 - detailProduct.price / detailProduct.originalPrice) * 100)}% Limited time</div>
                <div className={styles['delivery-info']}>
                  <div className={styles.fast}>⚡ FREE Delivery Tomorrow</div>
                  <div className={styles['delivery-subcopy']}>Order within 3 hrs 45 min</div>
                </div>
                <div className={cx(styles['stock-status'], styles.in)}>✅ In Stock</div>
                <div className={styles['qty-row']}>
                  <label htmlFor="detail-qty">Qty:</label>
                  <select id="detail-qty" className={styles['qty-select']} value={detailQty} onChange={(event) => changeDetailQty(Number(event.target.value))}>
                    {[1, 2, 3, 4, 5].map((qty) => (
                      <option key={qty} value={qty}>{qty}</option>
                    ))}
                  </select>
                </div>
                <div className={styles['buy-btns']}>
                  <button type="button" className={cx(styles['buy-btn'], styles.cart)} onClick={addToCartDetail}>
                    Add to Cart
                  </button>
                  <button type="button" className={cx(styles['buy-btn'], styles.now)} onClick={buyNow}>
                    Buy Now
                  </button>
                  {detailProduct.engravable ? (
                    <button type="button" className={cx(styles['buy-btn'], styles.custom)} onClick={() => handleEngravingOpen(detailProduct.id)}>
                      ✍️ Open Engraving Studio (+₹499)
                    </button>
                  ) : null}
                  <button type="button" className={cx(styles['buy-btn'], styles.wish)} onClick={toggleWishlistDetail}>
                    {wishlist.includes(detailProduct.id) ? '❤️ Saved to Wishlist' : '🤍 Add to Wishlist'}
                  </button>
                </div>
                {detailProduct.engravable ? (
                  <div className={styles['custom-pricing-box']}>
                    <div className={styles['custom-pricing-title']}>✍️ Engraving Pricing</div>
                    <div>Base: <strong>{formatPrice(detailProduct.price)}</strong></div>
                    <div className={styles['custom-price-highlight']}>+ Laser Engraving: <strong>₹499</strong></div>
                    <div className={styles['custom-price-total']}>Total: <strong>{formatPrice(detailProduct.price + ENGRAVE_CHARGE)}</strong></div>
                  </div>
                ) : null}
                <div className={styles['secure-badge']}>🔒 Secure Transaction · Easy Returns</div>
              </aside>
            </div>
          ) : (
            <div className={styles['empty-state']}>
              <div className={styles['empty-icon']}>📦</div>
              <h3>Select a product to view details.</h3>
            </div>
          )}
        </section>

        <section className={cx(styles.page, currentPage === 'cart' ? styles.active : '')} id="cart-page">
          <div className={styles['cart-layout']}>
            <div className={styles['cart-main']}>
              <h2>🛒 Shopping Cart</h2>
              {cart.length ? cartItemElements : (
                <div className={styles['empty-state']}>
                  <div className={styles['empty-icon']}>🛒</div>
                  <h3>Your cart is empty</h3>
                  <p>Add items to get started.</p>
                  <button type="button" className={cx(styles.btn, styles['btn-primary'])} onClick={() => openPage('home')}>
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
            <aside className={styles['cart-summary']}>
              <h3>Order Summary</h3>
              <div className={styles['summary-row']}>
                <span>Subtotal ({cartSummary.quantity} items)</span>
                <span>{formatPrice(cartSummary.subtotal)}</span>
              </div>
              {cartSummary.engravingTotal ? (
                <div className={styles['summary-row']} style={{ color: '#a78bfa', fontWeight: 700 }}>
                  <span>✍️ Engraving charges</span>
                  <span>{formatPrice(cartSummary.engravingTotal)}</span>
                </div>
              ) : null}
              <div className={cx(styles['summary-row'], styles.savings)}>
                <span>💰 You Save</span>
                <span>-{formatPrice(cartSummary.savings)}</span>
              </div>
              <div className={styles['summary-row']}>
                <span>Delivery</span>
                <span>{cartSummary.delivery ? formatPrice(cartSummary.delivery) : <span className={styles['free-badge']}>FREE</span>}</span>
              </div>
              <div className={cx(styles['summary-row'], styles.total)}>
                <span>Order Total</span>
                <span>{formatPrice(cartSummary.total)}</span>
              </div>
              <button type="button" className={styles['checkout-btn']} onClick={() => openPage('checkout')} hidden={!cart.length}>
                Proceed to Checkout →
              </button>
              <p className={styles['checkout-note']}>🔒 Secure SSL checkout</p>
            </aside>
          </div>
        </section>

        <section className={cx(styles.page, currentPage === 'checkout' ? styles.active : '')} id="checkout-page">
          <h2 className={styles['checkout-title']}>Checkout</h2>
          <div className={styles['checkout-layout']}>
            <div>
              <div className={styles['checkout-step']}>
                <h3><span className={styles['step-num']}>1</span> Delivery Address</h3>
                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label htmlFor="ch-fname">First Name</label>
                    <input id="ch-fname" className={styles['form-input']} value={checkoutAddress.firstName} onChange={(event) => handleCheckoutInput('firstName', event.target.value)} />
                  </div>
                  <div className={styles['form-group']}>
                    <label htmlFor="ch-lname">Last Name</label>
                    <input id="ch-lname" className={styles['form-input']} value={checkoutAddress.lastName} onChange={(event) => handleCheckoutInput('lastName', event.target.value)} />
                  </div>
                </div>
                <div className={styles['form-group']}>
                  <label htmlFor="ch-addr1">Address</label>
                  <input id="ch-addr1" className={styles['form-input']} value={checkoutAddress.address} onChange={(event) => handleCheckoutInput('address', event.target.value)} placeholder="House/Flat No., Street" />
                </div>
                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label htmlFor="ch-city">City</label>
                    <input id="ch-city" className={styles['form-input']} value={checkoutAddress.city} onChange={(event) => handleCheckoutInput('city', event.target.value)} />
                  </div>
                  <div className={styles['form-group']}>
                    <label htmlFor="ch-pin">PIN Code</label>
                    <input id="ch-pin" className={styles['form-input']} value={checkoutAddress.pin} onChange={(event) => handleCheckoutInput('pin', event.target.value)} />
                  </div>
                </div>
                <div className={styles['form-group']}>
                  <label htmlFor="ch-phone">Phone</label>
                  <input id="ch-phone" className={styles['form-input']} type="tel" value={checkoutAddress.phone} onChange={(event) => handleCheckoutInput('phone', event.target.value)} placeholder="+91 XXXXXXXXXX" />
                </div>
              </div>
              <div className={styles['checkout-step']}>
                <h3><span className={styles['step-num']}>2</span> Payment Method</h3>
                {PAYMENT_OPTIONS.map((option) => (
                  <label key={option.value} className={cx(styles['payment-opt'], paymentMethod === option.value ? styles.active : '')}>
                    <input type="radio" name="payment" value={option.value} checked={paymentMethod === option.value} onChange={() => selectPayment(option.value)} />
                    <div>
                      <div className={styles['payment-opt-label']}>{option.label}</div>
                      <div className={styles['payment-opt-sub']}>{option.description}</div>
                    </div>
                    <span className={styles['payment-icons']}>{option.icon}</span>
                  </label>
                ))}
              </div>
              {checkoutTotals.subtotal ? (
                <div className={styles['checkout-step']}>
                  <h3><span className={styles['step-num']}>3</span> Personalised Items</h3>
                  {cart.filter((item) => item.engraving).map((item) => {
                    const product = PRODUCTS.find((product) => product.id === item.id);
                    if (!product) return null;
                    return (
                      <div key={`${item.id}-${item.qty}`} className={styles['order-personalised-item']}>
                        <img src={product.img} alt={product.name} className={styles['os-item-img']} />
                        <div>
                          <div className={styles['os-item-name']}>{product.name.substring(0, 26)}</div>
                          <div className={styles['os-item-meta']}>Engraved: "{item.engraving?.text}"</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <button type="button" className={styles['order-place-btn']} onClick={handleOrderPlace}>
                🔒 Place Order Securely
              </button>
            </div>
            <aside className={styles['order-summary-sidebar']}>
              <h3>Your Order</h3>
              {cart.map((item) => {
                const product = PRODUCTS.find((product) => product.id === item.id);
                if (!product) return null;
                const itemTotal = product.price * item.qty + (item.engraving ? ENGRAVE_CHARGE * item.qty : 0);
                return (
                  <div key={`${item.id}-${item.engraving ? 'engraved' : 'standard'}`} className={styles['os-item']}>
                    <div className={styles['os-item-img']}>
                      <img src={product.img} alt={product.name} />
                    </div>
                    <div>
                      <div className={styles['os-item-name']}>{product.name.substring(0, 26)}</div>
                      {item.engraving ? <div className={styles['os-item-meta']}>✍️ "{item.engraving.text}"</div> : null}
                    </div>
                    <span className={styles['os-item-price']}>{formatPrice(itemTotal)}</span>
                  </div>
                );
              })}
              <hr className={styles['os-divider']} />
              <div className={styles['os-row']}>
                <span>Subtotal</span>
                <span>{formatPrice(checkoutTotals.subtotal)}</span>
              </div>
              <div className={styles['os-row']}>
                <span>Delivery</span>
                <span>{checkoutTotals.delivery ? formatPrice(checkoutTotals.delivery) : 'FREE'}</span>
              </div>
              <div className={cx(styles['os-row'], styles['os-discount'])}>
                <span>Discount (5%)</span>
                <span>-{formatPrice(checkoutTotals.discount)}</span>
              </div>
              <div className={cx(styles['os-row'], styles.total)}>
                <span>Total</span>
                <span>{formatPrice(checkoutTotals.total)}</span>
              </div>
            </aside>
          </div>
        </section>

        <section className={cx(styles.page, currentPage === 'success' ? styles.active : '')} id="success-page">
          <div className={styles['success-icon']}>🎉</div>
          <h2 className={styles['success-title']}>Order Placed Successfully!</h2>
          <p className={styles['success-copy']}>Thank you for shopping with ShopWave!</p>
          <div className={styles['order-id']}>Order #{orderId}</div>
          {placedEngravingNotes.length ? (
            <div className={styles['success-engrave-note']}>
              <div className={styles['success-engrave-heading']}>✍️ Your Personalised Items</div>
              {placedEngravingNotes.map((note) => (
                <div key={note} className={styles['success-engrave-item']}>{note}</div>
              ))}
            </div>
          ) : null}
          <p className={styles['success-copy']}>Estimated delivery: <strong>2–4 business days</strong></p>
          <div className={styles['success-actions']}>
            <button type="button" className={cx(styles.btn, styles['btn-primary'])} onClick={() => openPage('profile')}>
              📦 Track Order
            </button>
            <button type="button" className={cx(styles.btn, styles.btn)} onClick={() => openPage('home')}>
              🛍️ Continue Shopping
            </button>
          </div>
        </section>

        <section className={cx(styles.page, currentPage === 'profile' ? styles.active : '')} id="profile-page">
          <div className={styles['profile-content']}>
            {user ? (
              <>
                <div className={styles['profile-header']}>
                  <div className={styles['profile-avatar']}>{profileInitials}</div>
                  <div>
                    <div className={styles['profile-name']}>{user.name}</div>
                    <div className={styles['profile-email']}>{user.email}</div>
                    <div className={styles['profile-member']}>✅ Prime Member</div>
                  </div>
                  <button type="button" className={cx(styles.btn, styles['btn-sm'], styles['profile-signout'])} onClick={doLogout}>
                    Sign Out
                  </button>
                </div>
                <div className={styles['profile-grid']}>
                  <div className={styles['profile-card']}>
                    <h3>📦 Recent Orders</h3>
                    {ORDER_HISTORY.map((order) => (
                      <div key={order.name} className={styles['order-row']}>
                        <span className={styles['order-emoji']}>{order.emoji}</span>
                        <div className={styles['order-details']}>
                          <div className={styles['order-name']}>
                            {order.name}
                            {order.engraving ? <span className={styles['order-eng']}>
                              ✍️ "{order.engraving}"
                            </span> : null}
                          </div>
                          <div className={styles['order-meta']}>{order.date}</div>
                        </div>
                        <span className={cx(styles['order-status'], order.status === 'delivered' ? styles.delivered : styles.transit)}>
                          {order.status === 'delivered' ? 'Delivered' : 'In Transit'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles['profile-card']}>
                    <h3>❤️ Wishlist ({wishlist.length})</h3>
                    {profileWishlistProducts.length ? (
                      <div className={styles['wishlist-grid']}>
                        {profileWishlistProducts.map((product) => (
                          <button key={product.id} type="button" className={styles['wishlist-card']} onClick={() => openProduct(product.id)}>
                            <img src={product.img} alt={product.name} className={styles['wishlist-img']} />
                            <div className={styles['wishlist-name']}>{product.name.substring(0, 18)}</div>
                            <div className={styles['wishlist-price']}>{formatPrice(product.price)}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className={styles['profile-placeholder']}>No items yet. ❤️ products to save.</p>
                    )}
                  </div>
                  <div className={styles['profile-card']}>
                    <h3>📍 Saved Addresses</h3>
                    <div className={styles['address-card']}>
                      <div className={styles['address-name']}>{user.name} <span className={styles['address-default']}>DEFAULT</span></div>
                      <div className={styles['address-text']}>123 Sample Street, Mumbai, MH 400001</div>
                    </div>
                    <button type="button" className={cx(styles.btn, styles['btn-sm'], styles['address-btn'])}>
                      + Add Address
                    </button>
                  </div>
                  <div className={styles['profile-card']}>
                    <h3>💳 Payment Methods</h3>
                    {[
                      { icon: '💳', label: 'HDFC Visa ····4242' },
                      { icon: '📱', label: 'GPay — UPI linked' },
                      { icon: '🏦', label: 'SBI Net Banking' },
                    ].map((method) => (
                      <div key={method.label} className={styles['payment-method-item']}>
                        <span>{method.icon}</span>
                        <span>{method.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className={styles['empty-state']}>
                <div className={styles['empty-icon']}>👤</div>
                <h3>Sign in to your account</h3>
                <p>Access orders, wishlist and more.</p>
                <button type="button" className={cx(styles.btn, styles['btn-primary'])} onClick={openAuthModal}>
                  Sign In
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer>
        <div className={styles['footer-top']}>
          {[
            { title: 'Get to Know Us', links: ['About ShopWave', 'Careers', 'Press Releases', 'Gift Cards'] },
            { title: 'Connect with Us', links: ['Facebook', 'Twitter', 'Instagram', 'Sell on ShopWave'] },
            { title: 'Make Money with Us', links: ['Sell products online', 'Become an Affiliate', 'Advertise Your Products'] },
            { title: 'Let Us Help You', links: ['Your Account', 'Returns Centre', '100% Purchase Protection', 'Help'] },
          ].map((column) => (
            <div key={column.title} className={styles['footer-col']}>
              <h4>{column.title}</h4>
              <ul>
                {column.links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles['footer-bottom']}>© 2025 ShopWave — Made with ❤️ in India | Realistic Laser Engraving Technology</div>
      </footer>
    </div>
  );
};

export default ShopWaveUpdate;
