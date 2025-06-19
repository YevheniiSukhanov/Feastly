-- CreateTable
CREATE TABLE `Ingredient` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Ingredient_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingredients_on_recipes` (
    `ingredient_id` VARCHAR(255) NOT NULL,
    `recipe_id` VARCHAR(255) NOT NULL,
    `quantity` FLOAT NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`ingredient_id`, `recipe_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Recipe` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `instructions` TEXT NOT NULL,
    `prepTimeMinutes` INTEGER NULL,
    `cookTimeMinutes` INTEGER NULL,
    `servings` INTEGER NULL,
    `image_url` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MealPlan` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NULL,
    `plan_name` VARCHAR(255) NOT NULL,
    `week_start_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_plan_entries` (
    `id` VARCHAR(255) NOT NULL,
    `meal_plan_id` VARCHAR(255) NOT NULL,
    `recipe_id` VARCHAR(255) NULL,
    `meal_date` DATE NOT NULL,
    `meal_type` ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `meal_plan_entries_meal_plan_id_meal_date_meal_type_key`(`meal_plan_id`, `meal_date`, `meal_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ingredients_on_recipes` ADD CONSTRAINT `ingredients_on_recipes_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `Ingredient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingredients_on_recipes` ADD CONSTRAINT `ingredients_on_recipes_recipe_id_fkey` FOREIGN KEY (`recipe_id`) REFERENCES `Recipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_plan_entries` ADD CONSTRAINT `meal_plan_entries_meal_plan_id_fkey` FOREIGN KEY (`meal_plan_id`) REFERENCES `MealPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_plan_entries` ADD CONSTRAINT `meal_plan_entries_recipe_id_fkey` FOREIGN KEY (`recipe_id`) REFERENCES `Recipe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
