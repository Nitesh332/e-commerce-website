import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShopWave — Everything, Delivered',
  description: 'Shop millions of products. Personalise electronics with our photorealistic laser engraving studio.',
  keywords: ['shopping', 'electronics', 'engraving', 'ecommerce', 'india'],
  openGraph: {
    title: 'ShopWave — Everything, Delivered',
    description: 'Shop millions of products with laser engraving.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Dancing+Script:wght@700&family=Space+Mono:wght@700&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
