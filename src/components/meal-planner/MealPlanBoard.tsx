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
  MealPlanEntryRecipe, // Імпортуємо новий тип
} from '@/types/meal-plan';
import { getYYYYMMDD, getStartOfDayUTC } from '@/lib/utils'; // Важливо: імпортуємо getStartOfDayUTC
import RecipeSidebar from './RecipeSidebar';
import DayColumn from './DayColumn';
// Оновлені імпорти Server Actions
import { updateMealPlanSlotRecipesAction, clearMealPlanSlotAction, createMealPlanIfNotExistsAction } from '@/lib/actions';
import DraggableMealEntry from './DraggableMealEntry';
import RecipeCard from './RecipeCard';

interface MealPlanBoardProps {
  initialData: MealPlanBoardState;
  currentWeekStartDate: string; // "YYYY-MM-DD"
  weekDisplay: string; // "6 січня - 12 січня"
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

    const destinationDay = over.data.current?.day as string;
    const destinationMealType = over.data.current?.mealType as MealType;
    let destinationMealPlanId = boardState.currentMealPlanId; // Може бути null, якщо плану немає

    if (!destinationDay || !destinationMealType) {
      console.warn('Invalid drop target data. Missing day or mealType.');
      return;
    }

    // Якщо плану харчування ще немає для цього тижня, створюємо його
    if (!destinationMealPlanId) {
      try {
        const newMealPlan = await createMealPlanIfNotExistsAction({
          weekStartDate: currentWeekStartDate, // Використовуємо weekStartDate з пропсів
          // userId: 'TODO_CURRENT_USER_ID', // TODO: Додати ID користувача
        });
        destinationMealPlanId = newMealPlan.id;
        // Оптимістично оновлюємо boardState.currentMealPlanId
        setBoardState(prevState => ({ ...prevState, currentMealPlanId: newMealPlan.id }));
      } catch (error) {
        console.error('Failed to create meal plan:', error);
        alert('Помилка при створенні плану харчування. Спробуйте ще раз.');
        router.refresh();
        return;
      }
    }


