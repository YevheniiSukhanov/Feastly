// src/components/meal-planner/DraggableMealEntry.tsx
'use client';

import React, { forwardRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MealPlanEntry } from '@/types/meal-plan';

interface DraggableMealEntryProps {
  entry: MealPlanEntry;
  onDelete: (entryId: string) => void;
  isDragging?: boolean; // Додаємо для DragOverlay
  style?: React.CSSProperties; // Для стилізації DragOverlay
}

const DraggableMealEntry = forwardRef<HTMLDivElement, DraggableMealEntryProps>(
  ({ entry, onDelete, isDragging, style, ...props }, ref) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: entry.id, // Унікальний ID для dnd-kit
      data: {
        type: 'meal-entry', // Позначаємо, що це вже запис плану
        // Передаємо date та mealType як рядки YYYY-MM-DD та string enum
        day: new Date(entry.mealDate).toISOString().split('T')[0], // Використовуємо YYYY-MM-DD
        mealType: entry.mealType,
        recipeId: entry.recipeId,
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
      justifyContent: 'space-between',
      alignItems: 'center',
    };

    return (
      <div
        ref={setNodeRef} // Прив'язуємо ref dnd-kit
        style={entryStyle}
        {...attributes} // Додаємо атрибути для доступності
        {...listeners} // Додаємо обробники подій миші
        {...props} // Інші пропси
      >
        <span>{entry.recipe?.name || 'Без рецепту'}</span>
        <button
          onClick={() => onDelete(entry.id)}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc3545',
            cursor: 'pointer',
            fontSize: '1.2em',
            lineHeight: '1',
            padding: '0 5px',
          }}
          title="Видалити запис"
        >
          &times; {/* Символ "х" */}
        </button>
      </div>
    );
  }
);

DraggableMealEntry.displayName = 'DraggableMealEntry';

export default DraggableMealEntry;