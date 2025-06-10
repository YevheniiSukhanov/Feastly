// src/lib/actions.ts
'use server'; // Ця директива робить весь файл серверним

import { addRecipeToDb, Recipe } from '@/lib/db'; // Імпортуємо нашу імітовану БД
import { revalidatePath } from 'next/cache'; // Для оновлення кешу Next.js
import { redirect } from 'next/navigation'; // Для перенаправлення користувача

interface FormState {
  message: string;
  errors: {
    name?: string[];
    ingredients?: string[];
    instructions?: string[];
    prepTime?: string[];
    servings?: string[];
    _form?: string[]; // Загальні помилки форми
  };
  success?: boolean; // Додаємо поле для успішного статусу
}

// Server Action для додавання рецепта
export async function addRecipeAction(prevState: FormState, formData: FormData): Promise<FormState> {
  console.log('Отримано дані форми на сервері:', formData);

  const name = formData.get('name')?.toString().trim();
  const ingredients = formData.get('ingredients')?.toString().trim();
  const instructions = formData.get('instructions')?.toString().trim();
  const prepTimeString = formData.get('prepTime')?.toString().trim();
  const servingsString = formData.get('servings')?.toString().trim();

  const errors: FormState['errors'] = {};

  // Валідація
  if (!name || name.length < 3) {
    errors.name = ['Назва рецепта має бути не менше 3 символів.'];
  }
  if (!ingredients || ingredients.length < 10) {
    errors.ingredients = ['Інгредієнти мають бути вказані (не менше 10 символів).'];
  }
  if (!instructions || instructions.length < 10) {
    errors.instructions = ['Інструкції мають бути вказані (не менше 10 символів).'];
  }

  let prepTime: number | undefined;
  if (!prepTimeString || isNaN(parseInt(prepTimeString)) || parseInt(prepTimeString) <= 0) {
    errors.prepTime = ['Час приготування має бути додатним числом.'];
  } else {
    prepTime = parseInt(prepTimeString);
  }

  let servings: number | undefined;
  if (!servingsString || isNaN(parseInt(servingsString)) || parseInt(servingsString) <= 0) {
    errors.servings = ['Кількість порцій має бути додатним числом.'];
  } else {
    servings = parseInt(servingsString);
  }

  // Якщо є помилки валідації, повертаємо їх
  if (Object.keys(errors).length > 0) {
    return {
      message: 'Будь ласка, виправте помилки у формі.',
      errors,
      success: false,
    };
  }

  // Якщо валідація пройшла успішно, зберігаємо в БД
  try {
    const newRecipe = await addRecipeToDb({
      name: name!, // '!' tells TypeScript we know these are not undefined due to validation
      ingredients: ingredients!,
      instructions: instructions!,
      prepTime: prepTime!,
      servings: servings!,
    });

    console.log('Рецепт успішно додано:', newRecipe);

    // Оновлюємо кеш, щоб сторінка зі списком рецептів відобразила новий рецепт
    revalidatePath('/recipes'); // Припустимо, у вас є сторінка /recipes
    // redirect('/recipes'); // Можна перенаправити на сторінку списку після додавання

    return {
      message: `Рецепт "${name}" успішно додано!`,
      errors: {},
      success: true, // Вказуємо на успіх
    };
  } catch (error) {
    console.error('Помилка при додаванні рецепта:', error);
    return {
      message: 'Сталася помилка при збереженні рецепта. Спробуйте ще раз.',
      errors: {
        _form: ['Не вдалося додати рецепт через внутрішню помилку.'],
      },
      success: false,
    };
  }
}