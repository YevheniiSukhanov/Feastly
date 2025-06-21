// src/lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { MealType } from '@prisma/client'; // Імпортуємо MealType з Prisma, якщо це enum

// Імпорти для утиліт часу та конвертації
import { getYYYYMMDD, getStartOfDayUTC, getStartOfWeekUTC } from './utils';
import { convertToBaseUnit, CONVERSION_FACTORS_TO_BASE, getUnitCategory } from './unit-conversions';

// Helper function to check if an error is a Next.js redirect error
function isNextRedirectError(error: any): boolean {
  return typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT');
}

// --- Interfaces for Server Action arguments ---

interface ClearMealPlanSlotProps {
  mealPlanId: string;
  mealDate: Date; // Expects a Date object (UTC start of day)
  mealType: MealType;
}

interface UpdateMealPlanSlotRecipesProps {
  mealPlanId: string;
  mealDate: Date; // Expects a Date object (UTC start of day)
  mealType: MealType;
  recipeIds: string[];
}

interface CreateMealPlanProps {
  userId?: string;
  planName: string;
  weekStartDate: Date; // Expects a Date object (UTC start of week)
}

// --- Interfaces for shopping list items ---
interface ShoppingListItem {
  name: string;
  quantity: number; // Quantity will be in base units (ml or g)
  unit: string;     // Unit will be base ('мл.', 'г.', 'шт.')
}

