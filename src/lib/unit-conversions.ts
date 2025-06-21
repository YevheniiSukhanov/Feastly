// src/lib/unit-conversions.ts

// Базові одиниці для кожної категорії, до яких ми будемо конвертувати для внутрішніх розрахунків
export const BASE_VOLUME_UNIT = 'мл.'; // Мілілітри як базова одиниця об'єму
export const BASE_WEIGHT_UNIT = 'г.';  // Грамы як базова одиниця ваги

// Одиниці, які використовуються для відображення в залежності від сумарної кількості
export const DISPLAY_VOLUME_SMALL_UNIT = 'мл.';
export const DISPLAY_VOLUME_LARGE_UNIT = 'л.';
export const DISPLAY_WEIGHT_SMALL_UNIT = 'г.';
export const DISPLAY_WEIGHT_LARGE_UNIT = 'кг.';
export const DISPLAY_COUNT_UNIT = 'шт.'; // Для рахункових одиниць немає конвертації

// Коефіцієнти конвертації до БАЗОВОЇ одиниці для кожної категорії
// 'одиниця': { category: 'категорія', factor: коефіцієнт_до_базової_одиниці }
// Наприклад: 1 'л.' = 1000 'мл.', отже, для 'л.' фактор буде 1000, якщо базова 'мл.'
export const CONVERSION_FACTORS_TO_BASE = {
  // Категорія: Об'єм (базова одиниця: 'мл.')
  'мл.': { category: 'volume', factor: 1 },
  'л.': { category: 'volume', factor: 1000 },
  'ч.л.': { category: 'volume', factor: 5 },   // 1 чайна ложка = 5 мл (стандартно)
  'ст.л.': { category: 'volume', factor: 15 },  // 1 столова ложка = 15 мл (стандартно)
  'скл.': { category: 'volume', factor: 250 },  // 1 склянка = 250 мл (загальноприйнято)

  // Категорія: Вага (базова одиниця: 'г.')
  'мг.': { category: 'weight', factor: 0.001 }, // 1 міліграм = 0.001 грама
  'г.': { category: 'weight', factor: 1 },
  'кг.': { category: 'weight', factor: 1000 },

  // Категорія: Кількість (без конвертації, фактор 1 для прямого сумування)
  'шт.': { category: 'count', factor: 1 },
  // Додайте інші одиниці, які ви використовуєте, якщо вони не зазначені
};

// Тип для інформації про одиницю, як вона зберігається у CONVERSION_FACTORS_TO_BASE
type UnitInfo = {
  category: 'volume' | 'weight' | 'count';
  factor: number;
};

/**
 * Конвертує кількість з однієї одиниці в іншу в межах однієї категорії.
 * @param quantity Кількість для конвертації.
 * @param fromUnit Назва одиниці, з якої конвертуємо (наприклад, 'г.', 'ч.л.').
 * @param toUnit Назва одиниці, до якої конвертуємо (наприклад, 'кг.', 'мл.').
 * @returns Конвертована кількість.
 * @throws Error, якщо одиниці невідомі або належать до різних категорій.
 */
export function convertUnits(quantity: number, fromUnit: string, toUnit: string): number {
  const fromInfo = CONVERSION_FACTORS_TO_BASE[fromUnit as keyof typeof CONVERSION_FACTORS_TO_BASE] as UnitInfo | undefined;
  const toInfo = CONVERSION_FACTORS_TO_BASE[toUnit as keyof typeof CONVERSION_FACTORS_TO_BASE] as UnitInfo | undefined;

  if (!fromInfo) {
    console.warn(`Невідома одиниця вимірювання (fromUnit): ${fromUnit}. Повернення оригінальної кількості.`);
    return quantity; // Повертаємо оригінал, якщо fromUnit невідома
  }
  if (!toInfo) {
    console.warn(`Невідома одиниця вимірювання (toUnit): ${toUnit}. Повернення оригінальної кількості.`);
    return quantity; // Повертаємо оригінал, якщо toUnit невідома
  }

  // Перевірка, чи належать одиниці до однієї категорії для конвертації
  if (fromInfo.category !== toInfo.category) {
    // Спеціальна обробка для одиниць типу 'count' - вони можуть конвертуватися тільки самі в себе
    if (fromInfo.category === 'count' || toInfo.category === 'count') {
      if (fromUnit === toUnit) {
        return quantity; // Для 'шт.' до 'шт.' просто повертаємо кількість
      }
      throw new Error(`Неможливо конвертувати ${fromUnit} в ${toUnit}. Одиниці належать до різних категорій.`);
    }
    throw new Error(`Неможливо конвертувати ${fromUnit} в ${toUnit}. Одиниці належать до різних категорій.`);
  }

  // Конвертуємо спочатку до базової одиниці її категорії, потім до цільової
  const quantityInBaseCategoryUnit = quantity * fromInfo.factor;
  const convertedQuantity = quantityInBaseCategoryUnit / toInfo.factor;

  return convertedQuantity;
}

