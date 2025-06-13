// src/types/meal-plan.d.ts

// Типи, що відповідають моделям Prisma
// (Можливо, ви вже імпортуєте їх з Prisma Client, але для чіткості визначимо тут)
export type Recipe = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  cookingTimeMinutes: number | null;
  servings: number | null;
  calories: number | null;
  createdAt: Date;
  updatedAt: Date;
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

export type MealPlanEntry = {
  id: string;
  mealPlanId: string;
  recipeId: string | null; // Nullable, якщо запис може бути без рецепту (наприклад, "вихідний")
  recipe: Recipe | null; // Включаємо об'єкт рецепту для зручності на клієнті
  mealDate: Date;
  mealType: MealType;
  createdAt: Date;
  updatedAt: Date;
};


// Типи для стану дошки планувальника
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