// --- Updated Interfaces for data retrieved from Prisma (according to schema.prisma and include) ---
interface IngredientData {
  id: string;
  name: string;
  description: string | null;
  unit: string; // This is now a string from schema.prisma
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface IngredientOnRecipeData {
  ingredientId: string;
  recipeId: string;
  quantity: number;
  unit: string; // This is now a string from schema.prisma
  ingredient: IngredientData; // Included Ingredient object
}

interface RecipeData {
  id: string;
  name: string;
  instructions: string;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  ingredients: IngredientOnRecipeData[]; // Now IngredientOnRecipeData[]
}

interface MealPlanEntryData {
  id: string;
  mealPlanId: string;
  mealDate: Date;
  mealType: MealType;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  recipes: { // This is MealPlanEntryRecipe[]
    id: string;
    mealPlanEntryId: string;
    recipeId: string;
    createdAt: Date;
    updatedAt: Date;
    recipe: RecipeData; // Included Recipe object
  }[];
}


// --- Server Actions ---

export async function addRecipeAction(formData: FormData) {
  const name = formData.get('name') as string;
  const instructions = formData.get('instructions') as string;
  const prepTimeMinutes = formData.get('prepTimeMinutes') ? parseInt(formData.get('prepTimeMinutes') as string) : null;
  const cookTimeMinutes = formData.get('cookTimeMinutes') ? parseInt(formData.get('cookTimeMinutes') as string) : null;
  const servings = formData.get('servings') ? parseInt(formData.get('servings') as string) : null;
  const imageUrl = formData.get('imageUrl') as string;

  if (!name || !instructions) {
    throw new Error('Відсутні обов\'язкові поля: назва, інструкції.');
  }

  try {
    await prisma.recipe.create({
      data: {
        name,
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

export async function updateRecipeAction(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const instructions = formData.get('instructions') as string;
  const prepTimeMinutes = formData.get('prepTimeMinutes') ? parseInt(formData.get('prepTimeMinutes') as string) : null;
  const cookTimeMinutes = formData.get('cookTimeMinutes') ? parseInt(formData.get('cookTimeMinutes') as string) : null;
  const servings = formData.get('servings') ? parseInt(formData.get('servings') as string) : null;
  const imageUrl = formData.get('imageUrl') as string;

  if (!name || !instructions) {
    throw new Error('Відсутні обов\'язкові поля: назва, інструкції.');
  }

  try {
    await prisma.recipe.update({
      where: { id: id },
      data: {
        name,
        instructions,
        prepTimeMinutes,
        cookTimeMinutes,
        servings,
        imageUrl,
      },
    });

    revalidatePath(`/recipes/${id}`);
    revalidatePath('/recipes');

    redirect(`/recipes/${id}`);

  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Помилка в Server Action при оновленні рецепта:', error);
    throw new Error('Не вдалося оновити рецепт. Спробуйте ще раз.');
  }
}

export async function deleteRecipeAction(id: string) {
  try {
    await prisma.$transaction(async (prisma) => {
      // 1. Delete all related MealPlanEntryRecipe entries
      await prisma.mealPlanEntryRecipe.deleteMany({
        where: {
          recipeId: id,
        },
      });

      // 2. Then delete all related IngredientOnRecipe entries
      await prisma.ingredientOnRecipe.deleteMany({
        where: {
          recipeId: id,
        },
      });

      // 3. Finally, delete the recipe itself
      const deletedRecipe = await prisma.recipe.delete({
        where: { id },
      });

      if (!deletedRecipe) {
        throw new Error('Рецепт для видалення не знайдено під час транзакції.');
      }
    });

    revalidatePath('/recipes');
    redirect('/recipes'); // Redirect after successful deletion and revalidation

  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('Помилка в Server Action при видаленні рецепта:', error);
    throw new Error('Не вдалося видалити рецепт. Спробуйте ще раз.');
  }
}

/**
 * Updates or creates a MealPlanEntry and its associated recipes.
 */
export async function updateMealPlanSlotRecipesAction({ mealPlanId, mealDate, mealType, recipeIds }: UpdateMealPlanSlotRecipesProps) {
  try {
    // Ensure mealDate is a Date object representing the start of the day in UTC
    const mealDateObj = getStartOfDayUTC(mealDate);

    // If no recipe IDs are provided, clear the slot
    if (!recipeIds || recipeIds.length === 0) { // <<<< ДОДАНО: Перевірка на порожній масив recipeIds
      return await clearMealPlanSlotAction({ mealPlanId, mealDate: mealDateObj, mealType }); // <<<< ВИКЛИК clearMealPlanSlotAction
    }

    // FIND OR CREATE MealPlanEntry (slot)
    const mealPlanEntry = await prisma.mealPlanEntry.upsert({
      where: {
        mealPlanId_mealDate_mealType: {
          mealPlanId: mealPlanId,
          mealDate: mealDateObj,
          mealType: mealType,
        },
      },
      update: {}, // No updates on the entry itself if it exists
      create: {
        mealPlanId: mealPlanId,
        mealDate: mealDateObj,
        mealType: mealType,
      },
    });

    // DELETE ALL CURRENT RECIPE-ENTRY RELATIONS FOR THIS SLOT
    await prisma.mealPlanEntryRecipe.deleteMany({
      where: { mealPlanEntryId: mealPlanEntry.id },
    });

    // ADD NEW RECIPE-ENTRY RELATIONS
    const newRecipeConnections = recipeIds.map(rId => ({
      mealPlanEntryId: mealPlanEntry.id,
      recipeId: rId,
    }));

    await prisma.mealPlanEntryRecipe.createMany({
      data: newRecipeConnections,
      skipDuplicates: true,
    });

    revalidatePath('/meal-planner');
    return { success: true, message: 'Рецепти оновлено успішно.' };

  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error('Помилка при оновленні рецептів слоту планування:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to update meal plan slot recipes: ${error.message}`);
    }
    throw new Error('Failed to update meal plan slot recipes.');
  }
}

/**
 * Clears a meal plan slot, deleting all associated recipes and the MealPlanEntry itself.
 */
export async function clearMealPlanSlotAction({ mealPlanId, mealDate, mealType }: ClearMealPlanSlotProps) {
  try {
    // Ensure mealDate is a Date object representing the start of the day in UTC
    const mealDateObj = getStartOfDayUTC(mealDate);

    // Find the MealPlanEntry first to get its ID
    const mealPlanEntryToDelete = await prisma.mealPlanEntry.findUnique({
      where: {
        mealPlanId_mealDate_mealType: {
          mealPlanId: mealPlanId,
          mealDate: mealDateObj,
          mealType: mealType,
        },
      },
    });

    if (!mealPlanEntryToDelete) {
      console.warn('Attempted to clear a non-existent meal plan slot.');
      revalidatePath('/meal-planner');
      return { success: true, message: 'Слот планування вже порожній.' };
    }

    // Delete all associated MealPlanEntryRecipe records first
    await prisma.mealPlanEntryRecipe.deleteMany({
      where: {
        mealPlanEntryId: mealPlanEntryToDelete.id,
      },
    });

    // Now delete the MealPlanEntry itself
    await prisma.mealPlanEntry.delete({
      where: {
        id: mealPlanEntryToDelete.id,
      },
    });

    revalidatePath('/meal-planner');
    return { success: true, message: 'Слот планування успішно очищено.' };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error('Помилка при очищенні слоту планування:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to clear meal plan slot: ${error.message}`);
    }
    throw new Error('Failed to clear meal plan slot.');
  }
}

/**
 * Creates a new meal plan if it doesn't exist for the specified week.
 * Returns the ID of the existing or new plan.
 */
export async function createMealPlanIfNotExistsAction({ userId, planName, weekStartDate }: CreateMealPlanProps): Promise<string> {
  try {
    // Ensure weekStartDate is a Date object representing the start of the week in UTC
    const startOfWeekUTC = getStartOfWeek(weekStartDate); // Use getStartOfWeek from utils

    let mealPlan = await prisma.mealPlan.findUnique({
      where: {
        // Assuming you have @unique([userId, weekStartDate]) in MealPlan model
        userId_weekStartDate: {
          userId: userId || '', // Use empty string if userId can be null/undefined
          weekStartDate: startOfWeekUTC,
        },
      },
    });

    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: {
          userId: userId,
          planName: planName,
          weekStartDate: startOfWeekUTC,
        },
      });
      revalidatePath('/meal-planner');
    }
    return mealPlan.id;
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error('Помилка при створенні/пошуку плану харчування:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to ensure meal plan exists: ${error.message}`);
    }
    throw new Error('Failed to ensure meal plan exists.');
  }
}


/**
 * Generates a shopping list for a given meal plan for a specific week.
 * Aggregates ingredients and converts units to base measures (liters or kilograms).
 */
export async function getShoppingListForWeek(mealPlanId: string, weekStartDate: Date): Promise<ShoppingListItem[]> {
  try {
    // 1. Define the week range (7 days from weekStartDate)
    const endDate = new Date(weekStartDate);
    endDate.setUTCDate(endDate.getUTCDate() + 6); // Includes the 6th day
    endDate.setUTCHours(23, 59, 59, 999); // To the end of the day

    // 2. Fetch all MealPlanEntry for the specified mealPlanId and week range
    const mealEntries: MealPlanEntryData[] = await prisma.mealPlanEntry.findMany({
      where: {
        mealPlanId: mealPlanId,
        mealDate: {
          gte: weekStartDate, // Start of the week (already UTC)
          lte: endDate,       // End of the week (already UTC)
        },
      },
      include: {
        recipes: { // This is MealPlanEntryRecipe[]
          include: {
            recipe: {
              include: {
                // Include IngredientOnRecipe with nested Ingredient
                ingredients: { // This is IngredientOnRecipe[]
                  include: {
                    ingredient: true, // Actual Ingredient data
                  },
                },
              },
            },
          },
        },
      },
    });

    // 3. Prepare all ingredients for processing
    const allIngredientsForProcessing: {
        name: string;
        quantity: number;
        unit: string; // Now a string with the unit name
    }[] = [];

    mealEntries.forEach(entry => {
      entry.recipes.forEach(mealEntryRecipe => {
        if (mealEntryRecipe.recipe && mealEntryRecipe.recipe.ingredients) {
          mealEntryRecipe.recipe.ingredients.forEach(ingredientOnRecipe => {
            // 'unit' is now directly a string on 'ingredientOnRecipe'
            if (ingredientOnRecipe.ingredient && ingredientOnRecipe.unit) { // 'unit' is a string
                allIngredientsForProcessing.push({
                    name: ingredientOnRecipe.ingredient.name, // Ingredient name
                    quantity: ingredientOnRecipe.quantity,   // Quantity from RecipeIngredient
                    unit: ingredientOnRecipe.unit,           // Unit (string, e.g., 'г.', 'мл.')
                });
            } else {
                console.warn(`Missing ingredient data or unit string for IngredientOnRecipe ID: ${ingredientOnRecipe.ingredientId || 'N/A'} in recipe ${mealEntryRecipe.recipe.name}`);
            }
          });
        }
      });
    });

    // Map to hold aggregated quantities in base units (e.g., 'flour-g', 'milk-ml')
    const aggregatedQuantities: { [key: string]: { name: string; quantity: number; unit: string; category: 'volume' | 'weight' | 'count' } } = {};

    // 4. Convert and aggregate ingredients
    allIngredientsForProcessing.forEach(item => {
      // Get the unit category (e.g., 'volume', 'weight', 'count')
      const category = getUnitCategory(item.unit); // Use item.unit (string)

      if (!category) {
        console.warn(`Could not determine category for unit: ${item.unit}`);
        return; // Skip if unit category is unknown
      }

      // Convert quantity to the base unit of its category (ml or g)
      // convertToBaseUnit now only takes quantity and unitName (string)
      const convertedResult = convertToBaseUnit(item.quantity, item.unit);
      const quantityInBaseUnit = convertedResult.value;

      // Create a unique key for aggregation (ingredient name + category)
      const aggregationKey = `${item.name}-${category}`;

      if (aggregatedQuantities[aggregationKey]) {
        aggregatedQuantities[aggregationKey].quantity += quantityInBaseUnit;
      } else {
        aggregatedQuantities[aggregationKey] = {
          name: item.name,
          quantity: quantityInBaseUnit,
          unit: convertedResult.unit, // Unit returned by convertToBaseUnit ('мл.', 'г.', 'шт.')
          category: category,
        };
      }
    });

    // 5. Format the aggregated list for display
    const finalShoppingList: ShoppingListItem[] = Object.values(aggregatedQuantities).map(item => {
      return {
        name: item.name,
        quantity: item.quantity, // Quantity in the internal base unit (ml or g)
        unit: item.unit, // Name of the internal base unit ('мл.', 'г.', 'шт.')
      };
    });

    revalidatePath('/shopping-list'); // Revalidate the shopping list page
    return finalShoppingList;

  } catch (error) {
    console.error('Помилка при генерації списку покупок:', error);
    if (isNextRedirectError(error)) throw error;
    if (error instanceof Error) {
      throw new Error(`Failed to generate shopping list: ${error.message}`);
    }
    throw new Error('Failed to generate shopping list.');
  }
}
