// src/components/recipes/RecipeForm.tsx
'use client'; // Робимо компонент клієнтським

import React, { useActionState, useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom'; // Хуки для Server Actions

// Інтерфейс для стану форми, як визначено у Server Action
interface FormState {
  message: string;
  errors: {
    name?: string[];
    ingredients?: string[];
    instructions?: string[];
    prepTime?: string[];
    servings?: string[];
    _form?: string[];
  };
  success?: boolean;
}

// Компонент, який показує стан відправки форми (для кнопки)
function SubmitButton() {
  const { pending } = useFormStatus(); // Pending - true, коли форма відправляється

  return (
    <button
      type="submit"
      disabled={pending} // Вимикаємо кнопку під час відправки
      style={{
        padding: '10px 20px',
        backgroundColor: pending ? '#ccc' : '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: pending ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        marginTop: '15px',
      }}
    >
      {pending ? 'Додаємо...' : 'Додати Рецепт'}
    </button>
  );
}

// Основний компонент форми
interface RecipeFormProps {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
}

export default function RecipeForm({ action }: RecipeFormProps) {
  // useFormState: перший аргумент - Server Action, другий - початковий стан
  const [state, formAction] = useActionState(action, {
    message: '',
    errors: {},
    success: undefined,
  });

  const formRef = useRef<HTMLFormElement>(null); // Для скидання форми

  // Ефект для відображення повідомлення про успіх і скидання форми
  useEffect(() => {
    if (state.success) {
      alert(state.message); // Можна замінити на тост-повідомлення
      formRef.current?.reset(); // Скидаємо форму після успішного додавання
    } else if (state.message && state.errors._form) {
      alert(state.message); // Показати загальну помилку, якщо є
    }
  }, [state]);

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Додати Новий Рецепт</h2>

      <form ref={formRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Назва рецепта:</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            aria-describedby="name-error" // Для доступності
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
          {state.errors.name && (
            <p id="name-error" style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>
              {state.errors.name.join(', ')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ingredients" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Інгредієнти:</label>
          <textarea
            id="ingredients"
            name="ingredients"
            rows={5}
            required
            aria-describedby="ingredients-error"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          ></textarea>
          {state.errors.ingredients && (
            <p id="ingredients-error" style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>
              {state.errors.ingredients.join(', ')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="instructions" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Інструкції:</label>
          <textarea
            id="instructions"
            name="instructions"
            rows={7}
            required
            aria-describedby="instructions-error"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          ></textarea>
          {state.errors.instructions && (
            <p id="instructions-error" style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>
              {state.errors.instructions.join(', ')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="prepTime" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Час приготування (хв):</label>
          <input
            type="number"
            id="prepTime"
            name="prepTime"
            required
            min="1"
            aria-describedby="prepTime-error"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
          {state.errors.prepTime && (
            <p id="prepTime-error" style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>
              {state.errors.prepTime.join(', ')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="servings" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Кількість порцій:</label>
          <input
            type="number"
            id="servings"
            name="servings"
            required
            min="1"
            aria-describedby="servings-error"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
          />
          {state.errors.servings && (
            <p id="servings-error" style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>
              {state.errors.servings.join(', ')}
            </p>
          )}
        </div>

        {/* Загальні помилки форми */}
        {state.errors._form && (
          <p style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>
            {state.errors._form.join(', ')}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}