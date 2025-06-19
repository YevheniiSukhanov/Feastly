// src/app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Імпортуємо наш екземпляр Prisma

// Функція для отримання всіх рецептів
export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        // Включаємо проміжну таблицю IngredientOnRecipe
        ingredients: {
          // І всередині неї включаємо фактичний об'єкт Ingredient,
          // щоб отримати його ім'я та інші деталі
          include: {
            ingredient: true, // Це дозволить нам отримати ingredient.name, ingredient.unit тощо.
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Сортування за датою створення, щоб новіші були зверху
      },
    });
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ message: 'Failed to fetch recipes.' }, { status: 500 });
  }
}

// Функція для додавання нового рецепта
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Деструктуризуємо ingredients окремо, бо його формат буде змінено
    const { name, instructions, prepTimeMinutes, cookTimeMinutes, servings, imageUrl, ingredients } = body;

    // Перетворення масиву ingredients з клієнта у формат, очікуваний Prisma для вкладеного створення
    const ingredientsToCreate = ingredients.map((ing: { ingredientId: string, quantity: number, unit: string }) => ({
      quantity: ing.quantity,
      unit: ing.unit,
      // Вказуємо Prisma підключити існуючий інгредієнт за його ID
      ingredient: {
        connect: {
          id: ing.ingredientId,
        },
      },
    }));

    const newRecipe = await prisma.recipe.create({
      data: {
        name,
        instructions,
        // Перетворюємо порожні рядки в null для числових полів, якщо вони optional в схемі
        prepTimeMinutes: prepTimeMinutes === '' ? null : Number(prepTimeMinutes),
        cookTimeMinutes: cookTimeMinutes === '' ? null : Number(cookTimeMinutes),
        servings: servings === '' ? null : Number(servings),
        imageUrl: imageUrl === '' ? null : imageUrl, // imageUrl може бути порожнім рядком, тому перетворюємо на null
        
        // Передаємо перетворений масив інгредієнтів у властивості `create`
        ingredients: {
          create: ingredientsToCreate,
        },
      },
    });

    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error: any) {
    console.error('Error creating recipe:', error);
    // Детальніше обробка помилок Prisma
    if (error.code === 'P2002') { // Prisma error code for unique constraint violation
      return NextResponse.json({ message: 'Рецепт з такою назвою вже існує.' }, { status: 409 });
    }
    // Для інших помилок валідації Prisma або загальних помилок
    return NextResponse.json({ message: error.message || 'Не вдалося створити рецепт. Невідома помилка.' }, { status: 500 });
  }
}