// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // Зверніть увагу, що 'redirect' все ще імпортується звідси
import prisma from '@/lib/prisma';

// --------------------------- ВИПРАВЛЕНА ЛОГІКА ----------------------------------
// Функція для перевірки, чи є помилка помилкою перенаправлення Next.js
function isNextRedirectError(error: any): boolean {
  // Next.js додає спеціальний digest для помилок перенаправлення.
  // Він має вигляд `${REDIRECT_ERROR_CODE};${type};${url};${statusCode};`
  // де REDIRECT_ERROR_CODE = 'NEXT_REDIRECT'
  return typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT');
}
// -------------------------------------------------------------------------------


export async function addRecipeAction(formData: FormData) {
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
    redirect('/recipes'); // Цей виклик викидає помилку з digest 'NEXT_REDIRECT'

  } catch (error) {
    // Використовуємо нашу нову функцію для перевірки
    if (isNextRedirectError(error)) {
      // Якщо це помилка перенаправлення, просто "прокидаємо" її далі.
      // Next.js її перехопить і виконає перенаправлення.
      throw error;
    }

    // Якщо це справжня помилка, обробляємо її
    console.error('Помилка в Server Action при додаванні рецепта:', error);
    throw new Error('Не вдалося додати рецепт. Спробуйте ще раз.');
  }
}
