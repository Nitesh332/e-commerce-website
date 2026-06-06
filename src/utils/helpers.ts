export const fmtPrice = (p: number): string => '₹' + p.toLocaleString('en-IN');

export const starsStr = (r: number): string =>
  '★'.repeat(Math.floor(r)) + '☆'.repeat(5 - Math.floor(r));

export const getDiscount = (price: number, original: number): number =>
  Math.round((1 - price / original) * 100);

export const getStorageItem = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export const setStorageItem = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
