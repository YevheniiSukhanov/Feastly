// src/components/layout/Footer.tsx
import Link from 'next/link';
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear(); // Отримуємо поточний рік

  return (
    <footer className="bg-gray-800 text-white py-6 mt-12"> {/* Додано mt-12 для відступу від контенту */}
      <div className="container mx-auto px-6 text-center">
        <p className="text-lg mb-4">
          &copy; {currentYear} Feastly. Всі права захищено.
        </p>
        <div className="flex justify-center space-x-6 text-sm">
          {/* Приклад посилань, якщо вони будуть */}
          {/* <Link href="/privacy-policy" className="hover:text-blue-400 transition-colors duration-200">
            Політика конфіденційності
          </Link>
          <Link href="/terms-of-service" className="hover:text-blue-400 transition-colors duration-200">
            Умови використання
          </Link>
          */}
          <a
            href="https://github.com/YevheniiSukhanov/Feastly" // Замініть на реальне посилання на ваш GitHub
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors duration-200"
          >
            GitHub Репозиторій
          </a>
        </div>
      </div>
    </footer>
  );
}