// src/components/meal-planner/DayColumn.tsx
'use client';

import React from 'react';
import { BoardDay, MealType } from '@/types/meal-plan';
import MealSector from './MealSector';

interface DayColumnProps {
  day: BoardDay; // Тут day.name вже міститиме "Понеділок\n6 січня"
  currentMealPlanId: string;
}

function DayColumn({ day, currentMealPlanId }: DayColumnProps) {
  // Розбиваємо назву дня на дві частини для відображення
  // (Назва дня та дата вже об'єднані в page.tsx для зручності)
  const [dayName, dayDate] = day.name.split('\n');

  return (
    <div
      style={{
        flex: '1 0 200px', // Щоб колонки мали мінімальну ширину і розтягувалися
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
      }}
    >
      <h3 style={{ textAlign: 'center', marginBottom: '15px', lineHeight: '1.2' }}>
        {dayName}
        <br />
        {/* Виправлення 3: Використовуємо вже відформатовану дату з day.name */}
        <span style={{ fontSize: '0.8em', color: '#666' }}>{dayDate}</span>
      </h3>
      <MealSector
        day={day} // Передаємо повний об'єкт дня для його date та інших даних
        mealType="breakfast"
        entries={day.meals.breakfast}
        currentMealPlanId={currentMealPlanId}
      />
      <MealSector
        day={day}
        mealType="lunch"
        entries={day.meals.lunch}
        currentMealPlanId={currentMealPlanId}
      />
      <MealSector
        day={day}
        mealType="dinner"
        entries={day.meals.dinner}
        currentMealPlanId={currentMealPlanId}
      />
      <MealSector
        day={day}
        mealType="snack"
        entries={day.meals.snack}
        currentMealPlanId={currentMealPlanId}
      />
    </div>
  );
}

export default DayColumn;