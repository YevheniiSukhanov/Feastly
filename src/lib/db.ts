// src/lib/db.ts
// У реальному проекті тут буде ініціалізація вашої БД (наприклад, Prisma Client)
// та реальні функції для взаємодії з нею.

// Визначення інтерфейсу для рецепта
export interface Recipe {
    id: string;
    name: string;
    ingredients: string; // Можна зробити масивом об'єктів { name: string, quantity: string } у реальному проекті
    instructions: string;
    prepTime: number; // Час приготування в хвилинах
    servings: number; // Кількість порцій
    createdAt: Date;
  }
  
  // "Імітація" бази даних у пам'яті сервера
  let recipes: Recipe[] = [];
  
  export async function addRecipeToDb(recipeData: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    // Імітація затримки мережі / БД
    await new Promise(resolve => setTimeout(resolve, 500));
  
    const newRecipe: Recipe = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Простий унікальний ID
      createdAt: new Date(),
      ...recipeData,
    };
    recipes.push(newRecipe);
    console.log('Додано новий рецепт до імітованої БД:', newRecipe);
    return newRecipe;
  }
  
  export async function getRecipesFromDb(): Promise<Recipe[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...recipes]; // Повертаємо копію, щоб уникнути прямих змін
  }
  
  // У реальному проєкті тут були б також функції для update, delete, getById тощо.