// src/app/layout.tsx
import './globals.css'; // <--- Додайте цей рядок
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Meal Planner App',
  description: 'Your personal meal planning assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>
        {children}
      </body>
    </html>
  );
}