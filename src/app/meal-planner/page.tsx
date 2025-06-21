// src/app/meal-planner/page.tsx
import prisma from '@/lib/prisma';
import MealPlanBoard from '@/components/meal-planner/MealPlanBoard';
// Оновіть імпорт, щоб він відображав нову структуру типів
import { MealPlanBoardState, Recipe, MealPlanEntry, MealType, BoardDay, MealPlanEntryRecipe } from '@/types/meal-plan';

// Імпортуємо допоміжні функції з утиліт для консистентності
import { formatDayMonth, getYYYYMMDD, getStartOfWeekUTC } from '@/lib/utils';
import Link from 'next/link'; // <<<< ДОДАНО: Імпорт Link для кнопки

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
      // Парсимо дату як UTC, щоб уникнути проблем з часовим поясом
      const parsedDate = new Date(weekParam + 'T00:00:00Z');
      if (!isNaN(parsedDate.getTime())) {
        baseDateForWeekCalculation = parsedDate;
      }
    } catch (e) {
      console.error("Invalid 'week' search param:", weekParam, e);
    }
  }

  // Отримуємо початок тижня в UTC
  const startOfWeek = getStartOfWeekUTC(baseDateForWeekCalculation);

  const availableRecipes = await prisma.recipe.findMany({
    orderBy: { name: 'asc' },
  });

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

  // Якщо план харчування не знайдено, створюємо новий
  if (!currentMealPlan) {
    currentMealPlan = await prisma.mealPlan.create({
      data: {
        planName: `План на тиждень з ${formatDayMonth(startOfWeek)}`,
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

  const weekDisplay = `${formatDayMonth(startOfWeek)} - ${formatDayMonth(endOfWeek)}`;

  return (
    <main style={{ padding: '20px', display: 'flex', gap: '20px', minHeight: 'calc(100vh - 40px)', flexDirection: 'column' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Планувальник Меню</h1>

      {/* <<<< ДОДАНО: Кнопка "Список покупок" безпосередньо на цій сторінці */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {currentMealPlan.id && ( // Показуємо кнопку, тільки якщо є активний план
          <Link
            href={`/shopping-list?mealPlanId=${currentMealPlan.id}&week=${getYYYYMMDD(startOfWeek)}`}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'background-color 0.3s ease',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1h4a1 1 0 010 2h-1v7a2 2 0 01-2 2H7a2 2 0 01-2-2V6H4a1 1 0 110-2h4V3a1 1 0 011-1zM7 6v7h6V6H7z" clipRule="evenodd" />
            </svg>
            Список покупок на цей тиждень
          </Link>
        )}
      </div>
      {/* Кнопка також є всередині MealPlanBoard для доступу до її динамічного стану */}
      <MealPlanBoard
        initialData={boardData}
        currentWeekStartDate={getYYYYMMDD(startOfWeek)}
        weekDisplay={weekDisplay}
      />
    </main>
  );
}
