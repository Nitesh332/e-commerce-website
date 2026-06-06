export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  emoji: string;
  badge: 'prime' | 'sale' | 'new' | '';
  engravable: boolean;
  img: string;
  backImg: string;
  imgs: string[];
  desc: string;
  features: string[];
  specs: Record<string, string>;
}

export interface EngravingData {
  text: string;
  fontIdx: number;
  color: string;
  size: number;
  opacity: number;
  effect: EngravingEffect;
  xPct: number;
  yPct: number;
}

export type EngravingEffect = 'laser' | 'emboss' | 'neon' | 'deboss';

export interface CartItem {
  id: number;
  qty: number;
  engraving?: EngravingData;
}

export interface User {
  name: string;
  email: string;
}

export type PageName = 'home' | 'search' | 'product-detail' | 'cart' | 'checkout' | 'profile' | 'success';

export interface FontConfig {
  name: string;
  fn: (size: number) => string;
  sp: number;
}

export interface Category {
  name: string;
  icon: string;
  label?: string;
}

export interface StoreState {
  cart: CartItem[];
  wishlist: number[];
  user: User | null;
  currentPage: PageName;
  currentFilter: string;
  currentProduct: Product | null;
  searchQuery: string;
  searchResults: Product[];
}

export interface StoreActions {
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
}
