// src/app/recipes/[id]/edit/page.tsx
import prisma from '@/lib/prisma';
import { updateRecipeAction } from '@/lib/actions';
import { notFound } from 'next/navigation'; // Для обробки випадків, коли рецепт не знайдено

interface EditRecipePageProps {
  params: { id: string }; // Next.js передає динамічні параметри маршруту через `params`
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const recipeId = params.id;

  // Завантажуємо дані рецепту з бази даних
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  // Якщо рецепт не знайдено, повертаємо 404 сторінку
  if (!recipe) {
    notFound();
  }

  // Bind Server Action з ID рецепту
  // Це створює нову функцію, яка вже має id рецепту і приймає лише formData
  const updateRecipeWithId = updateRecipeAction.bind(null, recipe.id);

  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Редагувати Рецепт: {recipe.name}</h1>
      <form action={updateRecipeWithId} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Попередньо заповнюємо поля форми даними рецепту */}
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Назва рецепту:</label>
          <input type="text" id="name" name="name" defaultValue={recipe.name} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label htmlFor="ingredients" style={{ display: 'block', marginBottom: '5px' }}>Інгредієнти:</label>
          <textarea id="ingredients" name="ingredients" defaultValue={recipe.ingredients} required rows={5} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
        </div>
        <div>
          <label htmlFor="instructions" style={{ display: 'block', marginBottom: '5px' }}>Інструкції:</label>
          <textarea id="instructions" name="instructions" defaultValue={recipe.instructions} required rows={8} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
        </div>
        <div>
          <label htmlFor="prepTimeMinutes" style={{ display: 'block', marginBottom: '5px' }}>Час підготовки (хв):</label>
          <input type="number" id="prepTimeMinutes" name="prepTimeMinutes" defaultValue={recipe.prepTimeMinutes || ''} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label htmlFor="cookTimeMinutes" style={{ display: 'block', marginBottom: '5px' }}>Час приготування (хв):</label>
          <input type="number" id="cookTimeMinutes" name="cookTimeMinutes" defaultValue={recipe.cookTimeMinutes || ''} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label htmlFor="servings" style={{ display: 'block', marginBottom: '5px' }}>Кількість порцій:</label>
          <input type="number" id="servings" name="servings" defaultValue={recipe.servings || ''} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label htmlFor="imageUrl" style={{ display: 'block', marginBottom: '5px' }}>Посилання на зображення:</label>
          <input type="text" id="imageUrl" name="imageUrl" defaultValue={recipe.imageUrl || ''} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
          Оновити Рецепт
        </button>
      </form>
    </main>
  );
}