// src/app/recipes/page.tsx (Server Component)

import Link from 'next/link';
import prisma from '@/lib/prisma'; // Імпортуємо Prisma

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main style={{ padding: '20px' }}>
      <h1>Ваші Рецепти</h1>
      <Link href="/recipes/new" style={{ display: 'inline-block', margin: '10px 0', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Додати новий рецепт
      </Link>

      {recipes.length === 0 ? (
        <p>Наразі у вас немає рецептів. Додайте перший!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {recipes.map((recipe) => (
            <div key={recipe.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px' }}>
              <h2>{recipe.name}</h2>
              {recipe.imageUrl && (
                  <img src={recipe.imageUrl} alt={recipe.name} style={{ maxWidth: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
              )}
              <p>Інгредієнти: {recipe.ingredients.substring(0, 100)}...</p>
              {/* Змінено посилання на сторінку деталей */}
              <Link href={`/recipes/${recipe.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                Деталі та редагування
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}