    if (activeType === 'recipe') {
      // --- ЛОГІКА ДОДАВАННЯ НОВОГО РЕЦЕПТУ ДО СЛОТУ ---
      const recipe = boardState.availableRecipes.find(r => r.id === activeId);
      if (!recipe) {
        console.error('Recipe not found in availableRecipes:', activeId);
        return;
      }

      // ЗНАЙТИ ПОТОЧНИЙ СТАН СЛОТУ
      const targetDayData = boardState.currentWeekPlan.find(day => day.date === destinationDay);
      const currentMealPlanEntry = targetDayData?.meals[destinationMealType]?.[0]; // Припускаємо, що MealPlanEntry для слоту буде один

      let currentRecipeIds: string[] = [];
      if (currentMealPlanEntry) {
        currentRecipeIds = currentMealPlanEntry.recipes.map(mr => mr.recipeId);
      }

      // Додаємо новий рецепт, уникаючи дублікатів
      const updatedRecipeIds = Array.from(new Set([...currentRecipeIds, recipe.id]));

      // Оптимістичне оновлення стану
      setBoardState(prevState => {
        const updatedPlan = prevState.currentWeekPlan.map(day => {
          if (day.date === destinationDay) {
            const existingEntry = day.meals[destinationMealType][0];
            const updatedEntry: MealPlanEntry = existingEntry
              ? {
                  ...existingEntry,
                  recipes: updatedRecipeIds.map(rId => ({
                    recipeId: rId,
                    recipe: prevState.availableRecipes.find(ar => ar.id === rId) || { id: rId, name: 'Невідомий рецепт', instructions: '', ingredients: [], cuisine: '', prepTimeMinutes: 0, cookTimeMinutes: 0 } as Recipe,
                  })),
                }
              : {
                  id: crypto.randomUUID(), // New UUID for new MealPlanEntry
                  mealPlanId: destinationMealPlanId!,
                  mealDate: new Date(destinationDay),
                  mealType: destinationMealType,
                  recipes: updatedRecipeIds.map(rId => ({
                    recipeId: rId,
                    recipe: prevState.availableRecipes.find(ar => ar.id === rId) || { id: rId, name: 'Невідомий рецепт', instructions: '', ingredients: [], cuisine: '', prepTimeMinutes: 0, cookTimeMinutes: 0 } as Recipe,
                  })),
                  // Додаткові поля, якщо вони є у MealPlanEntry, але не в MealPlanEntryRecipe
                  notes: '', // Приклад
                };

            return {
              ...day,
              meals: {
                ...day.meals,
                [destinationMealType]: [updatedEntry], // Завжди один MealPlanEntry на слот
              },
            };
          }
          return day;
        });
        return { ...prevState, currentWeekPlan: updatedPlan };
      });

      // Виклик Server Action для оновлення/створення
      try {
        await updateMealPlanSlotRecipesAction({
          mealPlanId: destinationMealPlanId!,
          mealDate: getStartOfDayUTC(destinationDay), // <<< ПЕРЕДАЄМО Date ОБ'ЄКТ
          mealType: destinationMealType,
          recipeIds: updatedRecipeIds,
        });
        router.refresh(); // Оновити дані після успішної дії
      } catch (error) {
        console.error('Failed to update meal plan slot recipes:', error);
        alert('Помилка при додаванні рецепту до плану. Спробуйте ще раз.');
        router.refresh();
      }

    } else if (activeType === 'meal-entry') {
      // --- ЛОГІКА ПЕРЕМІЩЕННЯ ІСНУЮЧОГО СЛОТУ (MealPlanEntry) МІЖ СЕКЦІЯМИ/ДНЯМИ ---
      const sourceDay = active.data.current?.day as string;
      const sourceMealType = active.data.current?.mealType as MealType;
      const entryToMoveId = activeId; // Це ID MealPlanEntry

      // 1. Знаходимо об'єкт MealPlanEntry, який перетягуємо
      const sourceDayData = boardState.currentWeekPlan.find(day => day.date === sourceDay);
      const entryToMove = sourceDayData?.meals[sourceMealType].find(entry => entry.id === entryToMoveId);

      if (!entryToMove) {
        console.error('Meal entry to move not found in state:', entryToMoveId);
        router.refresh();
        return;
      }

      // Перевіряємо, чи переміщуємо в ту саму секцію
      if (sourceDay === destinationDay && sourceMealType === destinationMealType) {
        console.log('Dropped in the same sector. No action needed.');
        return;
      }

      // Збираємо рецепти для переміщення
      const recipeIdsToMove = entryToMove.recipes.map(mpre => mpre.recipeId);

      // Оптимістичне оновлення стану
      setBoardState(prevState => {
        let updatedPlan: BoardDay[] = prevState.currentWeekPlan.map(day => {
          // Видаляємо MealPlanEntry з джерела
          if (day.date === sourceDay) {
            return {
              ...day,
              meals: {
                ...day.meals,
                [sourceMealType]: day.meals[sourceMealType].filter(e => e.id !== entryToMoveId),
              },
            };
          }
          return day;
        });

        // Додаємо рецепти до цільового слоту (або створюємо новий MealPlanEntry)
        updatedPlan = updatedPlan.map(day => {
          if (day.date === destinationDay) {
            const existingEntry = day.meals[destinationMealType][0];
            let updatedEntry: MealPlanEntry;
            let finalRecipeIds: string[] = [];

            if (existingEntry) {
              // Якщо слот призначення вже містить MealPlanEntry, додаємо рецепти до нього
              const currentDestRecipeIds = existingEntry.recipes.map(mpre => mpre.recipeId);
              finalRecipeIds = Array.from(new Set([...currentDestRecipeIds, ...recipeIdsToMove]));
              updatedEntry = {
                ...existingEntry,
                recipes: finalRecipeIds.map(rId => ({
                  recipeId: rId,
                  recipe: prevState.availableRecipes.find(ar => ar.id === rId) || { id: rId, name: 'Невідомий рецепт', instructions: '', ingredients: [], cuisine: '', prepTimeMinutes: 0, cookTimeMinutes: 0 } as Recipe,
                })),
              };
            } else {
              // Якщо слот призначення порожній, створюємо новий MealPlanEntry
              finalRecipeIds = recipeIdsToMove; // Просто переміщуємо всі рецепти
              updatedEntry = {
                id: entryToMoveId, // Зберігаємо той самий ID для переміщеного запису, якщо це логічно, або генеруємо новий
                mealPlanId: destinationMealPlanId!,
                mealDate: new Date(destinationDay),
                mealType: destinationMealType,
                recipes: finalRecipeIds.map(rId => ({
                  recipeId: rId,
                  recipe: prevState.availableRecipes.find(ar => ar.id === rId) || { id: rId, name: 'Невідомий рецепт', instructions: '', ingredients: [], cuisine: '', prepTimeMinutes: 0, cookTimeMinutes: 0 } as Recipe,
                })),
                notes: entryToMove.notes,
              };
            }

            return {
              ...day,
              meals: {
                ...day.meals,
                [destinationMealType]: [updatedEntry], // Завжди один MealPlanEntry на слот
              },
            };
          }
          return day;
        });
        return { ...prevState, currentWeekPlan: updatedPlan };
      });


      // 3. Зберігаємо зміни в БД через Server Action
      try {
        // Очищаємо старий слот (або оновлюємо його, якщо там були інші рецепти)
        // Для спрощення: очищаємо старий слот, а потім оновлюємо новий.
        // Це не ідеально, якщо в старому слоті були інші рецепти, які не переміщуються.
        // Для повної коректності тут потрібен більш складний Transaction або окремі дії "видалити рецепт зі слоту" та "додати рецепт до слоту".
        // Проте, оскільки ми перетягуємо весь MealPlanEntry, це означає, що всі його рецепти йдуть з ним.

        // Якщо oldSlot залишається порожнім, видаляємо його.
        // Якщо в старому слоті були інші рецепти (або ми перемістили лише один),
        // тоді нам потрібно їх оновити.
        // Для спрощення поточного сценарію, ми припускаємо, що MealPlanEntry переміщується цілком.
        // Це означає, що старий слот видаляється, а новий оновлюється/створюється.

        // Видалення зі старого слоту
        await clearMealPlanSlotAction({
          mealPlanId: destinationMealPlanId!,
          mealDate: getStartOfDayUTC(sourceDay), // <<< ПЕРЕДАЄМО Date ОБ'ЄКТ
          mealType: sourceMealType,
        });

        // Додавання до нового слоту
        const finalDestDayData = boardState.currentWeekPlan.find(day => day.date === destinationDay);
        const finalDestEntry = finalDestDayData?.meals[destinationMealType]?.[0];
        const finalDestRecipeIds = finalDestEntry ? finalDestEntry.recipes.map(r => r.recipeId) : recipeIdsToMove;


        await updateMealPlanSlotRecipesAction({
          mealPlanId: destinationMealPlanId!,
          mealDate: getStartOfDayUTC(destinationDay), // <<< ПЕРЕДАЄМО Date ОБ'ЄКТ
          mealType: destinationMealType,
          recipeIds: finalDestRecipeIds, // Передаємо рецепти для нового слоту
        });

        router.refresh(); // Оновити дані після успішної дії

      } catch (error) {
        console.error('Failed to move meal plan entry:', error);
        alert('Помилка при переміщенні запису плану харчування. Спробуйте ще раз.');
        router.refresh();
      }
    }
  };

  const activeRecipe = activeDraggableId && initialData.availableRecipes.find(r => r.id === activeDraggableId);
  const activeMealEntry = activeDraggableId && boardState.currentWeekPlan.flatMap(day =>
    Object.values(day.meals).flat()
  ).find(entry => entry.id === activeDraggableId);

  const navigateToWeek = (offset: number) => {
    const currentMonday = new Date(currentWeekStartDate + 'T00:00:00Z'); // Парсимо як UTC
    currentMonday.setDate(currentMonday.getUTCDate() + (offset * 7));
    const newWeekDate = getYYYYMMDD(currentMonday);
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
              onRemoveRecipeFromSlot={async (mealPlanEntryId: string, recipeIdToRemove: string) => {
                // Тут currentMealPlanId ДОСТУПНИЙ через замикання з boardState.currentMealPlanId
                const currentMealPlanId = boardState.currentMealPlanId; // Явно отримуємо його зі стану

                if (!currentMealPlanId) {
                  console.error('Meal Plan ID is not available for removal action.');
                  alert('Не вдалося визначити ID плану харчування. Спробуйте оновити сторінку.');
                  router.refresh();
                  return;
                }

                // Знайти відповідний MealPlanEntry у boardState
                const currentEntry = boardState.currentWeekPlan
                  .flatMap(d => Object.values(d.meals).flat())
                  .find(entry => entry.id === mealPlanEntryId);

                if (!currentEntry) {
                  console.error('MealPlanEntry not found for removal:', mealPlanEntryId);
                  return;
                }

                const updatedRecipeIds = currentEntry.recipes
                  .filter(r => r.recipeId !== recipeIdToRemove)
                  .map(r => r.recipeId);

                // Оптимістичне оновлення UI
                setBoardState(prevState => {
                  const newPlan = prevState.currentWeekPlan.map(day => ({
                    ...day,
                    meals: {
                      ...day.meals,
                      [currentEntry.mealType]: day.meals[currentEntry.mealType].filter(entry => {
                        if (entry.id === mealPlanEntryId) {
                          if (updatedRecipeIds.length === 0) {
                            return false;
                          }
                          entry.recipes = updatedRecipeIds.map(rId => ({
                            recipeId: rId,
                            recipe: prevState.availableRecipes.find(ar => ar.id === rId) || { id: rId, name: 'Невідомий рецепт', instructions: '', ingredients: [], cuisine: '', prepTimeMinutes: 0, cookTimeMinutes: 0 } as Recipe,
                          }));
                        }
                        return true;
                      }),
                    },
                  }));
                  return { ...prevState, currentWeekPlan: newPlan };
                });

                try {
                  if (updatedRecipeIds.length === 0) {
                    await clearMealPlanSlotAction({
                      mealPlanId: currentMealPlanId, // Використовуємо локальну змінну
                      mealDate: getStartOfDayUTC(getYYYYMMDD(currentEntry.mealDate)), // <<< ПЕРЕДАЄМО Date ОБ'ЄКТ
                      mealType: currentEntry.mealType,
                    });
                  } else {
                    await updateMealPlanSlotRecipesAction({
                      mealPlanId: currentMealPlanId, // Використовуємо локальну змінну
                      mealDate: getStartOfDayUTC(getYYYYMMDD(currentEntry.mealDate)), // <<< ПЕРЕДАЄМО Date ОБ'ЄКТ
                      mealType: currentEntry.mealType,
                      recipeIds: updatedRecipeIds,
                    });
                  }
                  router.refresh();
                } catch (error) {
                  console.error('Failed to remove recipe from slot:', error);
                  alert('Помилка при видаленні рецепту зі слоту. Спробуйте ще раз.');
                  router.refresh();
                }
              }}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeDraggableId && activeRecipe ? (
          <RecipeCard recipe={activeRecipe} isDragging style={{ width: '230px' }} />
        ) : activeDraggableId && activeMealEntry ? (
          <DraggableMealEntry entry={activeMealEntry} isDragging style={{ width: '180px' }}
             // onDelete не потрібен для DragOverlay, але якщо потрібен пропс, передайте заглушку
             onDelete={() => { /* Заглушка, оскільки DragOverlay не виконує дії */ }}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default MealPlanBoard;