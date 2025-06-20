// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { MealType } from '@/types/meal-plan'; // Імпортуємо MealType
import { getStartOfDayUTC, getYYYYMMDD } from './utils'; // Імпортуйте getStartOfDayUTC

// Функція для перевірки, чи є помилка помилкою перенаправлення Next.js
function isNextRedirectError(error: any): boolean {
  return typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT');
}

// Оновлення типу для ClearMealPlanSlotProps: mealDate тепер має бути Date
interface ClearMealPlanSlotProps {
  mealPlanId: string;
  mealDate: Date; // Змінено на Date
  mealType: MealType;
}

export async function addRecipeAction(formData: FormData) {
  // ... (існуючий код addRecipeAction)
  const name = formData.get('name') as string;
  const ingredients = formData.get('ingredients') as string;
  const instructions = formData.get('instructions') as string;
  const prepTimeMinutes = formData.get('prepTimeMinutes') ? parseInt(formData.get('prepTimeMinutes') as string) : null;
  const cookTimeMinutes = formData.get('cookTimeMinutes') ? parseInt(formData.get('cookTimeMinutes') as string) : null;
  const servings = formData.get('servings') ? parseInt(formData.get('servings') as string) : null;
  const imageUrl = formData.get('imageUrl') as string;

  if (!name || !ingredients || !instructions) {
    throw new Error('Відсутні обов\'язкові поля: назва, інгредієнти, інструкції.');
  }

  try {
    await prisma.recipe.create({
      data: {
        name,
        ingredients,
        instructions,
        prepTimeMinutes,
        cookTimeMinutes,
        servings,
        imageUrl,
      },
    });

    revalidatePath('/recipes');
    redirect('/recipes');

  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Помилка в Server Action при додаванні рецепта:', error);
    throw new Error('Не вдалося додати рецепт. Спробуйте ще раз.');
  }
}

// --------------------------- НОВА ФУНКЦІЯ: updateRecipeAction ---------------------------
export async function updateRecipeAction(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const ingredients = formData.get('ingredients') as string;
  const instructions = formData.get('instructions') as string;
  const prepTimeMinutes = formData.get('prepTimeMinutes') ? parseInt(formData.get('prepTimeMinutes') as string) : null;
  const cookTimeMinutes = formData.get('cookTimeMinutes') ? parseInt(formData.get('cookTimeMinutes') as string) : null;
  const servings = formData.get('servings') ? parseInt(formData.get('servings') as string) : null;
  const imageUrl = formData.get('imageUrl') as string;

  if (!name || !ingredients || !instructions) {
    throw new Error('Відсутні обов\'язкові поля: назва, інгредієнти, інструкції.');
  }

  try {
    await prisma.recipe.update({
      where: { id: id }, // Використовуємо id для пошуку рецепту
      data: {
        name,
        ingredients,
        instructions,
        prepTimeMinutes,
        cookTimeMinutes,
        servings,
        imageUrl,
      },
    });

    // Після оновлення рецепта, ревалідуємо шлях до сторінки деталей рецепту
    // та сторінки списку рецептів, щоб оновити кеш.
    revalidatePath(`/recipes/${id}`);
    revalidatePath('/recipes'); // Щоб оновити список

    redirect(`/recipes/${id}`); // Перенаправляємо на сторінку деталей після оновлення

  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Помилка в Server Action при оновленні рецепта:', error);
    throw new Error('Не вдалося оновити рецепт. Спробуйте ще раз.');
  }
}

// --------------------------- НОВА ФУНКЦІЯ: deleteRecipeAction ---------------------------
export async function deleteRecipeAction(id: string) {
  try {
    await prisma.recipe.delete({
      where: { id: id },
    });

    // Після видалення рецепта, ревалідуємо кеш сторінки списку рецептів
    revalidatePath('/recipes');
    // Перенаправляємо користувача на сторінку списку рецептів
    redirect('/recipes');

  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Помилка в Server Action при видаленні рецепта:', error);
    // Залежно від вашої стратегії обробки помилок, ви можете
    // або викинути помилку, або повернути об'єкт з помилкою.
    // Для простоти, поки що викидаємо помилку.
    throw new Error('Не вдалося видалити рецепт. Спробуйте ще раз.');
  }
}

