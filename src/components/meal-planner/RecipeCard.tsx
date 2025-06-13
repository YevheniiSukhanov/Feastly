// src/components/meal-planner/RecipeCard.tsx
'use client';

import React, { forwardRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Recipe } from '@/types/meal-plan';

interface RecipeCardProps {
  recipe: Recipe;
  isDragging?: boolean; // Додаємо для DragOverlay
  style?: React.CSSProperties; // Для стилізації DragOverlay
}

const RecipeCard = forwardRef<HTMLDivElement, RecipeCardProps>(
  ({ recipe, isDragging, style, ...props }, ref) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: recipe.id, // Унікальний ID для dnd-kit
      data: {
        type: 'recipe', // Вказуємо тип елемента, що перетягується
        recipeId: recipe.id,
        recipeName: recipe.name,
      },
    });

    const cardStyle: React.CSSProperties = {
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '10px',
      marginBottom: '10px',
      backgroundColor: isDragging ? '#e0e0e0' : 'white',
      cursor: 'grab',
      opacity: isDragging ? 0.8 : 1, // Змінимо opacity для перетягування
      boxShadow: isDragging ? '0px 5px 15px rgba(0, 0, 0, 0.2)' : 'none',
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      ...style, // Застосовуємо передані стилі
    };

    return (
      <div
        ref={setNodeRef} // Прив'язуємо ref dnd-kit
        style={cardStyle}
        {...attributes} // Додаємо атрибути для доступності
        {...listeners} // Додаємо обробники подій миші
        {...props} // Інші пропси
      >
        <h3>{recipe.name}</h3>
        {recipe.imageUrl && (
          <img src={recipe.imageUrl} alt={recipe.name} style={{ maxWidth: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginTop: '5px' }} />
        )}
        <p style={{ fontSize: '0.8em', color: '#555' }}>Час підготовки: {recipe.prepTimeMinutes} хв</p>
      </div>
    );
  }
);

RecipeCard.displayName = 'RecipeCard';

export default RecipeCard;