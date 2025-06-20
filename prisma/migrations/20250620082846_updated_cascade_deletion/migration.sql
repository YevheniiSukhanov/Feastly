/*
  Warnings:

  - You are about to drop the `meal_plan_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meal_plan_entry_recipes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `meal_plan_entries` DROP FOREIGN KEY `meal_plan_entries_meal_plan_id_fkey`;

-- DropForeignKey
ALTER TABLE `meal_plan_entry_recipes` DROP FOREIGN KEY `meal_plan_entry_recipes_mealPlanEntryId_fkey`;

-- DropForeignKey
ALTER TABLE `meal_plan_entry_recipes` DROP FOREIGN KEY `meal_plan_entry_recipes_recipeId_fkey`;

-- DropTable
DROP TABLE `meal_plan_entries`;

-- DropTable
DROP TABLE `meal_plan_entry_recipes`;

-- CreateTable
CREATE TABLE `MealPlanEntry` (
    `id` VARCHAR(191) NOT NULL,
    `mealPlanId` VARCHAR(191) NOT NULL,
    `mealDate` DATETIME(3) NOT NULL,
    `mealType` ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MealPlanEntry_mealPlanId_mealDate_mealType_key`(`mealPlanId`, `mealDate`, `mealType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MealPlanEntryRecipe` (
    `id` VARCHAR(191) NOT NULL,
    `mealPlanEntryId` VARCHAR(191) NOT NULL,
    `recipeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MealPlanEntryRecipe_mealPlanEntryId_recipeId_key`(`mealPlanEntryId`, `recipeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MealPlanEntry` ADD CONSTRAINT `MealPlanEntry_mealPlanId_fkey` FOREIGN KEY (`mealPlanId`) REFERENCES `MealPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealPlanEntryRecipe` ADD CONSTRAINT `MealPlanEntryRecipe_mealPlanEntryId_fkey` FOREIGN KEY (`mealPlanEntryId`) REFERENCES `MealPlanEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealPlanEntryRecipe` ADD CONSTRAINT `MealPlanEntryRecipe_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
