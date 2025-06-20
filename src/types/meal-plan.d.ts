// src/types/meal-plan.d.ts

// Типи, що відповідають моделям Prisma (актуальні з урахуванням нової схеми)
export type Recipe = {
  id: string;
  name: string;
  // Додайте інші поля Recipe, які вам потрібні
  instructions: string;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  // ingredients: IngredientOnRecipe[]; // Не включаємо сюди, якщо не потрібно на клієнті
};

export type MealPlan = {
  id: string;
  planName: string;
  weekStartDate: Date;
  // userId: string; // Якщо є автентифікація
  createdAt: Date;
  updatedAt: Date;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// НОВА ПРОМІЖНА ТАБЛИЦЯ ТИПІВ
export type MealPlanEntryRecipe = {
  mealPlanEntryId: string;
  recipeId: string;
  recipe: Recipe; // Включаємо об'єкт рецепту для зручності на клієнті
  // Можливо, інші поля, якщо ви їх додасте (наприклад, quantity_served, notes)
};

// ОНОВЛЕНИЙ MealPlanEntry
export type MealPlanEntry = {
  id: string;
  mealPlanId: string;
  mealDate: Date;
  mealType: MealType;
  createdAt: Date;
  updatedAt: Date;
  // Тепер MealPlanEntry має масив MealPlanEntryRecipe
  recipes: MealPlanEntryRecipe[]; // !!! ЗМІНЕНО ТУТ !!!
};


// Типи для стану дошки планувальника (залишаються майже без змін)
export type BoardDay = {
  date: string; // Формат 'YYYY-MM-DD'
  name: string; // Назва дня тижня, наприклад 'Понеділок' або 'Понеділок\n6 січня'
  meals: {
    breakfast: MealPlanEntry[];
    lunch: MealPlanEntry[];
    dinner: MealPlanEntry[];
    snack: MealPlanEntry[];
  };
};

export type MealPlanBoardState = {
  availableRecipes: Recipe[];
  currentMealPlanId: string | null;
  weekStartDate: string; // 'YYYY-MM-DD'
  currentWeekPlan: BoardDay[];
};