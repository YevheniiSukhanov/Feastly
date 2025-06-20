// src/app/page.tsx
import prisma from '@/lib/prisma';
import { getStartOfWeekUTC, getYYYYMMDD, formatDayMonth, formatFullDate } from '@/lib/utils';
import Link from 'next/link';

// Для типів
// Оновіть імпорт, щоб відображати нову структуру типів
import { MealPlanEntry, MealType, Recipe, MealPlanEntryRecipe } from '@/types/meal-plan';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

// Helper function to map meal types to display names (винесено, щоб не дублювати)
const getMealTypeDisplayName = (mealType: MealType): string => {
  switch (mealType) {
    case 'breakfast': return 'Сніданок';
    case 'lunch': return 'Обід';
    case 'dinner': return 'Вечеря';
    case 'snack': return 'Перекус';
    default: return mealType;
  }
};

export default async function DashboardPage() {
  const today = new Date();
  const startOfCurrentWeek = getStartOfWeekUTC(today);

  const currentMealPlan = await prisma.mealPlan.findFirst({
    where: {
      weekStartDate: startOfCurrentWeek,
      // userId: 'current_user_id', // TODO: Розкоментувати для автентифікації
    },
    include: {
      MealPlanEntry: {
        include: {
          recipes: { // !!! ЗМІНЕНО ТУТ: Включаємо проміжну таблицю
            include: {
              recipe: true, // Включаємо сам об'єкт рецепту
            },
          },
        },
        orderBy: {
            mealDate: 'asc',
        }
      },
    },
  });

  let totalMealsPlanned = 0;
  // upcomingMeals тепер буде масивом об'єктів, які містять MealPlanEntry та пов'язані з ним Recipe
  // щоб було зручно відображати кілька рецептів для одного слоту
  type UpcomingMealItem = {
    mealEntry: MealPlanEntry;
    recipe: Recipe;
  };
  let upcomingMeals: UpcomingMealItem[] = [];

  // Дані для чартів
  const mealTypeCounts: { [key in MealType]?: number } = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
  };
  const mealsPerDayRaw: { [date: string]: number } = {};

  const todayYYYYMMDD = getYYYYMMDD(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowYYYYMMDD = getYYYYMMDD(tomorrow);

  if (currentMealPlan) {
    // totalMealsPlanned тепер буде сумою ВСІХ рецептів у плані, а не кількістю MealPlanEntry
    totalMealsPlanned = currentMealPlan.MealPlanEntry.reduce((acc, entry) => acc + entry.recipes.length, 0);

    currentMealPlan.MealPlanEntry.forEach(entry => {
        const entryDateStr = getYYYYMMDD(entry.mealDate);

        // Перебираємо ВСІ рецепти в кожному MealPlanEntry
        entry.recipes.forEach(entryRecipe => {
          // Для чарту типів прийомів їжі
          mealTypeCounts[entry.mealType] = (mealTypeCounts[entry.mealType] || 0) + 1;

          // Для чарту страв по днях
          mealsPerDayRaw[entryDateStr] = (mealsPerDayRaw[entryDateStr] || 0) + 1;

          // Фільтруємо майбутні прийоми їжі (сьогодні та завтра)
          if (entryDateYYYYMMDD === todayYYYYMMDD || entryDateYYYYMMDD === tomorrowYYYYMMDD) {
              upcomingMeals.push({
                mealEntry: entry,
                recipe: entryRecipe.recipe // Зверніть увагу: recipe знаходиться всередині entryRecipe
              });
          }
        });
    });

    // Сортуємо майбутні прийоми їжі
    upcomingMeals.sort((a, b) => {
        // Спочатку за датою
        const dateComparison = a.mealEntry.mealDate.getTime() - b.mealEntry.mealDate.getTime();
        if (dateComparison !== 0) return dateComparison;

        // Потім за типом прийому їжі (якщо потрібно специфічне сортування: сніданок, обід, вечеря, перекус)
        const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
        return mealTypeOrder.indexOf(a.mealEntry.mealType) - mealTypeOrder.indexOf(b.mealEntry.mealType);
    })
    .slice(0, 5); // Обмежуємо 5-ма найближчими
  }

  // Перетворюємо mealsPerDayRaw у формат, зручний для Recharts (масив об'єктів з датою та лічильником)
  const mealsPerDayChartData = [];
  const currentWeekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfCurrentWeek);
    day.setUTCDate(startOfCurrentWeek.getUTCDate() + i);
    const dayStr = getYYYYMMDD(day);
    currentWeekDays.push(dayStr);
  }

  currentWeekDays.forEach(dayStr => {
    mealsPerDayChartData.push({
      date: dayStr,
      count: mealsPerDayRaw[dayStr] || 0
    });
  });


  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-10 text-cyan-900 text-center">Ваш Персональний Дашборд</h1>

      {/* Grid Layout для секцій */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Огляд поточного тижня */}
        <section className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Огляд Тижня</h2>
          {currentMealPlan ? (
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                На тиждень, що починається <span className="font-bold text-blue-600">{formatFullDate(currentMealPlan.weekStartDate)}</span>,
                ви запланували <span className="font-bold text-blue-600 text-3xl">{totalMealsPlanned}</span> прийомів їжі.
              </p>
              <div className="flex justify-center mt-6">
                <Link href="/meal-planner" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
                  Перейти до Планувальника
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                На цей тиждень (починається {formatFullDate(startOfCurrentWeek)}) ще немає створеного плану харчування.
              </p>
              <div className="flex justify-center mt-6">
                <Link href="/meal-planner" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
                  Створити план на тиждень
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Найближчі прийоми їжі */}
        <section className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Наступні прийоми їжі</h2>
          {upcomingMeals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">День</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Тип Прийому</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Рецепт</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Тепер ітеруємо по upcomingMeals, який містить як MealPlanEntry, так і Recipe */}
                  {upcomingMeals.map((item, index) => (
                    <tr key={`${item.mealEntry.id}-${item.recipe.id}-${index}`} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">
                        {getYYYYMMDD(item.mealEntry.mealDate) === todayYYYYMMDD ? 'Сьогодні' : 'Завтра'}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${item.mealEntry.mealType === 'breakfast' ? 'bg-yellow-100 text-yellow-800' :
                            item.mealEntry.mealType === 'lunch' ? 'bg-green-100 text-green-800' :
                            item.mealEntry.mealType === 'dinner' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'}`
                        }>
                          {getMealTypeDisplayName(item.mealEntry.mealType)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {/* Доступ до назви рецепту через item.recipe.name */}
                        {item.recipe.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-700">На найближчі дні немає запланованих прийомів їжі.</p>
          )}
        </section>
      </div>

      {/* Швидкі посилання та останні рецепти */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Розділ швидких посилань */}
        <section className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Швидкі посилання</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/recipes" className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center font-medium text-blue-700 transition duration-200 shadow-sm hover:shadow-md">
              <span className="text-xl mr-2">🍽️</span> Переглянути всі Рецепти
            </Link>
            <Link href="/recipes/new" className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center font-medium text-green-700 transition duration-200 shadow-sm hover:shadow-md">
              <span className="text-xl mr-2">➕</span> Додати новий Рецепт
            </Link>
            {/* TODO: Додати посилання на Список Покупок, якщо буде реалізовано */}
          </div>
        </section>

        {/* Розділ "Останні рецепти" (Заглушка) */}
        <section className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Останні рецепти</h2>
          <p className="text-gray-700 leading-relaxed">
            Цей розділ буде відображати ваші останні додані або переглянуті рецепти. Для повноцінної реалізації потрібно буде додати логіку отримання останніх рецептів з бази даних або збереження їх у профілі користувача.
          </p>
        </section>
      </div>

      {/* Розділ з чартами (винесено в окремий клієнтський компонент) */}
      <DashboardCharts
        mealTypeCounts={mealTypeCounts}
        mealsPerDay={mealsPerDayChartData}
      />
    </div>
  );
}