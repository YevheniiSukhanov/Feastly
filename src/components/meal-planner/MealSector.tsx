// src/components/meal-planner/MealSector.tsx
'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BoardDay, MealPlanEntry, MealType } from '@/types/meal-plan';
import DraggableMealEntry from './DraggableMealEntry';
import { deleteMealPlanEntryAction } from '@/lib/actions';

interface MealSectorProps {
  day: BoardDay;
  mealType: MealType;
  entries: MealPlanEntry[];
  currentMealPlanId: string;
}

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Сніданок',
  lunch: 'Обід',
  dinner: 'Вечеря',
  snack: 'Перекус',
};

function MealSector({ day, mealType, entries, currentMealPlanId }: MealSectorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day.date}-${mealType}`, // Унікальний ID для цілі скидання
    data: {
      type: 'meal-sector', // Позначаємо, що це ціль скидання
      day: day.date,
      mealType: mealType,
      currentMealPlanId: currentMealPlanId,
    },
  });

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей запис прийому їжі?')) {
      try {
        await deleteMealPlanEntryAction(entryId);
      } catch (error) {
        console.error('Failed to delete meal entry:', error);
        alert('Помилка при видаленні запису.');
      }
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
      {entries.length === 0 && <p style={{ fontSize: '0.9em', color: '#888' }}>Перетягніть сюди рецепт</p>}
      {entries.map(entry => (
        <DraggableMealEntry key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
      ))}
    </div>
  );
}

export default MealSector;