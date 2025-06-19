// src/app/meal-planner/page.tsx
import prisma from '@/lib/prisma';
import MealPlanBoard from '@/components/meal-planner/MealPlanBoard';
import { MealPlanBoardState, Recipe, MealPlanEntry, MealType, BoardDay } from '@/types/meal-plan';
import { notFound } from 'next/navigation';

// Допоміжна функція для отримання дати початку тижня (понеділок)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date); // Створюємо копію, щоб не змінювати оригінальний об'єкт
  const day = d.getDay(); // 0 = неділя, 1 = понеділок ... 6 = субота
  const diff = day === 0 ? 6 : day - 1; // Кількість днів назад до понеділка
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0); // Обнуляємо час для консистентності (локальний час)
  return d;
}

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
  let baseDateForWeekCalculation = new Date(); // Початкова дата за замовчуванням - поточний день

  // Виправлення 1: Більш безпечний доступ до searchParams
  const weekParam = searchParams?.week;
  if (weekParam) {
    try {
      const parsedDate = new Date(weekParam);
      // Перевіряємо, чи дата коректна (не Invalid Date)
      if (!isNaN(parsedDate.getTime())) {
        baseDateForWeekCalculation = parsedDate;
      }
    } catch (e) {
      console.error("Invalid 'week' search param:", weekParam, e);
      // Якщо параметр недійсний, продовжуємо з поточною датою
    }
  }

  // Завантажуємо всі доступні рецепти
  const availableRecipes = await prisma.recipe.findMany({
    orderBy: { name: 'asc' },
  });

  const startOfWeek = getStartOfWeekUTC(baseDateForWeekCalculation); // ВИКОРИСТОВУЄМО UTC ФУНКЦІЮ


  // Шукаємо або створюємо план харчування для цього тижня
  let currentMealPlan = await prisma.mealPlan.findFirst({
    where: {
      weekStartDate: startOfWeek, // Тепер шукаємо за UTC датою
      // userId: 'current_user_id',
    },
    include: {
      MealPlanEntry: {
        include: {
          recipe: true,
        },
      },
    },
  });

  // Якщо план на цей тиждень не знайдено, створюємо новий
  if (!currentMealPlan) {
    currentMealPlan = await prisma.mealPlan.create({
      data: {
        planName: `План на тиждень з ${formatDate(startOfWeek)}`,
        weekStartDate: startOfWeek, // Зберігаємо UTC дату
        // userId: 'current_user_id',
      },
      include: {
        MealPlanEntry: { include: { recipe: true } },
      },
    });
  }

  // console.log('Current Meal Plan from DB:', JSON.stringify(currentMealPlan, null, 2));

  // Готуємо дані для канбан-дошки
  const daysOfWeekNames = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'];
  
  const boardData: MealPlanBoardState = {
    availableRecipes: availableRecipes,
    currentMealPlanId: currentMealPlan.id,
    weekStartDate: getYYYYMMDD(startOfWeek), // Для відображення все одно YYYY-MM-DD
    currentWeekPlan: daysOfWeekNames.map((dayName, index) => {
      const date = new Date(startOfWeek); // Базуємось на UTC даті початку тижня
      date.setDate(startOfWeek.getDate() + index); // Тут все одно додаємо дні
      const dateString = getYYYYMMDD(date);

      // Виправлення 4: Використовуємо getYYYYMMDD для фільтрації записів за датою
      const entriesForDay: MealPlanEntry[] = currentMealPlan!.MealPlanEntry.filter(
        // Порівнюємо дати записів (які з БД приходять як UTC) з нашими UTC-базованими датами
        (entry) => getYYYYMMDD(entry.mealDate) === dateString
      ) as MealPlanEntry[];

      // ДОДАЙТЕ ЦІ ЛОГИ:
      // if (entriesForDay.length > 0) {
      //   console.log(`Entries for <span class="math-inline">\{dayName\} \(</span>{dateString}):`, JSON.stringify(entriesForDay, null, 2));
      //   entriesForDay.forEach(entry => {
      //     if (!entry.recipe) {
      //       console.warn(`Entry ${entry.id} for ${dayName} has no recipe! recipeId: ${entry.recipeId}`);
      //     } else {
      //       console.log(`  - Recipe found: ${entry.recipe.name}`);
      //     }
      //   });
      // }

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

  // console.log('Final boardData sent to client:', JSON.stringify(boardData, null, 2));

  // Обчислюємо дату закінчення тижня для відображення у заголовку
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekDisplay = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;

  return (
    <main style={{ padding: '20px', display: 'flex', gap: '20px', minHeight: 'calc(100vh - 40px)', flexDirection: 'column' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Планувальник Меню</h1>
      <MealPlanBoard
        initialData={boardData}
        currentWeekStartDate={getYYYYMMDD(startOfWeek)} // Передаємо у форматі YYYY-MM-DD
        weekDisplay={weekDisplay}
      />
    </main>
  );
}