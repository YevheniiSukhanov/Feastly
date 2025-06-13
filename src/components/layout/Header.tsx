// src/components/layout/Header.tsx
import Link from 'next/link';
import React from 'react';

export default function Header() {
  return (
    <header className="bg-white shadow-md py-4 px-6 fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Логотип або назва застосунку */}
        <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200">
          Feastly
        </Link>

        {/* Навігаційні посилання */}
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="text-gray-700 hover:text-blue-600 text-lg font-medium transition-colors duration-200">
                Дашборд
              </Link>
            </li>
            <li>
              <Link href="/meal-planner" className="text-gray-700 hover:text-blue-600 text-lg font-medium transition-colors duration-200">
                Планувальник
              </Link>
            </li>
            <li>
              <Link href="/recipes" className="text-gray-700 hover:text-blue-600 text-lg font-medium transition-colors duration-200">
                Рецепти
              </Link>
            </li>
            {/* Додайте інші посилання, якщо у вас будуть інші основні сторінки */}
          </ul>
        </nav>

        {/* Місце для майбутніх елементів, наприклад, кнопки логіну/профілю */}
        {/* <div className="hidden md:block">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200">
            Мій Профіль
          </button>
        </div> */}
      </div>
    </header>
  );
}