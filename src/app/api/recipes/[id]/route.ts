// src/app/api/recipes/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to handle 404 responses
const notFoundResponse = (message: string) =>
  NextResponse.json({ message }, { status: 404 });

// Helper function to handle 500 responses
const errorResponse = (error: any, defaultMessage: string) => {
  console.error(defaultMessage, error);
  // Optional: More specific error handling for Prisma errors
  if (error.code === 'P2002') { // Unique constraint violation (e.g., trying to set a recipe name that already exists)
    return NextResponse.json({ message: 'Рецепт з такою назвою вже існує.' }, { status: 409 });
  }
  return NextResponse.json({ message: error.message || defaultMessage }, { status: 500 });
};

// ===============================================
// GET /api/recipes/[id] - Отримати один рецепт за ID
// ===============================================
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: { // Включаємо проміжну таблицю IngredientOnRecipe
          include: {
            ingredient: true, // Включаємо деталі самого інгредієнта
          },
        },
      },
    });

    if (!recipe) {
      return notFoundResponse('Рецепт не знайдено.');
    }
    return NextResponse.json(recipe, { status: 200 });
  } catch (error) {
    return errorResponse(error, `Не вдалося отримати рецепт з ID ${id}.`);
  }
}

// ===============================================
// PUT /api/recipes/[id] - Оновити існуючий рецепт за ID
// ===============================================
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  // Попередження Next.js про params.id:
  // Це попередження (Error: Route "/api/recipes/[id]" used `params.id`. `params` should be awaited...)
  // є особливостями нового App Router в Next.js 14+.
  // Воно часто зникає або стає менш помітним після виправлення інших помилок.
  // Сама деструктуризація `const { id } = params;` є коректною.
  // Зазвичай не потрібно "await params" тут.
  // Зосередимося на TypeError, оскільки це блокуюча помилка виконання.
  const { id } = params; 
  try {
    const body = await req.json();
    const { name, instructions, prepTimeMinutes, cookTimeMinutes, servings, imageUrl, ingredients } = body;

    // --- ПОПЕРЕДНІЙ КОД ---
    // imageUrl: imageUrl.trim() === '' ? null : imageUrl.trim(),
    // --- НОВИЙ ВИПРАВЛЕНИЙ КОД ---
    // Перевіряємо, чи imageUrl є рядком, і якщо так, то чи він не порожній після trim.
    // Якщо imageUrl null, або не рядок, або порожній рядок після trim, то зберігаємо null.
    const processedImageUrl = (typeof imageUrl === 'string' && imageUrl.trim() !== '') 
                              ? imageUrl.trim() 
                              : null;

    // Перевірка існування рецепту (залишається без змін)
    const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
    if (!existingRecipe) {
      return notFoundResponse('Рецепт для оновлення не знайдено.');
    }

    // Перетворюємо масив ingredients (залишається без змін)
    const ingredientsToConnectOrCreate = ingredients.map(
      (ing: { ingredientId: string, quantity: number, unit: string }) => ({
        quantity: ing.quantity,
        unit: ing.unit,
        ingredient: {
          connect: {
            id: ing.ingredientId,
          },
        },
      })
    );

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: {
        name: name.trim(),
        instructions: instructions.trim(),
        prepTimeMinutes: prepTimeMinutes === '' ? null : Number(prepTimeMinutes),
        cookTimeMinutes: cookTimeMinutes === '' ? null : Number(cookTimeMinutes),
        servings: servings === '' ? null : Number(servings),
        
        // Використовуємо оброблене значення processedImageUrl
        imageUrl: processedImageUrl, 
        
        ingredients: {
          deleteMany: {},
          create: ingredientsToConnectOrCreate,
        },
      },
    });

    return NextResponse.json(updatedRecipe, { status: 200 });
  } catch (error) {
    return errorResponse(error, `Не вдалося оновити рецепт з ID ${id}.`);
  }
}

// ===============================================
// DELETE /api/recipes/[id] - Видалити рецепт за ID
// ===============================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        // Спочатку видаляємо всі пов'язані записи у проміжній таблиці IngredientOnRecipe
        await prisma.ingredientOnRecipe.deleteMany({
            where: {
                recipeId: id,
            },
        });

        // Потім видаляємо сам рецепт
        const deletedRecipe = await prisma.recipe.delete({
            where: { id },
        });

        if (!deletedRecipe) {
            return notFoundResponse('Рецепт для видалення не знайдено.');
        }
        return NextResponse.json({ message: 'Рецепт успішно видалено.' }, { status: 200 });
    } catch (error) {
        return errorResponse(error, `Не вдалося видалити рецепт з ID ${id}.`);
    }
}