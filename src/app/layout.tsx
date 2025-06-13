// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// Імпортуємо наш новий компонент Header
import Header from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Feastly - Ваш Планувальник Харчування', // Оновіть назву застосунку
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
        <Header /> {/* <--- Додайте компонент хедера тут */}
        
        {/* Основний контент сторінки. Додамо відступ, щоб контент не ховався за фіксованим хедером */}
        <main className="pt-20"> {/* <--- Додано padding-top, щоб хедер не перекривав контент */}
          {children}
        </main>
      </body>
    </html>
  );
}