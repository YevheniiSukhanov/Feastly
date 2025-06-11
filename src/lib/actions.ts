// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

// Функція для перевірки, чи є помилка помилкою перенаправлення Next.js
function isNextRedirectError(error: any): boolean {
  return typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT');
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