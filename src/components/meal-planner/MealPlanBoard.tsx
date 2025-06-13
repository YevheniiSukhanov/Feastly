// src/components/meal-planner/MealPlanBoard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Для зміни URL
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

// Допоміжна функція для форматування дати дня у "день місяць"
// Виправлення 3: Парсимо дату явно, щоб уникнути проблем часових поясів
function formatDayDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    // Створюємо дату в локальному часовому поясі
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(date);
}

function MealPlanBoard({ initialData, currentWeekStartDate, weekDisplay }: MealPlanBoardProps) {
  const [boardState, setBoardState] = useState<MealPlanBoardState>(initialData);
  const [activeDraggableId, setActiveDraggableId] = useState<string | null>(null);
  const router = useRouter(); // Для навігації

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Починати перетягування після 8px руху
      },
    })
  );

  // Оновлюємо стан, якщо initialData зміниться (після revalidatePath)
  useEffect(() => {
    setBoardState(initialData);
  }, [initialData]);

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveDraggableId(null); // Скидаємо активний елемент

    const { active, over } = event;

    if (!over) return; // Елемент не був скинутий на допустиму ціль

    const activeId = String(active.id); // ID елемента, який перетягуємо
    const activeType = active.data.current?.type as 'recipe' | 'meal-entry'; // Тип: рецепт або запис плану

    const overId = String(over.id); // ID цілі
    const overType = over.data.current?.type as 'meal-sector'; // Тип цілі (ми скидаємо тільки на сектори)

    // Витягуємо дані з цілі скидання
    const destinationDay = over.data.current?.day as string; // 'YYYY-MM-DD'
    const destinationMealType = over.data.current?.mealType as MealType;
    const destinationMealPlanId = boardState.currentMealPlanId;

    if (!destinationDay || !destinationMealType || !destinationMealPlanId) {
      console.warn('Invalid drop target data. Missing day, mealType, or mealPlanId.');
      return;
    }

    // --- Логіка оновлення стану та взаємодії з БД ---

    if (activeType === 'recipe') {
      // Перетягування НОВОГО РЕЦЕПТУ на дошку
      const recipe = boardState.availableRecipes.find(r => r.id === activeId);
      if (!recipe) {
        console.error('Recipe not found in availableRecipes:', activeId);
        return;
      }

      const newEntryId = crypto.randomUUID(); // Генеруємо тимчасовий ID на клієнті

      const newEntry: MealPlanEntry = {
        id: newEntryId,
        mealPlanId: destinationMealPlanId,
        recipeId: recipe.id,
        recipe: recipe, // Додаємо об'єкт рецепту для відображення на клієнті
        mealDate: new Date(destinationDay), // Дата повинна бути в форматі Date
        mealType: destinationMealType,
      };

      // Виправлення 2: Оптимістичне оновлення стану для "залишається на місці"
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

      // Зберігаємо в БД через Server Action
      try {
        await addMealPlanEntryAction({
          mealPlanId: newEntry.mealPlanId,
          recipeId: newEntry.recipeId!,
          mealDate: newEntry.mealDate.toISOString().split('T')[0], // Для DB, YYYY-MM-DD
          mealType: newEntry.mealType,
        });
        // Після успішного додавання, Next.js revalidatePath('/meal-planner') оновить дані
        // Це призведе до нового рендерингу page.tsx і оновлення initialData,
        // що синхронізує клієнтський стан з БД.
      } catch (error) {
        console.error('Failed to add meal plan entry:', error);
        alert('Помилка при додаванні запису до плану харчування. Спробуйте ще раз.');
        setBoardState(initialData); // Відкочуємо до початкового стану, якщо помилка
      }

    } else if (activeType === 'meal-entry') {
      // Перетягування ІСНУЮЧОГО ЗАПИСУ на дошці (зміна місця)
      const sourceDay = active.data.current?.day as string;
      const sourceMealType = active.data.current?.mealType as MealType;
      const entryId = activeId;

      let entryToMove: MealPlanEntry | undefined;

      // Оновлюємо клієнтський стан: видаляємо з початкової позиції
      setBoardState(prevState => {
        const updatedPlan = prevState.currentWeekPlan.map(day => {
          if (day.date === sourceDay) {
            const originalEntries = day.meals[sourceMealType];
            entryToMove = originalEntries.find(e => e.id === entryId);
            if (entryToMove) {
              return {
                ...day,
                meals: {
                  ...day.meals,
                  [sourceMealType]: originalEntries.filter(e => e.id !== entryId),
                },
              };
            }
          }
          return day;
        });
        return { ...prevState, currentWeekPlan: updatedPlan };
      });

      if (!entryToMove) {
        console.error('Meal entry to move not found:', entryId);
        return;
      }

      // Оновлюємо його дані для нового місця
      const updatedEntry: MealPlanEntry = {
        ...entryToMove,
        mealDate: new Date(destinationDay), // Нова дата в форматі Date
        mealType: destinationMealType,
      };

      // Додаємо оновлений елемент до нового місця в клієнтському стані
      setBoardState(prevState => {
        const updatedPlan = prevState.currentWeekPlan.map(day => {
          if (day.date === destinationDay) {
            return {
              ...day,
              meals: {
                ...day.meals,
                [destinationMealType]: [...day.meals[destinationMealType], updatedEntry],
              },
            };
          }
          return day;
        });
        return { ...prevState, currentWeekPlan: updatedPlan };
      });

      try {
        await updateMealPlanEntryAction(updatedEntry.id, {
          mealPlanId: updatedEntry.mealPlanId, // Залишаємо той самий план
          recipeId: updatedEntry.recipeId!,
          mealDate: updatedEntry.mealDate.toISOString().split('T')[0], // Для DB, YYYY-MM-DD
          mealType: updatedEntry.mealType,
        });
      } catch (error) {
        console.error('Failed to update meal plan entry:', error);
        alert('Помилка при переміщенні запису плану харчування. Спробуйте ще раз.');
        setBoardState(initialData); // Відкочуємо
      }
    }
  };

  // Визначаємо, який елемент зараз перетягується для DragOverlay
  const activeRecipe = activeDraggableId && initialData.availableRecipes.find(r => r.id === activeDraggableId);
  const activeMealEntry = activeDraggableId && initialData.currentWeekPlan.flatMap(day => Object.values(day.meals).flat()).find(entry => entry.id === activeDraggableId);

  // Виправлення 2: Перемикання тижнів
  const navigateToWeek = (offset: number) => {
    // Створюємо нову дату на основі поточного початку тижня
    const currentMonday = new Date(currentWeekStartDate);
    currentMonday.setDate(currentMonday.getDate() + (offset * 7)); // Додаємо/віднімаємо 7 днів
    const newWeekDate = currentMonday.toISOString().split('T')[0]; // Форматуємо для URL
    router.push(`/meal-planner?week=${newWeekDate}`);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveDraggableId(String(active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDraggableId(null)} // Якщо перетягування скасовано
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '10px 0', borderBottom: '1px solid #eee' }}>
        <button onClick={() => navigateToWeek(-1)} style={{ padding: '8px 15px', fontSize: '1em', cursor: 'pointer' }}>
          &larr; Попередній тиждень
        </button>
        <h2 style={{ margin: '0', textAlign: 'center' }}>
          Тиждень: {weekDisplay}
          {/* Можна додати номер тижня, якщо є логіка його обчислення */}
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
              // Передаємо об'єкт дня, який вже містить відформатовану дату та назву
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
          <DraggableMealEntry entry={activeMealEntry} onDelete={() => {}} isDragging style={{ width: '180px' }} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default MealPlanBoard;