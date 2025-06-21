// src/components/meal-planner/RecipeSidebar.tsx
'use client';

import React, { useState, ChangeEvent } from 'react';
import { Recipe } from '@/types/meal-plan';
import RecipeCard from './RecipeCard';

interface RecipeSidebarProps {
  availableRecipes: Recipe[]; // Повний список доступних рецептів
}

function RecipeSidebar({ availableRecipes }: RecipeSidebarProps) {
  const [searchTerm, setSearchTerm] = useState<string>(''); // Стан для пошукового запиту

  // Обробник зміни значення в полі пошуку
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Обробник очищення поля пошуку
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Фільтруємо рецепти на основі пошукового запиту
  const filteredRecipes = availableRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-inner h-full flex flex-col"> {/* Додано flex flex-col для вертикального Flexbox */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex-shrink-0">Доступні Рецепти</h2> {/* flex-shrink-0 для запобігання стисканню */}

      {/* Поле пошуку та кнопка очищення */}
      <div className="mb-4 flex items-center gap-2 flex-shrink-0"> {/* Додано items-center та flex-shrink-0 */}
        <input
          type="text"
          placeholder="Пошук за назвою або описом..."
          value={searchTerm}
          onChange={handleSearchChange}
          // Додано min-w-0, щоб дозволити input стискатися, якщо необхідно
          // Додано flex-grow для того, щоб input займав весь доступний простір
          className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-0"
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex-shrink-0" /* flex-shrink-0 для кнопки */
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Контейнер для списку рецептів з прокруткою */}
      {/* flex-grow дозволить цьому div займати решту доступного вертикального простору */}
      {/* overflow-y-auto забезпечить вертикальну прокрутку */}
      <div className="flex-grow overflow-y-auto pr-2">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        ) : (
          <p className="text-gray-600 italic text-center mt-8">
            {searchTerm ? 'Рецепти не знайдено за вашим запитом.' : 'Немає доступних рецептів.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default RecipeSidebar;
