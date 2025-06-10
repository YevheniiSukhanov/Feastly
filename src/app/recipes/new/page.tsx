// src/app/recipes/new/page.tsx
import RecipeForm from '@/components/recipes/RecipeForm';
import { addRecipeAction } from '@/lib/actions'; // Імпортуємо Server Action

export default function NewRecipePage() {
  return (
    <main style={{ padding: '20px' }}>
      {/* Передаємо Server Action у властивість 'action' клієнтського компонента */}
      <RecipeForm action={addRecipeAction} />
    </main>
  );
}