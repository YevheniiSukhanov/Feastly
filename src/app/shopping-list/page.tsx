// src/app/shopping-list/page.tsx
'use client'; // Цей компонент є клієнтським

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Імпортуємо Server Action для отримання списку покупок
import { getShoppingListForWeek } from '@/lib/actions';
// Імпортуємо утиліти для форматування та конвертації
import { formatQuantityForDisplay, BASE_VOLUME_UNIT, BASE_WEIGHT_UNIT, getUnitCategory } from '@/lib/unit-conversions';
// Імпортуємо утиліту для отримання початку тижня (якщо потрібно)
import { getStartOfWeekUTC } from '@/lib/utils'; // Припускаємо, що getStartOfWeekUTC там є

// Інтерфейс для елементів списку покупок
interface ShoppingListItem {
  name: string;
  quantity: number; // Ця кількість буде вже у базових одиницях (мл або г)
  unit: string;     // Ця одиниця буде базовою ('мл.', 'г.', 'шт.')
}

// Допоміжна функція для форматування діапазону дат для відображення
const formatDateRange = (weekStartDateString: string) => {
  const start = new Date(`${weekStartDateString}T00:00:00Z`); // Парсимо як UTC для уникнення проблем з часовим поясом
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6); // Кінець тижня (6 днів після понеділка)

  const formatter = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
};

export default function ShoppingListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mealPlanId, setMealPlanId] = useState<string | null>(null);
  const [weekString, setWeekString] = useState<string | null>(null);

  // Функція для завантаження списку покупок
  const fetchShoppingList = useCallback(async () => {
    const currentMealPlanId = searchParams.get('mealPlanId');
    const currentWeekString = searchParams.get('week');

    if (!currentMealPlanId || !currentWeekString) {
      setError('Необхідні параметри (mealPlanId та week) відсутні. Будь ласка, перейдіть зі сторінки планувальника.');
      setLoading(false);
      return;
    }

    setMealPlanId(currentMealPlanId);
    setWeekString(currentWeekString);
    setLoading(true);
    setError(null);

    try {
      // Конвертуємо рядок дати в об'єкт Date, що представляє початок тижня в UTC
      const weekStartDate = getStartOfWeekUTC(new Date(`${currentWeekString}T00:00:00Z`));

      // Викликаємо Server Action для отримання агрегованого списку покупок
      const list = await getShoppingListForWeek(currentMealPlanId, weekStartDate);
      setShoppingList(list);
    } catch (e: any) {
      console.error('Failed to fetch shopping list:', e);
      setError(e.message || 'Не вдалося завантажити список покупок.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Завантажуємо список покупок при першому рендері або зміні параметрів URL
  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  // Функція для друку сторінки
  const handlePrint = () => {
    window.print();
  };

  // Відображення стану завантаження
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl font-semibold text-gray-700">Завантаження списку покупок...</p>
      </div>
    );
  }

  // Відображення стану помилки
  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-2xl bg-white rounded-lg shadow-md mt-10 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Помилка завантаження</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <Link href="/meal-planner" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md">
          Повернутися до планувальника
        </Link>
      </div>
    );
  }

  // Основний рендеринг сторінки списку покупок
  return (
    <div className="container mx-auto p-6 max-w-2xl bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4 text-center">Список покупок</h1>
      <p className="text-lg text-gray-600 mb-6 text-center">
        На тиждень: <span className="font-semibold text-blue-700">{weekString && formatDateRange(weekString)}</span>
      </p>

      {shoppingList.length === 0 ? (
        <p className="text-gray-700 text-center py-10">
          Список покупок порожній. Додайте рецепти до плану харчування на цей тиждень.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {shoppingList
            .sort((a, b) => a.name.localeCompare(b.name)) // Сортування за назвою інгредієнта
            .map((item, index) => (
              <li key={index} className="flex justify-between items-center py-3">
                <span className="text-lg text-gray-800 font-medium">{item.name}</span>
                <span className="text-lg text-blue-600 font-semibold">
                  {/* Використовуємо formatQuantityForDisplay для відображення */}
                  {formatQuantityForDisplay(item.quantity, getUnitCategory(item.unit) || 'count').value}{' '}
                  {formatQuantityForDisplay(item.quantity, getUnitCategory(item.unit) || 'count').unit}
                </span>
              </li>
            ))}
        </ul>
      )}

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={handlePrint}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors transform hover:scale-105"
        >
          Друк списку
        </button>
        <Link href="/meal-planner" className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors transform hover:scale-105">
          До планувальника
        </Link>
      </div>
    </div>
  );
}
