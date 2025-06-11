// src/app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Імпортуємо наш екземпляр Prisma

// Функція для отримання всіх рецептів
export async function GET(request: NextRequest) {
  try {
    const recipes = await prisma.recipe.findMany(); // Запит до таблиці `Recipe`
    return NextResponse.json(recipes, { status: 200 });
  } catch (error) {
    console.error('Помилка при отриманні рецептів:', error);
    return NextResponse.json({ error: 'Не вдалося отримати рецепти.' }, { status: 500 });
  }
}

// Функція для додавання нового рецепта
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ingredients, instructions, prepTimeMinutes, cookTimeMinutes, servings, imageUrl } = body;

    if (!name || !ingredients || !instructions) {
      return NextResponse.json({ error: 'Відсутні обов\'язкові поля.' }, { status: 400 });
    }

    const newRecipe = await prisma.recipe.create({
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

    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error) {
    console.error('Помилка при додаванні рецепта:', error);
    return NextResponse.json({ error: 'Не вдалося додати рецепт.' }, { status: 500 });
  }
}