// src/app/api/ingredients/[id]/route.ts
// Цей файл реалізує API-маршрути для взаємодії з ОДНИМ інгредієнтом за його ID.
// Використовує новий стандарт Next.js App Router для API Routes.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Імпорт вашого Prisma Client
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; // Для обробки специфічних помилок Prisma

// Дозволені одиниці вимірювання.
// Краще винести цю константу в окремий shared-файл, щоб уникнути дублювання та забезпечити єдність.
const ALLOWED_UNITS = ['шт.', 'г.', 'мл.'];

// Інтерфейс для отримання динамічних параметрів маршруту (наприклад, [id])
interface Context {
  params: { id: string }; // 'id' буде відповідати назві папки '[id]'
}

/**
 * GET /api/ingredients/[id]
 * Отримує деталі одного інгредієнта за його унікальним ID.
 * @param req - Об'єкт запиту NextRequest (не використовується напряму, але потрібен для сигнатури)
 * @param context - Контекст, що містить динамічні параметри маршруту (params.id)
 * @returns NextResponse з даними інгредієнта або повідомленням про помилку.
 */
export async function GET(req: NextRequest, context: Context) {
  const { id } = context.params; // Витягуємо ID інгредієнта з параметрів маршруту

  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id }, // Пошук інгредієнта за ID
    });

    if (!ingredient) {
      // Якщо інгредієнт не знайдено, повертаємо 404 Not Found
      return NextResponse.json({ message: 'Ingredient not found.' }, { status: 404 });
    }

    // Повертаємо знайдений інгредієнт з успішним статусом 200 OK
    return NextResponse.json(ingredient, { status: 200 });
  } catch (error) {
    // Логуємо помилку для налагодження
    console.error(`Error fetching ingredient with ID ${id}:`, error);
    // Повертаємо 500 Internal Server Error у випадку непередбаченої помилки
    return NextResponse.json({ message: 'Failed to fetch ingredient' }, { status: 500 });
  }
}

/**
 * PUT /api/ingredients/[id]
 * Оновлює існуючий інгредієнт за його ID.
 * Часткове оновлення (PATCH) також може бути реалізовано тут, оскільки ми перевіряємо на undefined.
 * @param req - Об'єкт запиту NextRequest, що містить тіло запиту (оновлені дані).
 * @param context - Контекст, що містить динамічні параметри маршруту (params.id).
 * @returns NextResponse з оновленими даними інгредієнта або повідомленням про помилку.
 */
export async function PUT(req: NextRequest, context: Context) {
  const { id } = context.params; // Витягуємо ID інгредієнта для оновлення

  try {
    const body = await req.json(); // Отримуємо тіло запиту (JSON-дані)
    const { name, description, unit, imageUrl } = body;

    // Валідація вхідних даних: перевіряємо лише ті поля, які були надані в запиті
    // Якщо поле присутнє, воно має відповідати правилам валідації.
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ message: 'Name must be a non-empty string if provided.' }, { status: 400 });
      }
    }
    if (unit !== undefined) {
      if (typeof unit !== 'string' || !ALLOWED_UNITS.includes(unit)) {
        return NextResponse.json({ message: `Unit must be one of: ${ALLOWED_UNITS.join(', ')} if provided.` }, { status: 400 });
      }
    }
    // Додаткові перевірки для optional полів, які можуть бути null
    if (description !== undefined && typeof description !== 'string' && description !== null) {
      return NextResponse.json({ message: 'Description must be a string or null.' }, { status: 400 });
    }
    if (imageUrl !== undefined && typeof imageUrl !== 'string' && imageUrl !== null) {
      return NextResponse.json({ message: 'Image URL must be a string or null.' }, { status: 400 });
    }

    // Об'єкт 'data' буде містити лише ті поля, які були передані в запиті (не undefined)
    const updatedIngredient = await prisma.ingredient.update({
      where: { id }, // Визначаємо, який запис оновлювати за ID
      data: {
        name: name !== undefined ? name.trim() : undefined, // Якщо name є, обрізаємо пробіли
        description: description !== undefined ? description : undefined, // Якщо description є, оновлюємо
        unit: unit !== undefined ? unit : undefined, // Якщо unit є, оновлюємо
        imageUrl: imageUrl !== undefined ? imageUrl : undefined, // Якщо imageUrl є, оновлюємо
        // Prisma автоматично оновить поле 'updatedAt'
      },
    });

    // Повертаємо оновлений інгредієнт з успішним статусом 200 OK
    return NextResponse.json(updatedIngredient, { status: 200 });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Код помилки Prisma: Record to update not found
        // Якщо інгредієнт не знайдено для оновлення, повертаємо 404
        return NextResponse.json({ message: 'Ingredient not found.' }, { status: 404 });
      }
      if (error.code === 'P2002') { // Код помилки Prisma: Unique constraint violation
        // Якщо спроба оновити назву на вже існуючу унікальну назву
        return NextResponse.json({ message: 'Ingredient with this name already exists.' }, { status: 409 }); // 409 Conflict
      }
    }
    // Логуємо та повертаємо загальну помилку сервера
    console.error(`Error updating ingredient with ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to update ingredient', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * DELETE /api/ingredients/[id]
 * Видаляє інгредієнт за його ID.
 * @param req - Об'єкт запиту NextRequest (не використовується напряму)
 * @param context - Контекст, що містить динамічні параметри маршруту (params.id).
 * @returns NextResponse з повідомленням про успіх або помилку.
 */
export async function DELETE(req: NextRequest, context: Context) {
  const { id } = context.params; // Витягуємо ID інгредієнта для видалення

  try {
    await prisma.ingredient.delete({
      where: { id }, // Видалення інгредієнта за ID
    });
    // Повертаємо успішний статус 200 OK з підтверджуючим повідомленням
    return NextResponse.json({ message: 'Ingredient deleted successfully.' }, { status: 200 });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // Код помилки Prisma: Record to delete not found
        // Якщо інгредієнт не знайдено для видалення
        return NextResponse.json({ message: 'Ingredient not found.' }, { status: 404 });
      }
      if (error.code === 'P2003') { // Код помилки Prisma: Foreign key constraint failed
        // Ця помилка виникне, якщо інгредієнт використовується в таблиці `IngredientOnRecipe`
        return NextResponse.json(
          { message: 'Cannot delete ingredient because it is currently used in one or more recipes. Please remove it from recipes first.' },
          { status: 409 } // 409 Conflict
        );
      }
    }
    // Логуємо та повертаємо загальну помилку сервера
    console.error(`Error deleting ingredient with ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete ingredient', error: (error as Error).message }, { status: 500 });
  }
}