// --------------------------- НОВІ ФУНКЦІЇ ДЛЯ MEAL PLAN (реструктуризація) ---------------------------

interface MealPlanUpdateRecipeData {
  mealPlanId: string;
  mealDate: string; // YYYY-MM-DD
  mealType: MealType;
  recipeIds: string[]; // Масив ID рецептів для цього слоту
}

/**
 * Видаляє всі рецепти з конкретного слоту планування (фактично видаляє MealPlanEntry)
 */
export async function clearMealPlanSlotAction({ mealPlanId, mealDate, mealType }: ClearMealPlanSlotProps) {
  try {
    // Prisma очікує Date об'єкт для DateTime поля
    // Переконайтеся, що mealDate вже є коректним Date об'єктом, що представляє початок дня UTC
    // АБО, якщо ви все ще передаєте рядок, конвертуйте його тут:
    // const mealDateObj = getStartOfDayUTC(mealDate); // Якщо mealDate є string YYYY-MM-DD

    await prisma.mealPlanEntry.delete({
      where: {
        mealPlanId_mealDate_mealType: {
          mealPlanId: mealPlanId,
          mealDate: mealDate, // Використовуємо mealDate напряму, оскільки тепер він Date
          mealType: mealType,
        },
      },
    });

    revalidatePath('/meal-planner');
    return { success: true };
  } catch (error) {
    console.error('Error clearing meal plan slot:', error);
    // Важливо: перевіряйте тип помилки, щоб не видавати чутливу інформацію
    if (error instanceof Error) {
        throw new Error(`Failed to clear meal plan slot: ${error.message}`);
    }
    throw new Error('Failed to clear meal plan slot.');
  }
}

// ... updateMealPlanSlotRecipesAction, createMealPlanIfNotExistsAction також повинні приймати Date для mealDate
// Наприклад, для updateMealPlanSlotRecipesAction:
interface UpdateMealPlanSlotRecipesProps {
  mealPlanId: string;
  mealDate: Date; // Змінено на Date
  mealType: MealType;
  recipeIds: string[];
}

export async function updateMealPlanSlotRecipesAction({ mealPlanId, mealDate, mealType, recipeIds }: UpdateMealPlanSlotRecipesProps) {
  try {
    // ... логіка
    // Використовуємо mealDate напряму для записів Prisma
    const mealPlanEntry = await prisma.mealPlanEntry.upsert({
      where: {
        mealPlanId_mealDate_mealType: {
          mealPlanId: mealPlanId,
          mealDate: mealDate, // Передаємо Date об'єкт
          mealType: mealType,
        },
      },
      // ... create і update частини
      update: {
        recipes: {
          deleteMany: {}, // Видалити всі існуючі, щоб перезаписати
          create: recipeIds.map(recipeId => ({
            recipeId: recipeId,
            // mealPlanEntryId: ..., // Це поле може бути автоматично встановлено Prisma при create
          })),
        },
      },
      create: {
        mealPlan: { connect: { id: mealPlanId } },
        mealDate: mealDate, // Передаємо Date об'єкт
        mealType: mealType,
        recipes: {
          create: recipeIds.map(recipeId => ({
            recipeId: recipeId,
          })),
        },
      },
      include: {
        recipes: true,
      },
    });

    revalidatePath('/meal-planner');
    return mealPlanEntry;
  } catch (error) {
    console.error('Error updating meal plan slot recipes:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to update meal plan slot recipes: ${error.message}`);
    }
    throw new Error('Failed to update meal plan slot recipes.');
  }
}