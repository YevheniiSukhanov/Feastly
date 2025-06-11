// src/app/recipes/page.tsx (Server Component)

import Link from 'next/link';
import prisma from '@/lib/prisma'; // Імпортуємо Prisma

export default async function RecipesPage() {
  // Завантажуємо рецепти напряму з БД на сервері
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: 'desc' }, // Сортуємо за датою створення
  });

  return (
    <main style={{ padding: '20px' }}>
      <h1>Ваші Рецепти</h1>
      <Link href="/recipes/new" style={{ display: 'inline-block', margin: '10px 0', padding: '8px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Додати новий рецепт
      </Link>

      {recipes.length === 0 ? (
        <p>Наразі у вас немає рецептів. Додайте перший!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {recipes.map((recipe) => (
            <div key={recipe.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px' }}>
              <h2>{recipe.name}</h2>
              <p>Інгредієнти: {recipe.ingredients.substring(0, 100)}...</p>
              <p>Час приготування: {recipe.prepTimeMinutes} хв</p>
              <Link href={`/recipes/${recipe.id}`} style={{ color: '#007bff', textDecoration: 'none' }}>
                Деталі
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}