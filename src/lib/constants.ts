// src/lib/constants.ts

// Визначення наборів одиниць для різних категорій
export const VOLUME_UNITS = new Set(['мл.', 'л.', 'ч.л.', 'ст.л.', 'скл.']);
export const WEIGHT_UNITS = new Set(['г.', 'кг.']);
export const COUNT_UNITS = new Set(['шт.']);
export const OTHER_UNITS = new Set(['пуч.', 'дріб.', 'за смаком']); // Одиниці, які загалом застосовні або неспецифічні

// Всі дозволені одиниці вимірювання для рецептів (для загального списку або початкового значення)
export const ALL_ALLOWED_RECIPE_UNITS = [
  ...Array.from(VOLUME_UNITS),
  ...Array.from(WEIGHT_UNITS),
  ...Array.from(COUNT_UNITS),
  ...Array.from(OTHER_UNITS),
].sort(); // Сортуємо для консистентного відображення

/**
 * Повертає список сумісних одиниць вимірювання для рецепту на основі базової одиниці інгредієнта.
 * Завжди включає 'OTHER_UNITS'.
 * @param baseIngredientUnit Базова одиниця інгредієнта (наприклад, 'мл', 'кг', 'шт').
 * @returns Масив сумісних одиниць.
 */
export const getCompatibleRecipeUnits = (baseIngredientUnit: string | undefined): string[] => {
  const compatibleUnits = new Set<string>(OTHER_UNITS); // Завжди включаємо загальні одиниці

  if (!baseIngredientUnit) {
    return ALL_ALLOWED_RECIPE_UNITS; // Якщо базова одиниця не визначена, показуємо всі
  }

  // Визначаємо категорію базової одиниці та додаємо відповідні одиниці
  if (VOLUME_UNITS.has(baseIngredientUnit)) {
    VOLUME_UNITS.forEach(unit => compatibleUnits.add(unit));
  } else if (WEIGHT_UNITS.has(baseIngredientUnit)) {
    WEIGHT_UNITS.forEach(unit => compatibleUnits.add(unit));
  } else if (COUNT_UNITS.has(baseIngredientUnit)) {
    COUNT_UNITS.forEach(unit => compatibleUnits.add(unit));
  } else {
    // Якщо базова одиниця інгредієнта сама по собі не належить до жодної з категорій,
    // але є в ALL_ALLOWED_RECIPE_UNITS, ми все одно її додаємо.
    // Це може статися, якщо інгредієнт має дуже специфічну одиницю, наприклад 'пуч.'
    if (ALL_ALLOWED_RECIPE_UNITS.includes(baseIngredientUnit)) {
        compatibleUnits.add(baseIngredientUnit);
    }
  }

  return Array.from(compatibleUnits).sort();
};