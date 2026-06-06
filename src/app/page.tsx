'use client';

import { StoreProvider } from '@/lib/store';
import ShopWaveApp from '@/components/ShopWaveApp';

export default function Home() {
  return (
    <StoreProvider>
      <ShopWaveApp />
    </StoreProvider>
  );
}
