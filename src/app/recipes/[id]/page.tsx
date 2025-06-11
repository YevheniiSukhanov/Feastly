// src/app/recipes/[id]/page.tsx
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface RecipeDetailsPageProps {
  params: { id: string };
}

export default async function RecipeDetailsPage({ params }: RecipeDetailsPageProps) {
  const recipeId = params.id;

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    notFound();
  }

  return (
    <main style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{recipe.name}</h1>
      <p>
        <Link href={`/recipes/${recipe.id}/edit`} style={{ display: 'inline-block', margin: '10px 0', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Редагувати рецепт
        </Link>
      </p>

      {recipe.imageUrl && (
        <img src={recipe.imageUrl} alt={recipe.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', marginBottom: '20px' }} />
      )}

      <h2>Інгредієнти:</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.ingredients}</p> {/* pre-wrap для збереження форматування */}

      <h2>Інструкції:</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions}</p>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        {recipe.prepTimeMinutes && <p><strong>Час підготовки:</strong> {recipe.prepTimeMinutes} хв</p>}
        {recipe.cookTimeMinutes && <p><strong>Час приготування:</strong> {recipe.cookTimeMinutes} хв</p>}
        {recipe.servings && <p><strong>Порцій:</strong> {recipe.servings}</p>}
      </div>

      <p style={{ marginTop: '30px' }}>
        <Link href="/recipes" style={{ color: '#007bff', textDecoration: 'none' }}>
          Повернутися до списку рецептів
        </Link>
      </p>
    </main>
  );
}