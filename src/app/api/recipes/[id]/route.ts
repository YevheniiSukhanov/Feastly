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
  if (error.code === 'P2002') { // Unique constraint violation
    return NextResponse.json({ message: 'Рецепт з такою назвою вже існує.' }, { status: 409 });
  }
  // Додаємо перевірку на помилки посилання на неіснуючі зовнішні ключі (P2003)
  if (error.code === 'P2003') {
    return NextResponse.json({ message: 'Обмеження зовнішнього ключа порушено. Можливо, елемент пов\'язаний з іншими записами.' }, { status: 400 });
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
  const { id } = params;
  try {
    const body = await req.json();
    const { name, instructions, prepTimeMinutes, cookTimeMinutes, servings, imageUrl } = body;

    const processedImageUrl = (typeof imageUrl === 'string' && imageUrl.trim() !== '')
                              ? imageUrl.trim()
                              : null;

    // Перевірка існування рецепту
    const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
    if (!existingRecipe) {
      return notFoundResponse('Рецепт для оновлення не знайдено.');
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: {
        name: name.trim(),
        instructions: instructions.trim(),
        prepTimeMinutes: prepTimeMinutes === '' ? null : Number(prepTimeMinutes),
        cookTimeMinutes: cookTimeMinutes === '' ? null : Number(cookTimeMinutes),
        servings: servings === '' ? null : Number(servings),
        imageUrl: processedImageUrl,
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
        // Використовуємо транзакцію для забезпечення атомарності операцій видалення
        await prisma.$transaction(async (prisma) => {
            // 1. Спочатку видаляємо всі пов'язані записи у проміжній таблиці MealPlanEntryRecipe
            await prisma.mealPlanEntryRecipe.deleteMany({
                where: {
                    recipeId: id,
                },
            });

            // 2. Потім видаляємо всі пов'язані записи у проміжній таблиці IngredientOnRecipe
            await prisma.ingredientOnRecipe.deleteMany({
                where: {
                    recipeId: id,
                },
            });

            // 3. Нарешті, видаляємо сам рецепт
            const deletedRecipe = await prisma.recipe.delete({
                where: { id },
            });

            if (!deletedRecipe) {
                // Це не повинно трапитися після успішного видалення, але для повноти
                throw new Error('Рецепт для видалення не знайдено під час транзакції.');
            }
        });

        return NextResponse.json({ message: 'Рецепт успішно видалено.' }, { status: 200 });
    } catch (error) {
        return errorResponse(error, `Не вдалося видалити рецепт з ID ${id}.`);
    }
}
