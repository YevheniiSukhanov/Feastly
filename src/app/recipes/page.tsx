// src/app/recipes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Оновлений інтерфейс Recipe, щоб відображати нову структуру інгредієнтів
interface Recipe {
  id: string;
  name: string;
  instructions: string;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Інгредієнти тепер є масивом об'єктів IngredientOnRecipe,
  // кожен з яких включає деталі Ingredient
  ingredients: {
    quantity: number;
    unit: string;
    ingredient: { // Це фактичний об'єкт Ingredient
      id: string;
      name: string;
      unit: string; // Базова одиниця інгредієнта (наприклад, "кг", "шт")
    };
  }[];
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch('/api/recipes');
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const data: Recipe[] = await response.json();
        setRecipes(data);
      } catch (err: any) {
        setError(err.message || 'Error loading recipes');
        console.error('Failed to fetch recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  if (loading) {
    return <div className="text-center p-4 text-xl text-gray-700">Завантаження рецептів...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-xl text-red-600">Помилка: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">Рецепти</h1>
      <div className="flex justify-center mb-6">
        <Link href="/recipes/new" legacyBehavior>
          <a className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg">
            Створити новий рецепт
          </a>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p className="text-center text-xl text-gray-600">Поки що немає рецептів. Створіть перший!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">{recipe.name}</h2>
              {recipe.imageUrl && (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  style={{ maxWidth: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }}
                  className="w-full" // Додано для адаптивності
                />
              )}
              {/* Відображення інгредієнтів: ітеруємо по масиву та форматуємо */}
              <p className="text-gray-600 mb-2">
                **Інгредієнти:**{" "}
                {recipe.ingredients.length > 0
                  ? // Мапуємо кожен інгредієнт і формуємо рядок "Назва (Кількість Одиниця)"
                    recipe.ingredients
                      .map(ing => `${ing.ingredient.name} (${ing.quantity} ${ing.unit})`)
                      .join(', ') // Об'єднуємо всі рядки комою з пробілом
                  : 'Немає інгредієнтів'}
              </p>
              <p className="text-gray-600 mb-4 line-clamp-3">{recipe.instructions}</p> {/* Clamp instructions to 3 lines */}
              <div className="mt-auto"> {/* Push link to the bottom */}
                <Link href={`/recipes/edit/${recipe.id}`} legacyBehavior>
                  <a className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors">
                    Деталі та редагування
                  </a>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}