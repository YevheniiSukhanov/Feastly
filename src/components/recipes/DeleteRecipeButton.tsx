// src/components/recipes/DeleteRecipeButton.tsx
'use client'; // Ця директива робить компонент клієнтським

import { useRouter } from 'next/navigation'; // Для програмної навігації (хоча redirect у Server Action перенаправить)
import { deleteRecipeAction } from '@/lib/actions';
import React, { useState, useTransition } from 'react';

interface DeleteRecipeButtonProps {
  recipeId: string;
  recipeName: string; // Для відображення у підтвердженні
}

export default function DeleteRecipeButton({ recipeId, recipeName }: DeleteRecipeButtonProps) {
  const [isPending, startTransition] = useTransition(); // Для відстеження стану виконання Server Action
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null); // Очищаємо попередні помилки

    const confirmDelete = window.confirm(
      `Ви впевнені, що хочете видалити рецепт "${recipeName}"? Цю дію неможливо скасувати.`
    );

    if (confirmDelete) {
      startTransition(async () => {
        try {
          // Викликаємо Server Action
          // Оскільки Server Action робить редирект, він сам змінить маршрут.
          await deleteRecipeAction(recipeId);
        } catch (err: any) {
          // Обробляємо помилки, що виникли в Server Action (крім NEXT_REDIRECT)
          console.error("Помилка при видаленні рецепта:", err);
          setError(err.message || 'Виникла невідома помилка при видаленні.');
        }
      });
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isPending} // Відключаємо кнопку під час виконання дії
        style={{
          padding: '8px 15px',
          backgroundColor: '#dc3545', // Червоний колір для видалення
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Видалення...' : 'Видалити Рецепт'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </>
  );
}