/**
 * Отримує категорію одиниці вимірювання (наприклад, 'volume', 'weight', 'count').
 * @param unitName Назва одиниці вимірювання (наприклад, 'г.', 'мл.').
 * @returns Категорія одиниці або `undefined`, якщо одиниця не знайдена.
 */
export function getUnitCategory(unitName: string): 'volume' | 'weight' | 'count' | undefined {
  const info = CONVERSION_FACTORS_TO_BASE[unitName as keyof typeof CONVERSION_FACTORS_TO_BASE] as UnitInfo | undefined;
  return info?.category;
}

/**
 * Конвертує кількість інгредієнта до базової одиниці його категорії (мл., г. або шт.).
 * Це внутрішня функція для агрегації.
 * @param quantity Кількість інгредієнта.
 * @param unitName Назва одиниці вимірювання інгредієнта (наприклад, 'г.', 'ч.л.').
 * @returns Об'єкт з конвертованою кількістю (`value`) та назвою базової одиниці (`unit`).
 */
export function convertToBaseUnit(
  quantity: number,
  unitName: string // Приймаємо назву одиниці як рядок
): { value: number; unit: string } {
  const category = getUnitCategory(unitName);

  if (!category) {
    console.warn(`Не вдалося визначити категорію для одиниці: ${unitName}. Повернення оригінальної кількості.`);
    return { value: quantity, unit: unitName }; // Повертаємо оригінал, якщо категорія невідома
  }

  if (category === 'count') {
    return { value: quantity, unit: DISPLAY_COUNT_UNIT }; // Для рахункових одиниць немає конвертації
  }

  const targetBaseUnit = category === 'volume' ? BASE_VOLUME_UNIT : BASE_WEIGHT_UNIT;

  // Використовуємо існуючу функцію convertUnits
  const convertedValue = convertUnits(quantity, unitName, targetBaseUnit);

  return { value: convertedValue, unit: targetBaseUnit };
}

/**
 * Форматує сумарну кількість та одиницю для відображення, використовуючи менші одиниці
 * для кількостей менше 1 кг/л, та більші для інших.
 * @param totalQuantityInBaseUnit Сумована кількість у базових одиницях (мл. або г.).
 * @param category Категорія одиниці ('volume', 'weight', 'count').
 * @returns Об'єкт з відформатованим значенням (`value`) та одиницею (`unit`) для відображення.
 */
export function formatQuantityForDisplay(totalQuantityInBaseUnit: number, category: 'volume' | 'weight' | 'count'): { value: number; unit: string } {
  // Для рахункових одиниць просто повертаємо значення та одиницю, округлюємо до цілого.
  if (category === 'count') {
    return { value: Math.round(totalQuantityInBaseUnit), unit: DISPLAY_COUNT_UNIT };
  }

  // Для об'єму
  if (category === 'volume') {
    // Порівнюємо з 1000 мл (1 літр)
    if (totalQuantityInBaseUnit >= 1000) {
      const quantityInLiters = convertUnits(totalQuantityInBaseUnit, BASE_VOLUME_UNIT, DISPLAY_VOLUME_LARGE_UNIT);
      return { value: parseFloat(quantityInLiters.toFixed(2)), unit: DISPLAY_VOLUME_LARGE_UNIT }; // Округлення до 2 знаків після коми
    } else {
      // Якщо менше 1 літра, відображаємо в мілілітрах
      return { value: parseFloat(totalQuantityInBaseUnit.toFixed(0)), unit: DISPLAY_VOLUME_SMALL_UNIT }; // Округлення до цілих мл
    }
  }

  // Для ваги
  if (category === 'weight') {
    // Порівнюємо з 1000 г (1 кілограм)
    if (totalQuantityInBaseUnit >= 1000) {
      const quantityInKilograms = convertUnits(totalQuantityInBaseUnit, BASE_WEIGHT_UNIT, DISPLAY_WEIGHT_LARGE_UNIT);
      return { value: parseFloat(quantityInKilograms.toFixed(2)), unit: DISPLAY_WEIGHT_LARGE_UNIT }; // Округлення до 2 знаків після коми
    } else {
      // Якщо менше 1 кілограма, відображаємо в грамах
      return { value: parseFloat(totalQuantityInBaseUnit.toFixed(0)), unit: DISPLAY_WEIGHT_SMALL_UNIT }; // Округлення до цілих г
    }
  }

  // Запасний варіант, хоча типи повинні цього запобігати
  return { value: totalQuantityInBaseUnit, unit: 'Н/Д' };
}
