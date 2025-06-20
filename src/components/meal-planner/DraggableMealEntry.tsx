// src/components/meal-planner/DraggableMealEntry.tsx
'use client';

import React, { forwardRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MealPlanEntry, Recipe } from '@/types/meal-plan';

interface DraggableMealEntryProps {
  entry: MealPlanEntry; // Це MealPlanEntry
  onDelete: (recipeId: string) => void; // Тепер onDelete приймає recipeId, а не entryId
  isDragging?: boolean; // Додаємо для DragOverlay
  style?: React.CSSProperties; // Для стилізації DragOverlay
}

const DraggableMealEntry = forwardRef<HTMLDivElement, DraggableMealEntryProps>(
  ({ entry, onDelete, isDragging, style, ...props }, ref) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: entry.id, // Унікальний ID для dnd-kit (ID самого MealPlanEntry)
      data: {
        type: 'meal-entry', // Позначаємо, що це вже запис плану (контейнер)
        day: new Date(entry.mealDate).toISOString().split('T')[0], // YYYY-MM-DD
        mealType: entry.mealType,
        // Ми не передаємо окремі recipeId тут, бо перетягуємо весь контейнер
      },
    });

    const entryStyle: React.CSSProperties = {
      border: '1px solid #007bff',
      backgroundColor: isDragging ? '#e6f7ff' : '#f0f8ff',
      borderRadius: '5px',
      padding: '8px',
      marginBottom: '5px',
      cursor: 'grab',
      opacity: isDragging ? 0.8 : 1,
      boxShadow: isDragging ? '0px 2px 5px rgba(0, 0, 0, 0.1)' : 'none',
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      ...style, // Застосовуємо передані стилі
      display: 'flex',
      flexDirection: 'column', // Розташовуємо рецепти вертикально
      gap: '5px', // Додаємо проміжок між елементами в колонці
      position: 'relative', // Для позиціонування кнопки видалення
    };

    return (
      <div
        ref={setNodeRef} // Прив'язуємо ref dnd-kit
        style={entryStyle}
        {...attributes} // Додаємо атрибути для доступності
        {...listeners} // Додаємо обробники подій миші
        {...props} // Інші пропси
      >
        {entry.recipes.length === 0 && (
            <span style={{ color: '#888', fontStyle: 'italic' }}>Слот порожній</span>
        )}
        {entry.recipes.map((mealEntryRecipe, index) => (
          <div
            key={mealEntryRecipe.recipeId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '4px 8px', // Внутрішній відступ для кожного рецепта
              backgroundColor: '#ffffff', // Фон для кожного рецепта
              borderRadius: '3px',
              border: '1px solid #e0e0e0', // Легка рамка для розділення
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              position: 'relative', // Для позиціонування кнопки всередині цього елемента
              // Додаємо відступи між елементами, крім останнього
              marginBottom: index < entry.recipes.length - 1 ? '4px' : '0',
            }}
          >
            <span style={{ flexGrow: 1, marginRight: '25px' }}>{mealEntryRecipe.recipe?.name || 'Без назви'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Важливо: зупиняємо поширення події, щоб не спрацьовувало перетягування
                onDelete(mealEntryRecipe.recipeId);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc3545',
                cursor: 'pointer',
                fontSize: '1em',
                lineHeight: '1',
                padding: '0', // Прибираємо внутрішній відступ
                position: 'absolute', // Абсолютне позиціонування
                right: '8px', // Відступ від правого краю
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1, // Щоб кнопка була поверх тексту при перекритті
              }}
              title={`Видалити "${mealEntryRecipe.recipe?.name || 'рецепт'}" зі слоту`}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    );
  }
);

DraggableMealEntry.displayName = 'DraggableMealEntry';

export default DraggableMealEntry;