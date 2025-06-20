// src/components/meal-planner/MealSector.tsx
'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BoardDay, MealPlanEntry, MealType } from '@/types/meal-plan';
import DraggableMealEntry from './DraggableMealEntry';
// Ми не викликаємо Server Action напряму тут, тільки через пропс
// import { deleteMealPlanEntryAction } from '@/lib/actions'; // Це більше не використовується напряму

interface MealSectorProps {
  day: BoardDay;
  mealType: MealType;
  entries: MealPlanEntry[]; // Тепер це завжди 0 або 1 MealPlanEntry
  currentMealPlanId: string;
  // Додаємо пропс для обробки видалення рецепта
  onRemoveRecipeFromSlot: (mealPlanEntryId: string, recipeId: string) => Promise<void>;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Сніданок',
  lunch: 'Обід',
  dinner: 'Вечеря',
  snack: 'Перекус',
};

function MealSector({ day, mealType, entries, currentMealPlanId, onRemoveRecipeFromSlot }: MealSectorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day.date}-${mealType}`, // Унікальний ID для цілі скидання
    data: {
      type: 'meal-sector', // Позначаємо, що це ціль скидання
      day: day.date,
      mealType: mealType,
      currentMealPlanId: currentMealPlanId,
    },
  });

  // Ця функція тепер видаляє КОНКРЕТНИЙ рецепт з MealPlanEntry
  const handleRemoveRecipe = async (mealPlanEntryId: string, recipeId: string) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей рецепт зі слоту?')) {
      await onRemoveRecipeFromSlot(mealPlanEntryId, recipeId);
    }
  };

  return (
    <div
      ref={setNodeRef} // Прив'язуємо ref dnd-kit
      style={{
        border: '1px dashed #ccc',
        borderRadius: '5px',
        padding: '10px',
        minHeight: '100px', // Щоб було куди скидати
        marginBottom: '10px',
        backgroundColor: isOver ? '#e6f7ff' : '#fff', // Колір при наведенні
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}
    >
      <h4>{mealTypeLabels[mealType]}</h4>
      {/* Тепер 'entries' містить один MealPlanEntry, який, своєю чергою, містить масив recipes */}
      {entries.length === 0 && <p style={{ fontSize: '0.9em', color: '#888' }}>Перетягніть сюди рецепт</p>}

      {entries.length > 0 && (
        <DraggableMealEntry
          // MealPlanEntry ID є унікальним ID для перетягування
          entry={entries[0]} // Ми припускаємо, що тут завжди максимум один MealPlanEntry
          onDelete={(recipeIdToDelete: string) => handleRemoveRecipe(entries[0].id, recipeIdToDelete)}
        />
      )}
    </div>
  );
}

export default MealSector;