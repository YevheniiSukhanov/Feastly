import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Дозволені одиниці вимірювання (повторюємо для безпеки, але можна винести в константу глобально)
const ALLOWED_UNITS = ['шт.', 'г.', 'мл.'];

interface Context {
  params: { id: string };
}

// GET /api/ingredients/[id] - Отримати один інгредієнт за ID
export async function GET(req: NextRequest, context: Context) {
  const { id } = context.params;

  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) {
      return NextResponse.json({ message: 'Ingredient not found.' }, { status: 404 });
    }

    return NextResponse.json(ingredient, { status: 200 });
  } catch (error) {
    console.error(`Error fetching ingredient with ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch ingredient' }, { status: 500 });
  }
}

// PUT /api/ingredients/[id] - Оновити інгредієнт за ID
export async function PUT(req: NextRequest, context: Context) {
  const { id } = context.params;

  try {
    const body = await req.json();
    const { name, description, unit, imageUrl } = body;

    // Валідація вхідних даних (лише якщо вони присутні)
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ message: 'Name must be a non-empty string if provided.' }, { status: 400 });
    }
    if (unit !== undefined && (typeof unit !== 'string' || !ALLOWED_UNITS.includes(unit))) {
      return NextResponse.json({ message: `Unit must be one of: ${ALLOWED_UNITS.join(', ')} if provided.` }, { status: 400 });
    }
    if (description !== undefined && typeof description !== 'string' && description !== null) {
      return NextResponse.json({ message: 'Description must be a string or null.' }, { status: 400 });
    }
    if (imageUrl !== undefined && typeof imageUrl !== 'string' && imageUrl !== null) {
      return NextResponse.json({ message: 'Image URL must be a string or null.' }, { status: 400 });
    }

    const updatedIngredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description : undefined,
        unit: unit !== undefined ? unit : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        // Prisma автоматично оновить updatedAt
      },
    });

    return NextResponse.json(updatedIngredient, { status: 200 });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // P2025 - Record to update not found
        return NextResponse.json({ message: 'Ingredient not found.' }, { status: 404 });
      }
      if (error.code === 'P2002') { // P2002 - Unique constraint violation (якщо оновлена назва вже існує)
        return NextResponse.json({ message: 'Ingredient with this name already exists.' }, { status: 409 });
      }
    }
    console.error(`Error updating ingredient with ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to update ingredient', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/ingredients/[id] - Видалити інгредієнт за ID
export async function DELETE(req: NextRequest, context: Context) {
  const { id } = context.params;

  try {
    await prisma.ingredient.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Ingredient deleted successfully.' }, { status: 200 }); // 204 No Content також підходить, але 200 з повідомленням більш інформативний
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { // P2025 - Record to delete not found
        return NextResponse.json({ message: 'Ingredient not found.' }, { status: 404 });
      }
      // P2003 - Foreign key constraint failed (якщо інгредієнт використовується в рецепті)
      if (error.code === 'P2003') {
        return NextResponse.json({ message: 'Cannot delete ingredient because it is currently used in one or more recipes. Please remove it from recipes first.' }, { status: 409 });
      }
    }
    console.error(`Error deleting ingredient with ID ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete ingredient', error: (error as Error).message }, { status: 500 });
  }
}