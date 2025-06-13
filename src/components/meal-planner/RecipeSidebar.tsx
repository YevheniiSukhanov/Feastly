// src/components/meal-planner/RecipeSidebar.tsx
'use client';

import React from 'react';
import { Recipe } from '@/types/meal-plan';
import RecipeCard from './RecipeCard'; // Імпортуємо новий компонент

interface RecipeSidebarProps {
  availableRecipes: Recipe[];
}

function RecipeSidebar({ availableRecipes }: RecipeSidebarProps) {
  return (
    <div>
      <h2>Доступні Рецепти</h2>
      <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', paddingRight: '10px' }}>
        {availableRecipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

export default RecipeSidebar;