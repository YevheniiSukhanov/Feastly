// src/app/ingredients/new/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Дозволені одиниці вимірювання (збігаються з API)
const ALLOWED_UNITS = ['шт.', 'г.', 'мл.'];

export default function CreateIngredientPage() {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [unit, setUnit] = useState<string>(ALLOWED_UNITS[0]); // Обираємо перше значення за замовчуванням
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Клієнтська валідація перед відправкою на сервер
    if (!name.trim()) {
      setError('Назва інгредієнта є обов\'язковою.');
      setLoading(false);
      return;
    }
    if (!ALLOWED_UNITS.includes(unit)) {
      setError('Будь ласка, оберіть допустиму одиницю вимірювання.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() === '' ? null : description.trim(), // Зберігаємо null, якщо порожній
          unit,
          imageUrl: imageUrl.trim() === '' ? null : imageUrl.trim(), // Зберігаємо null, якщо порожній
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('Інгредієнт успішно створено!');
      router.push('/ingredients'); // Перенаправляємо на сторінку зі списком інгредієнтів
    } catch (err: any) {
      console.error('Failed to create ingredient:', err);
      setError(err.message || 'Не вдалося створити інгредієнт. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Створити Новий Інгредієнт</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Помилка!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="mb-5">
          <label htmlFor="name" className="block text-gray-700 text-lg font-medium mb-2">
            Назва інгредієнта <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            required
            aria-required="true"
          />
        </div>

        <div className="mb-5">
          <label htmlFor="description" className="block text-gray-700 text-lg font-medium mb-2">
            Опис
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base resize-none"
          ></textarea>
        </div>

        <div className="mb-5">
          <label htmlFor="unit" className="block text-gray-700 text-lg font-medium mb-2">
            Одиниця вимірювання <span className="text-red-500">*</span>
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="shadow border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            required
            aria-required="true"
          >
            {ALLOWED_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="imageUrl" className="block text-gray-700 text-lg font-medium mb-2">
            Посилання на зображення
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            placeholder="http://example.com/image.jpg"
          />
        </div>

        <div className="flex justify-between items-center mt-8">
          <Link href="/ingredients" legacyBehavior>
            <a className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg">
              Скасувати
            </a>
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Створення...' : 'Створити інгредієнт'}
          </button>
        </div>
      </form>
    </div>
  );
}