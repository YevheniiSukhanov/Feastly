// src/app/api/ingredients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const ALLOWED_UNITS = ['шт.', 'г.', 'мл.'];

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(ingredients, { status: 200 });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json({ message: 'Failed to fetch ingredients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, unit, imageUrl } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Name is required and must be a non-empty string.' }, { status: 400 });
    }
    if (!unit || typeof unit !== 'string' || !ALLOWED_UNITS.includes(unit)) {
      return NextResponse.json({ message: `Unit is required and must be one of: ${ALLOWED_UNITS.join(', ')}.` }, { status: 400 });
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json({ message: 'Description must be a string.' }, { status: 400 });
    }
    if (imageUrl && typeof imageUrl !== 'string') {
      return NextResponse.json({ message: 'Image URL must be a string.' }, { status: 400 });
    }

    const newIngredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        description: description || null,
        unit,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(newIngredient, { status: 201 });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ message: 'Ingredient with this name already exists.' }, { status: 409 });
      }
    }
    console.error('Error creating ingredient:', error);
    return NextResponse.json({ message: 'Failed to create ingredient', error: (error as Error).message }, { status: 500 });
  }
}