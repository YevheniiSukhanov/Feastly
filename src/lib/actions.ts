    // src/lib/actions.ts
    'use server';

    import { revalidatePath } from 'next/cache';
    import { redirect } from 'next/navigation';
    import prisma from '@/lib/prisma';
    import { MealType } from '@prisma/client'; // Імпортуємо MealType з Prisma, якщо це enum

    // Імпорти для утиліт часу та конвертації
    // Змінено: convertToBaseUnit тепер приймає лише назву одиниці, а не об'єкт UnitData
    import { getYYYYMMDD, getStartOfDayUTC, getStartOfWeekUTC } from './utils'; // getStartOfWeekUTCUTC був в actions.ts, але getStartOfWeekUTC в utils.ts
    import { convertToBaseUnit, CONVERSION_FACTORS_TO_BASE, getUnitCategory } from './unit-conversions';

    // --- Функція для перевірки, чи є помилка помилкою перенаправлення Next.js ---
    function isNextRedirectError(error: any): boolean {
    return typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT');
    }

    // --- Інтерфейси для аргументів Server Actions ---

    interface ClearMealPlanSlotProps {
    mealPlanId: string;
    mealDate: Date; // Очікує Date об'єкт (UTC початок дня)
    mealType: MealType;
    }

    // Цей інтерфейс, MealPlanUpdateRecipeData, здається, не використовується.
    // Якщо він потрібен, його також треба оновити відповідно до схеми.
    // interface MealPlanUpdateRecipeData {
    //   mealPlanId: string;
    //   mealDate: string; // "YYYY-MM-DD"
    //   mealType: MealType;
    //   recipeIds: string[]; // Масив ID рецептів для цього слоту
    // }

    interface UpdateMealPlanSlotRecipesProps {
    mealPlanId: string;
    mealDate: Date; // Очікує Date об'єкт (UTC початок дня)
    mealType: MealType;
    recipeIds: string[];
    }

    interface CreateMealPlanProps {
    userId?: string;
    planName: string;
    weekStartDate: Date; // Очікує Date об'єкт (UTC початок тижня)
    }

    // --- Інтерфейси для елементів списку покупок ---
    interface ShoppingListItem {
    name: string;
    quantity: number; // Кількість буде вже у базових одиницях (мл. або г.)
    unit: string;     // Одиниця буде базовою ('мл.', 'г.', 'шт.')
    }

    // --- ОНОВЛЕНІ Інтерфейси для даних, що отримуються з Prisma (відповідно до schema.prisma та include) ---
    // Ці інтерфейси допомагають TypeScript краще розуміти структуру даних,
    // що повертаються з запитів Prisma з `include`.

    // Видалено інтерфейс UnitData, оскільки немає моделі Unit у Prisma.

    interface IngredientData {
    id: string;
    name: string;
    description: string | null;
    unit: string; // Це тепер рядок з schema.prisma
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    // defaultUnitId та defaultUnit видалено, оскільки моделі Unit немає
    }

    interface IngredientOnRecipeData {
    ingredientId: string;
    recipeId: string;
    quantity: number;
    unit: string; // Це тепер рядок з schema.prisma
    ingredient: IngredientData; // Включений об'єкт Ingredient
    // Поле 'unit' тут не UnitData, а просто string
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
    ingredients: IngredientOnRecipeData[]; // Тепер це IngredientOnRecipeData[]
    }

    interface MealPlanEntryData {
    id: string;
    mealPlanId: string;
    mealDate: Date;
    mealType: MealType;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    recipes: { // Це MealPlanEntryRecipe[]
        id: string;
        mealPlanEntryId: string;
        recipeId: string;
        createdAt: Date;
        updatedAt: Date;
        recipe: RecipeData; // Включений об'єкт Recipe
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
        await prisma.recipe.delete({
        where: { id: id },
        });

        revalidatePath('/recipes');
        redirect('/recipes');

    } catch (error) {
        if (isNextRedirectError(error)) {
        throw error;
        }
        console.error('Помилка в Server Action при видаленні рецепта:', error);
        throw new Error('Не вдалося видалити рецепт. Спробуйте ще раз.');
    }
    }

    /**
     * Оновлює або створює MealPlanEntry та пов'язані з ним рецепти.
     */
    export async function updateMealPlanSlotRecipesAction({ mealPlanId, mealDate, mealType, recipeIds }: UpdateMealPlanSlotRecipesProps) {
    try {
        // Гарантуємо, що mealDate є Date об'єктом, що представляє початок дня в UTC
        const mealDateObj = getStartOfDayUTC(mealDate);

        // ЗНАЙТИ АБО СТВОРИТИ MealPlanEntry (слот)
        const mealPlanEntry = await prisma.mealPlanEntry.upsert({
        where: {
            mealPlanId_mealDate_mealType: {
            mealPlanId: mealPlanId,
            mealDate: mealDateObj,
            mealType: mealType,
            },
        },
        update: {}, // Нічого не оновлюємо на самому entry, якщо він існує
        create: {
            mealPlanId: mealPlanId,
            mealDate: mealDateObj,
            mealType: mealType,
        },
        });

        // ВИДАЛИТИ ВСІ ПОТОЧНІ ЗВ'ЯЗКИ RECIPE-ENTRY ДЛЯ ЦЬОГО СЛОТУ
        await prisma.mealPlanEntryRecipe.deleteMany({
        where: { mealPlanEntryId: mealPlanEntry.id },
        });

        // ДОДАТИ НОВІ ЗВ'ЯЗКИ RECIPE-ENTRY, ЯКЩО ВОНИ Є
        if (recipeIds && recipeIds.length > 0) {
        const newRecipeConnections = recipeIds.map(rId => ({
            mealPlanEntryId: mealPlanEntry.id,
            recipeId: rId,
        }));

        await prisma.mealPlanEntryRecipe.createMany({
            data: newRecipeConnections,
            skipDuplicates: true, // Запобігає помилкам, якщо раптом є дублікати в input
        });
        }

        revalidatePath('/meal-planner');
        return { success: true, message: 'Рецепти оновлено успішно.' };

    } catch (error) {
        if (isNextRedirectError(error)) throw error; // Пропускаємо помилки перенаправлення
        console.error('Помилка при оновленні рецептів слоту планування:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to update meal plan slot recipes: ${error.message}`);
        }
        throw new Error('Failed to update meal plan slot recipes.');
    }
    }

    /**
     * Очищує слот планування, видаляючи всі пов'язані рецепти та сам MealPlanEntry.
     */
    export async function clearMealPlanSlotAction({ mealPlanId, mealDate, mealType }: ClearMealPlanSlotProps) {
    try {
        // Гарантуємо, що mealDate є Date об'єктом, що представляє початок дня в UTC
        const mealDateObj = getStartOfDayUTC(mealDate);

        // Спочатку знайдіть MealPlanEntry, щоб отримати його ID
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

        // Видаліть всі пов'язані MealPlanEntryRecipe записи спочатку
        await prisma.mealPlanEntryRecipe.deleteMany({
        where: {
            mealPlanEntryId: mealPlanEntryToDelete.id,
        },
        });

        // Тепер видаліть сам MealPlanEntry
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
     * Створює новий план харчування, якщо він не існує для вказаного тижня.
     * Повертає ID існуючого або нового плану.
     */
    export async function createMealPlanIfNotExistsAction({ userId, planName, weekStartDate }: CreateMealPlanProps): Promise<string> {
    try {
        // Гарантуємо, що weekStartDate є об'єктом Date, що представляє початок тижня в UTC
        const startOfWeekUTC = getStartOfWeekUTC(weekStartDate); // Використовуємо getStartOfWeekUTC з utils

        let mealPlan = await prisma.mealPlan.findUnique({
        where: {
            // Припускаючи, що у вас є @unique([userId, weekStartDate]) у моделі MealPlan
            userId_weekStartDate: {
            userId: userId || '', // Використовуйте порожній рядок, якщо userId може бути null/undefined
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
     * Генерує список покупок для заданого плану харчування на певний тиждень.
     * Агрегує інгредієнти та конвертує одиниці до базових мір (літри або кілограми).
     */
    export async function getShoppingListForWeek(mealPlanId: string, weekStartDate: Date): Promise<ShoppingListItem[]> {
    try {
        // 1. Визначаємо діапазон тижня (7 днів від weekStartDate)
        const endDate = new Date(weekStartDate);
        endDate.setUTCDate(endDate.getUTCDate() + 6); // Включає 6-й день
        endDate.setUTCHours(23, 59, 59, 999); // До кінця дня

        // 2. Отримуємо всі MealPlanEntry для вказаного mealPlanId та діапазону тижня
        // Оновлено: Прибрано include: { unit: true } з IngredientOnRecipe
        const mealEntries: MealPlanEntryData[] = await prisma.mealPlanEntry.findMany({
        where: {
            mealPlanId: mealPlanId,
            mealDate: {
            gte: weekStartDate, // Початок тижня (вже UTC)
            lte: endDate,       // Кінець тижня (вже UTC)
            },
        },
        include: {
            recipes: { // Це MealPlanEntryRecipe[]
            include: {
                recipe: {
                include: {
                    // Включаємо IngredientOnRecipe з вкладеним Ingredient
                    // Оновлено: 'unit' тепер є строковим полем, тому не включаємо як окремий об'єкт
                    ingredients: { // Це IngredientOnRecipe[]
                    include: {
                        ingredient: true, // Фактичний об'єкт Ingredient
                        // unit: true, // ВИДАЛЕНО: більше не включаємо об'єкт Unit
                    },
                    },
                },
                },
            },
            },
        },
        });

        // 3. Готуємо всі інгредієнти для обробки
        const allIngredientsForProcessing: {
            name: string;
            quantity: number;
            unit: string; // Тепер це рядок з назвою одиниці
            // ingredientData: IngredientData; // Наразі не використовується, можна видалити для простоти
        }[] = [];

        mealEntries.forEach(entry => {
        entry.recipes.forEach(mealEntryRecipe => {
            if (mealEntryRecipe.recipe && mealEntryRecipe.recipe.ingredients) {
            mealEntryRecipe.recipe.ingredients.forEach(ingredientOnRecipe => {
                // Оновлено: 'unit' тепер є безпосередньо рядком на 'ingredientOnRecipe'
                if (ingredientOnRecipe.ingredient && ingredientOnRecipe.unit) { // 'unit' це string
                    allIngredientsForProcessing.push({
                        name: ingredientOnRecipe.ingredient.name, // Назва інгредієнта
                        quantity: ingredientOnRecipe.quantity,   // Кількість з RecipeIngredient
                        unit: ingredientOnRecipe.unit,           // Одиниця виміру (рядок, наприклад 'г.', 'мл.')
                    });
                } else {
                    console.warn(`Missing ingredient data or unit string for IngredientOnRecipe ID: ${ingredientOnRecipe.ingredientId || 'N/A'} in recipe ${mealEntryRecipe.recipe.name}`);
                }
            });
            }
        });
        });

        // Мапа для агрегованих кількостей у базових одиницях (наприклад, 'мука-г', 'молоко-мл')
        const aggregatedQuantities: { [key: string]: { name: string; quantity: number; unit: string; category: 'volume' | 'weight' | 'count' } } = {};

        // 4. Конвертуємо та агрегуємо інгредієнти
        allIngredientsForProcessing.forEach(item => {
        // Отримуємо категорію одиниці (наприклад, 'volume', 'weight', 'count')
        const category = getUnitCategory(item.unit); // Оновлено: використовуємо item.unit (рядок)

        if (!category) {
            console.warn(`Could not determine category for unit: ${item.unit}`);
            return; // Пропускаємо, якщо категорія одиниці невідома
        }

        // Конвертуємо кількість до базової одиниці її категорії (мл. або г.)
        // Оновлено: convertToBaseUnit тепер приймає лише quantity та unitName (рядок)
        const convertedResult = convertToBaseUnit(item.quantity, item.unit);
        const quantityInBaseUnit = convertedResult.value;

        // Створюємо унікальний ключ для агрегації (назва інгредієнта + категорія)
        const aggregationKey = `${item.name}-${category}`;

        if (aggregatedQuantities[aggregationKey]) {
            aggregatedQuantities[aggregationKey].quantity += quantityInBaseUnit;
        } else {
            aggregatedQuantities[aggregationKey] = {
            name: item.name,
            quantity: quantityInBaseUnit,
            unit: convertedResult.unit, // Одиниця, повернута convertToBaseUnit ('мл.', 'г.', 'шт.')
            category: category,
            };
        }
        });

        // 5. Форматуємо агрегований список для відображення
        const finalShoppingList: ShoppingListItem[] = Object.values(aggregatedQuantities).map(item => {
        return {
            name: item.name,
            quantity: item.quantity, // Кількість у внутрішній базовій одиниці (мл. або г.)
            unit: item.unit, // Назва внутрішньої базової одиниці ('мл.', 'г.', 'шт.')
        };
        });

        revalidatePath('/shopping-list'); // Ревалідуємо сторінку списку покупок
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