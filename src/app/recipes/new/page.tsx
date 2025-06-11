// src/app/recipes/new/page.tsx (Server Component, використовує Server Action)

import { addRecipeAction } from '@/lib/actions'; // Імпортуємо Server Action
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default function NewRecipePage() {
  // `action` атрибут форми буде викликати Server Action
  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Додати Новий Рецепт</h1>
      <form action={addRecipeAction} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Назва рецепту:</label>
          <input type="text" id="name" name="name" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label htmlFor="ingredients" style={{ display: 'block', marginBottom: '5px' }}>Інгредієнти:</label>
          <textarea id="ingredients" name="ingredients" required rows={5} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
        </div>
        <div>
          <label htmlFor="instructions" style={{ display: 'block', marginBottom: '5px' }}>Інструкції:</label>
          <textarea id="instructions" name="instructions" required rows={8} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}></textarea>
        </div>
        <div>
          <label htmlFor="prepTimeMinutes" style={{ display: 'block', marginBottom: '5px' }}>Час підготовки (хв):</label>
          <input type="number" id="prepTimeMinutes" name="prepTimeMinutes" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label htmlFor="cookTimeMinutes" style={{ display: 'block', marginBottom: '5px' }}>Час приготування (хв):</label>
          <input type="number" id="cookTimeMinutes" name="cookTimeMinutes" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label htmlFor="servings" style={{ display: 'block', marginBottom: '5px' }}>Кількість порцій:</label>
          <input type="number" id="servings" name="servings" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <div>
          <label htmlFor="imageUrl" style={{ display: 'block', marginBottom: '5px' }}>Посилання на зображення:</label>
          <input type="text" id="imageUrl" name="imageUrl" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
          Додати Рецепт
        </button>
      </form>
    </main>
  );
}
