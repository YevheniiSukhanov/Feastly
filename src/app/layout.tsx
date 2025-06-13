// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// Імпортуємо наші компоненти Header та Footer
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer'; // <--- НОВИЙ ІМПОРТ

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Feastly - Ваш Планувальник Харчування',
  description: 'Керуйте своїми планами харчування та рецептами легко та ефективно.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <Header />
        
        {/* Основний контент сторінки. Додаємо min-h-screen та flex-grow для правильного позиціонування футера */}
        <main className="pt-20 flex-grow"> {/* <--- Додано flex-grow */}
          {children}
        </main>

        <Footer /> {/* <--- Додайте компонент футера тут */}
      </body>
    </html>
  );
}