// src/app/ingredients/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Для перенаправлення
import { Prisma } from '@prisma/client'; // Для типів, якщо потрібні, але краще їх визначити вручну

// Визначення типу для Ingredient, щоб уникнути залежності від @prisma/client на клієнті
// Якщо у вас вже є глобальний тип для інгредієнтів (наприклад, в src/types/index.ts), використовуйте його
interface Ingredient {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  imageUrl: string | null;
  createdAt: string; // Дати зазвичай приходять як рядки з API
  updatedAt: string;
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ingredients');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Ingredient[] = await response.json();
      setIngredients(data);
    } catch (err) {
      console.error('Failed to fetch ingredients:', err);
      setError('Не вдалося завантажити інгредієнти. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей інгредієнт?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 409) { // Обробка помилки P2003 (використовується в рецепті)
        const errorData = await response.json();
        alert(errorData.message || 'Цей інгредієнт використовується в рецептах і не може бути видалений.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Оновлюємо список інгредієнтів, видаливши видалений
      setIngredients((prevIngredients) =>
        prevIngredients.filter((ingredient) => ingredient.id !== id)
      );
      alert('Інгредієнт успішно видалено!');
    } catch (err) {
      console.error('Failed to delete ingredient:', err);
      alert('Не вдалося видалити інгредієнт. Спробуйте пізніше.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl font-semibold text-gray-700">Завантаження інгредієнтів...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl font-semibold text-red-600">{error}</p>
        <button
          onClick={() => fetchIngredients()}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Список Інгредієнтів</h1>

      <div className="flex justify-end mb-6">
        <Link href="/ingredients/new" legacyBehavior>
          <a className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg">
            Додати новий інгредієнт
          </a>
        </Link>
      </div>

      {ingredients.length === 0 ? (
        <p className="text-xl text-gray-600 text-center">Поки що немає інгредієнтів. Додайте перший!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300"
            >
              {ingredient.imageUrl && (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={ingredient.imageUrl}
                    alt={ingredient.name}
                    className="object-cover w-full h-full"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; }} // Placeholder on error
                  />
                </div>
              )}
              <div className="p-5 flex-grow">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{ingredient.name}</h2>
                <p className="text-gray-700 mb-3 text-lg">
                  <span className="font-semibold">Одиниця виміру:</span> {ingredient.unit}
                </p>
                {ingredient.description && (
                  <p className="text-gray-600 text-base line-clamp-3 mb-4">{ingredient.description}</p>
                )}
              </div>
              <div className="p-5 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => router.push(`/ingredients/edit/${ingredient.id}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Редагувати
                </button>
                <button
                  onClick={() => handleDelete(ingredient.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}