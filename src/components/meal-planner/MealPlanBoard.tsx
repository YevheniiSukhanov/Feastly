// src/components/meal-planner/MealPlanBoard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

import {
  MealPlanBoardState,
  Recipe,
  BoardDay,
  MealPlanEntry,
  MealType,
} from '@/types/meal-plan';
import RecipeSidebar from './RecipeSidebar';
import DayColumn from './DayColumn';
import { addMealPlanEntryAction, updateMealPlanEntryAction, deleteMealPlanEntryAction } from '@/lib/actions';
import DraggableMealEntry from './DraggableMealEntry';
import RecipeCard from './RecipeCard';

interface MealPlanBoardProps {
  initialData: MealPlanBoardState;
  currentWeekStartDate: string; // "YYYY-MM-DD"
  weekDisplay: string; // "6 січня - 12 січня"
}

function formatDayDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(date);
}

// Допоміжна функція для отримання рядка дати в форматі "YYYY-MM-DD"
// (повторно визначена тут для зручності, якщо вона не експортується з page.tsx)
function getYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function MealPlanBoard({ initialData, currentWeekStartDate, weekDisplay }: MealPlanBoardProps) {
  const [boardState, setBoardState] = useState<MealPlanBoardState>(initialData);
  const [activeDraggableId, setActiveDraggableId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    setBoardState(initialData);
  }, [initialData]);

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveDraggableId(null);

    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const activeType = active.data.current?.type as 'recipe' | 'meal-entry';

    const overId = String(over.id);
    const overType = over.data.current?.type as 'meal-sector';

    const destinationDay = over.data.current?.day as string;
    const destinationMealType = over.data.current?.mealType as MealType;
    const destinationMealPlanId = boardState.currentMealPlanId;

    if (!destinationDay || !destinationMealType || !destinationMealPlanId) {
      console.warn('Invalid drop target data. Missing day, mealType, or mealPlanId.');
      return;
    }

    if (activeType === 'recipe') {
      // --- ЛОГІКА ДОДАВАННЯ НОВОГО РЕЦЕПТУ (БЕЗ ЗМІН) ---
      const recipe = boardState.availableRecipes.find(r => r.id === activeId);
      if (!recipe) {
        console.error('Recipe not found in availableRecipes:', activeId);
        return;
      }

      const newEntryId = crypto.randomUUID();

      const newEntry: MealPlanEntry = {
        id: newEntryId,
        mealPlanId: destinationMealPlanId,
        recipeId: recipe.id,
        recipe: recipe,
        mealDate: new Date(destinationDay),
        mealType: destinationMealType,
      };

      setBoardState(prevState => {
        const updatedPlan = prevState.currentWeekPlan.map(day => {
          if (day.date === destinationDay) {
            return {
              ...day,
              meals: {
                ...day.meals,
                [destinationMealType]: [...day.meals[destinationMealType], newEntry],
              },
            };
          }
          return day;
        });
        return { ...prevState, currentWeekPlan: updatedPlan };
      });

      try {
        await addMealPlanEntryAction({
          mealPlanId: newEntry.mealPlanId,
          recipeId: newEntry.recipeId!,
          mealDate: getYYYYMMDD(newEntry.mealDate),
          mealType: newEntry.mealType,
        });
      } catch (error) {
        console.error('Failed to add meal plan entry:', error);
        alert('Помилка при додаванні запису до плану харчування. Спробуйте ще раз.');
        router.refresh();
      }

    } else if (activeType === 'meal-entry') {
      // --- ЛОГІКА ПЕРЕТЯГУВАННЯ ІСНУЮЧОГО ЗАПИСУ МІЖ СЕКЦІЯМИ/ДНЯМИ ---
      const sourceDay = active.data.current?.day as string;
      const sourceMealType = active.data.current?.mealType as MealType;
      const entryId = activeId;

      // 1. Спочатку знаходимо об'єкт MealPlanEntry, який перетягуємо
      const entryToMove = boardState.currentWeekPlan
        .find(day => day.date === sourceDay)
        ?.meals[sourceMealType]
        .find(entry => entry.id === entryId);

      if (!entryToMove) {
        console.error('Meal entry to move not found in state:', entryId);
        // Не можна перемістити те, чого немає. Оновлюємо сторінку, щоб синхронізувати стан.
        router.refresh();
        return;
      }

      // Перевіряємо, чи переміщуємо в ту саму секцію
      if (sourceDay === destinationDay && sourceMealType === destinationMealType) {
        console.log('Dropped in the same sector. No action needed.');
        return; // Якщо місце призначення те ж саме, нічого не робимо
      }

      // 2. Оптимістичне оновлення стану: видаляємо з початкової позиції та додаємо до нової
      setBoardState(prevState => {
        let updatedPlan: BoardDay[] = prevState.currentWeekPlan.map(day => {
          // Якщо це день-джерело
          if (day.date === sourceDay) {
            return {
              ...day,
              meals: {
                ...day.meals,
                [sourceMealType]: day.meals[sourceMealType].filter(e => e.id !== entryId), // Видаляємо звідси
              },
            };
          }
          return day;
        });

        // Додаємо оновлений елемент до нового місця
        const updatedEntry: MealPlanEntry = {
          ...entryToMove, // Використовуємо знайдений entryToMove
          mealDate: new Date(destinationDay), // Оновлюємо дату
          mealType: destinationMealType,      // Оновлюємо тип прийому їжі
        };

        const finalPlan = updatedPlan.map(day => {
          if (day.date === destinationDay) {
            return {
              ...day,
              meals: {
                ...day.meals,
                [destinationMealType]: [...day.meals[destinationMealType], updatedEntry], // Додаємо сюди
              },
            };
          }
          return day;
        });
        return { ...prevState, currentWeekPlan: finalPlan };
      });

      // 3. Зберігаємо зміни в БД через Server Action
      try {
        await updateMealPlanEntryAction(entryToMove.id, {
          mealPlanId: entryToMove.mealPlanId,
          recipeId: entryToMove.recipeId!,
          mealDate: getYYYYMMDD(new Date(destinationDay)), // Передаємо нову дату для БД
          mealType: destinationMealType,
        });
        // Після успішного оновлення, Next.js revalidatePath('/meal-planner') оновить дані
        // це синхронізує клієнтський стан з БД.
      } catch (error) {
        console.error('Failed to update meal plan entry:', error);
        alert('Помилка при переміщенні запису плану харчування. Спробуйте ще раз.');
        router.refresh();
      }
    }
  };

  const activeRecipe = activeDraggableId && initialData.availableRecipes.find(r => r.id === activeDraggableId);
  // Знаходимо активний запис для DragOverlay з усього плану
  const activeMealEntry = activeDraggableId && boardState.currentWeekPlan.flatMap(day =>
    Object.values(day.meals).flat()
  ).find(entry => entry.id === activeDraggableId);


  const navigateToWeek = (offset: number) => {
    const currentMonday = new Date(currentWeekStartDate);
    currentMonday.setDate(currentMonday.getDate() + (offset * 7));
    const newWeekDate = getYYYYMMDD(currentMonday); // Використовуємо getYYYYMMDD
    router.push(`/meal-planner?week=${newWeekDate}`);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveDraggableId(String(active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDraggableId(null)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 0', borderBottom: '1px solid #eee' }}>
        <button onClick={() => navigateToWeek(-1)} style={{ padding: '8px 15px', fontSize: '1em', cursor: 'pointer' }}>
          &larr; Попередній тиждень
        </button>
        <h2 style={{ margin: '0', textAlign: 'center' }}>
          Тиждень: {weekDisplay}
        </h2>
        <button onClick={() => navigateToWeek(1)} style={{ padding: '8px 15px', fontSize: '1em', cursor: 'pointer' }}>
          Наступний тиждень &rarr;
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', minHeight: 'calc(100vh - 150px)' }}>
        <div style={{ width: '250px', flexShrink: 0, borderRight: '1px solid #eee', paddingRight: '20px' }}>
          <RecipeSidebar availableRecipes={boardState.availableRecipes} />
        </div>
        <div style={{ flexGrow: 1, display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
          {boardState.currentWeekPlan.map(day => (
            <DayColumn
              key={day.date}
              day={day}
              currentMealPlanId={boardState.currentMealPlanId!}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeDraggableId && activeRecipe ? (
          <RecipeCard recipe={activeRecipe} isDragging style={{ width: '230px' }} />
        ) : activeDraggableId && activeMealEntry ? (
          // Важливо: передаємо проп onDelete, навіть якщо він порожній, бо це вимагається інтерфейсом
          <DraggableMealEntry entry={activeMealEntry} onDelete={() => {}} isDragging style={{ width: '180px' }} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default MealPlanBoard;