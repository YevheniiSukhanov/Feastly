// src/app/recipes/new/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Імпортуємо константи та функцію з нашого нового файлу
import { getCompatibleRecipeUnits, ALL_ALLOWED_RECIPE_UNITS } from '@/lib/constants'; 

// Тип для наявних інгредієнтів (для вибору)
interface AvailableIngredient {
  id: string;
  name: string;
  unit: string; // Базова одиниця інгредієнта (тепер використовується для фільтрації)
}

// Тип для інгредієнта, доданого до рецепту
interface RecipeIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
}



export default function CreateRecipePage() {
  const [name, setName] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | ''>('');
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | ''>('');
  const [servings, setServings] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState<string>('');

  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([]);
  const [selectedRecipeIngredients, setSelectedRecipeIngredients] = useState<RecipeIngredient[]>([]);

  const [currentIngredientId, setCurrentIngredientId] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<number | ''>(1);
  const [currentUnit, setCurrentUnit] = useState<string>(ALL_ALLOWED_RECIPE_UNITS[0]); // Початкове значення
  const [filteredRecipeUnits, setFilteredRecipeUnits] = useState<string[]>(ALL_ALLOWED_RECIPE_UNITS); // Додаємо новий стан

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Ефект для завантаження всіх доступних інгредієнтів з API
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch('/api/ingredients');
        if (!response.ok) {
          throw new Error('Не вдалося завантажити інгредієнти.');
        }
        const data: AvailableIngredient[] = await response.json();
        setAvailableIngredients(data);
        if (data.length > 0) {
          setCurrentIngredientId(data[0].id); // Встановлюємо перший інгредієнт як вибраний за замовчуванням
          // Оновлюємо фільтровані одиниці на основі першого інгредієнта
          const baseUnitOfFirstIngredient = data[0].unit;
          const compatibleUnits = getCompatibleRecipeUnits(baseUnitOfFirstIngredient);
          setFilteredRecipeUnits(compatibleUnits);
          setCurrentUnit(compatibleUnits[0] || ALL_ALLOWED_RECIPE_UNITS[0]); // Встановлюємо першу сумісну або дефолтну
        } else {
          setFilteredRecipeUnits([]); // Якщо немає інгредієнтів, то і одиниць немає
        }
      } catch (err: any) {
        console.error('Error fetching available ingredients:', err);
        setError(err.message || 'Помилка при завантаженні інгредієнтів.');
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  // Ефект для оновлення фільтрованих одиниць при зміні вибраного інгредієнта
  useEffect(() => {
    if (currentIngredientId && availableIngredients.length > 0) {
      const selectedIngredient = availableIngredients.find(ing => ing.id === currentIngredientId);
      if (selectedIngredient) {
        const compatibleUnits = getCompatibleRecipeUnits(selectedIngredient.unit);
        setFilteredRecipeUnits(compatibleUnits);
        // Якщо поточна одиниця не сумісна з новим інгредієнтом, встановлюємо першу сумісну
        if (!compatibleUnits.includes(currentUnit)) {
          setCurrentUnit(compatibleUnits[0] || ALL_ALLOWED_RECIPE_UNITS[0]);
        }
      }
    }
  }, [currentIngredientId, availableIngredients]); // Залежить від ID інгредієнта та списку доступних

  const handleAddIngredient = () => {
    setError(null);
    if (!currentIngredientId || currentQuantity === '' || currentUnit === '') {
      setError('Будь ласка, оберіть інгредієнт, вкажіть кількість та одиницю.');
      return;
    }
    if (typeof currentQuantity !== 'number' || currentQuantity <= 0) {
      setError('Кількість має бути позитивним числом.');
      return;
    }
    if (selectedRecipeIngredients.some(ing => ing.ingredientId === currentIngredientId)) {
      setError('Цей інгредієнт вже додано до рецепту. Оновіть його кількість або видаліть і додайте знову.');
      return;
    }

    const selectedIngredient = availableIngredients.find(ing => ing.id === currentIngredientId);
    if (selectedIngredient) {
      setSelectedRecipeIngredients(prev => [
        ...prev,
        {
          ingredientId: selectedIngredient.id,
          name: selectedIngredient.name,
          quantity: currentQuantity,
          unit: currentUnit,
        },
      ]);
      // Очищаємо поля для наступного додавання
      setCurrentIngredientId(availableIngredients.length > 0 ? availableIngredients[0].id : '');
      setCurrentQuantity(1);
      // currentUnit та filteredRecipeUnits будуть оновлені через useEffect
    }
  };

  const handleRemoveIngredient = (idToRemove: string) => {
    setSelectedRecipeIngredients(prev => prev.filter(ing => ing.ingredientId !== idToRemove));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    // Валідація основних полів рецепту
    if (!name.trim()) {
      setError('Назва рецепту є обов\'язковою.');
      setSubmitting(false);
      return;
    }
    if (!instructions.trim()) {
      setError('Інструкції є обов\'язковими.');
      setSubmitting(false);
      return;
    }
    if (selectedRecipeIngredients.length === 0) {
      setError('Будь ласка, додайте хоча б один інгредієнт до рецепту.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          instructions: instructions.trim(),
          prepTimeMinutes: prepTimeMinutes === '' ? null : Number(prepTimeMinutes),
          cookTimeMinutes: cookTimeMinutes === '' ? null : Number(cookTimeMinutes),
          servings: servings === '' ? null : Number(servings),
          imageUrl: imageUrl.trim() === '' ? null : imageUrl.trim(),
          
          ingredients: selectedRecipeIngredients.map(ing => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('Рецепт успішно створено!');
      router.push('/recipes');
    } catch (err: any) {
      console.error('Failed to create recipe:', err);
      setError(err.message || 'Не вдалося створити рецепт. Спробуйте пізніше.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl font-semibold text-gray-700">Завантаження інгредієнтів...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Створити Новий Рецепт</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Помилка!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Основні поля рецепту */}
        {/* ... (Ваші існуючі поля для назви, інструкцій, часу, порцій, зображення) ... */}
        <div className="mb-5">
          <label htmlFor="name" className="block text-gray-700 text-lg font-medium mb-2">
            Назва рецепту <span className="text-red-500">*</span>
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
          <label htmlFor="instructions" className="block text-gray-700 text-lg font-medium mb-2">
            Інструкції <span className="text-red-500">*</span>
          </label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base resize-none"
            required
            aria-required="true"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label htmlFor="prepTimeMinutes" className="block text-gray-700 text-lg font-medium mb-2">
              Час підготовки (хв)
            </label>
            <input
              type="number"
              id="prepTimeMinutes"
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            />
          </div>
          <div>
            <label htmlFor="cookTimeMinutes" className="block text-gray-700 text-lg font-medium mb-2">
              Час приготування (хв)
            </label>
            <input
              type="number"
              id="cookTimeMinutes"
              value={cookTimeMinutes}
              onChange={(e) => setCookTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            />
          </div>
          <div>
            <label htmlFor="servings" className="block text-gray-700 text-lg font-medium mb-2">
              Кількість порцій
            </label>
            <input
              type="number"
              id="servings"
              value={servings}
              onChange={(e) => setServings(e.target.value === '' ? '' : Number(e.target.value))}
              min="1"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            />
          </div>
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
            placeholder="http://example.com/recipe-image.jpg"
          />
        </div>

        {/* Секція додавання інгредієнтів */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8 border-t pt-6">Інгредієнти Рецепту <span className="text-red-500">*</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
          <div className="md:col-span-2">
            <label htmlFor="ingredient-select" className="block text-gray-700 text-lg font-medium mb-2">
              Виберіть інгредієнт
            </label>
            <select
              id="ingredient-select"
              value={currentIngredientId}
              onChange={(e) => setCurrentIngredientId(e.target.value)}
              className="shadow border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
              disabled={availableIngredients.length === 0}
            >
              {availableIngredients.length === 0 ? (
                <option value="">Немає доступних інгредієнтів</option>
              ) : (
                availableIngredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label htmlFor="quantity" className="block text-gray-700 text-lg font-medium mb-2">
              Кількість
            </label>
            <input
              type="number"
              id="quantity"
              value={currentQuantity}
              onChange={(e) => setCurrentQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              min="0.01"
              step="0.01"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            />
          </div>
          <div>
            <label htmlFor="unit-select" className="block text-gray-700 text-lg font-medium mb-2">
              Одиниця
            </label>
            <select
              id="unit-select"
              value={currentUnit}
              onChange={(e) => setCurrentUnit(e.target.value)}
              className="shadow border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            >
              {/* Використовуємо відфільтровані одиниці */}
              {filteredRecipeUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="button"
              onClick={handleAddIngredient}
              disabled={availableIngredients.length === 0 || !currentIngredientId || currentQuantity === '' || currentQuantity <= 0 || filteredRecipeUnits.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
            >
              Додати інгредієнт
            </button>
          </div>
        </div>

        {/* Список доданих інгредієнтів */}
        {selectedRecipeIngredients.length > 0 && (
          <div className="mb-6 border p-4 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Додані інгредієнти:</h3>
            <ul>
              {selectedRecipeIngredients.map((ing) => (
                <li key={ing.ingredientId} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="text-gray-700 text-lg">{ing.name}: {ing.quantity} {ing.unit}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ing.ingredientId)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md transition-colors text-sm"
                  >
                    Видалити
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Link href="/recipes" legacyBehavior>
            <a className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg">
              Скасувати
            </a>
          </Link>
          <button
            type="submit"
            disabled={submitting || selectedRecipeIngredients.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Створення...' : 'Створити рецепт'}
          </button>
        </div>
      </form>
    </div>
  );
}