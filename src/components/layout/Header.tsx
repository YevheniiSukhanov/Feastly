// src/components/layout/Header.tsx (Приклад, адаптуйте до свого коду)
'use client'; // Цей компонент має бути клієнтським, якщо містить інтерактивність

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Для виділення активної вкладки

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Головна' },
    { href: '/recipes', label: 'Рецепти' },
    { href: '/meal-planner', label: 'Планувальник їжі' },
    { href: '/ingredients', label: 'Інгредієнти' }, // НОВЕ посилання
  ];

  return (
    <header className="bg-gradient-to-r from-green-500 to-lime-600 p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold hover:text-gray-100 transition-colors">
          Feastly
        </Link>
        <ul className="flex space-x-6">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`text-white text-lg font-medium hover:text-gray-100 transition-colors ${
                  pathname === item.href ? 'border-b-2 border-white' : ''
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}