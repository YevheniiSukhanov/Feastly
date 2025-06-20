// src/app/meal-planner/page.tsx
import prisma from '@/lib/prisma';
import MealPlanBoard from '@/components/meal-planner/MealPlanBoard';
// Оновіть імпорт, щоб він відображав нову структуру типів
import { MealPlanBoardState, Recipe, MealPlanEntry, MealType, BoardDay, MealPlanEntryRecipe } from '@/types/meal-plan';

// Допоміжна функція для форматування дати у "день місяць" (наприклад, "6 січня")
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(date);
}

// Допоміжна функція для отримання рядка дати в форматі "YYYY-MM-DD"
// ВАЖЛИВО: Це дозволяє порівнювати дати без впливу часового поясу
function getYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Допоміжна функція для отримання дати початку тижня (понеділок) у UTC
function getStartOfWeekUTC(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = неділя (UTC), 1 = понеділок (UTC) ...
  const diff = day === 0 ? 6 : day - 1; // Кількість днів назад до понеділка
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0); // Обнуляємо час і переводимо в UTC
  return d;
}


interface MealPlannerPageProps {
  searchParams?: {
    week?: string; // Очікуємо дату початку тижня у форматі "YYYY-MM-DD"
  };
}

export default async function MealPlannerPage({ searchParams }: MealPlannerPageProps) {
  let baseDateForWeekCalculation = new Date();

  const weekParam = searchParams?.week;
  if (weekParam) {
    try {
      const parsedDate = new Date(weekParam + 'T00:00:00Z'); // Парсимо як UTC
      if (!isNaN(parsedDate.getTime())) {
        baseDateForWeekCalculation = parsedDate;
      }
    } catch (e) {
      console.error("Invalid 'week' search param:", weekParam, e);
    }
  }

  const availableRecipes = await prisma.recipe.findMany({
    orderBy: { name: 'asc' },
  });

  const startOfWeek = getStartOfWeekUTC(baseDateForWeekCalculation);

  let currentMealPlan = await prisma.mealPlan.findFirst({
    where: {
      weekStartDate: startOfWeek,
      // userId: 'current_user_id', // Якщо ви використовуєте автентифікацію
    },
    include: {
      MealPlanEntry: {
        include: {
          recipes: { // Включаємо проміжну таблицю
            include: {
              recipe: true, // Включаємо сам об'єкт рецепту
            },
          },
        },
      },
    },
  });

  if (!currentMealPlan) {
    currentMealPlan = await prisma.mealPlan.create({
      data: {
        planName: `План на тиждень з ${formatDate(startOfWeek)}`,
        weekStartDate: startOfWeek,
        // userId: 'current_user_id',
      },
      include: {
        MealPlanEntry: {
          include: {
            recipes: { // Включаємо проміжну таблицю
              include: {
                recipe: true, // Включаємо сам об'єкт рецепту
              },
            },
          },
        },
      },
    });
  }

  const daysOfWeekNames = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'];

  const boardData: MealPlanBoardState = {
    availableRecipes: availableRecipes,
    currentMealPlanId: currentMealPlan.id,
    weekStartDate: getYYYYMMDD(startOfWeek),
    currentWeekPlan: daysOfWeekNames.map((dayName, index) => {
      const date = new Date(startOfWeek);
      date.setUTCDate(startOfWeek.getUTCDate() + index); // Використовуємо setUTCDate для UTC
      const dateString = getYYYYMMDD(date);

      const entriesForDay: MealPlanEntry[] = currentMealPlan!.MealPlanEntry.filter(
        (entry) => getYYYYMMDD(entry.mealDate) === dateString
      ) as MealPlanEntry[];

      return {
        date: dateString,
        name: dayName,
        meals: {
          breakfast: entriesForDay.filter(entry => entry.mealType === 'breakfast'),
          lunch: entriesForDay.filter(entry => entry.mealType === 'lunch'),
          dinner: entriesForDay.filter(entry => entry.mealType === 'dinner'),
          snack: entriesForDay.filter(entry => entry.mealType === 'snack'),
        },
      };
    }),
  };

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6); // Використовуємо setUTCDate для UTC

  const weekDisplay = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

  return (
    <main style={{ padding: '20px', display: 'flex', gap: '20px', minHeight: 'calc(100vh - 40px)', flexDirection: 'column' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Планувальник Меню</h1>
      <MealPlanBoard
        initialData={boardData}
        currentWeekStartDate={getYYYYMMDD(startOfWeek)}
        weekDisplay={weekDisplay}
      />
    </main>
  );
}