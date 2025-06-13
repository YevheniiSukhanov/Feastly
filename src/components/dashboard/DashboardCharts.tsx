// src/components/dashboard/DashboardCharts.tsx
'use client'; // Цей компонент буде клієнтським

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MealType } from '@/types/meal-plan';
import { formatDayMonth } from '@/lib/utils'; // Імпортуємо для форматування дати на осі X

interface DashboardChartsProps {
  mealTypeCounts: { [key in MealType]?: number };
  mealsPerDay: { date: string; count: number }[];
}

const COLORS = {
  breakfast: '#FFC658', // Yellow
  lunch: '#88D8B0',    // Green
  dinner: '#85A6DA',   // Blue
  snack: '#B788DA',    // Purple
  other: '#C4C4C4',    // Grey for unknown
};

const getMealTypeDisplayName = (mealType: MealType | string): string => {
    switch (mealType) {
        case 'breakfast': return 'Сніданок';
        case 'lunch': return 'Обід';
        case 'dinner': return 'Вечеря';
        case 'snack': return 'Перекус';
        default: return mealType; // Якщо прийде "other" або невідомий
    }
};

export default function DashboardCharts({ mealTypeCounts, mealsPerDay }: DashboardChartsProps) {
    // Підготовка даних для кругової діаграми
    const pieChartData = Object.keys(mealTypeCounts).map(key => ({
        name: getMealTypeDisplayName(key),
        value: mealTypeCounts[key as MealType] || 0,
        color: COLORS[key as keyof typeof COLORS] || COLORS.other,
    })).filter(item => item.value > 0); // Показуємо тільки типи, де є дані

    // Підготовка даних для гістограми
    // Ensure all days of the week are present, even if count is 0
    const orderedMealsPerDay = mealsPerDay.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // For Recharts, sorting by date is important for XAxis

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Розподіл прийомів їжі за типом (Кругова діаграма) */}
            <section className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Розподіл прийомів їжі за типом</h2>
                {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} страв`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-700">Немає даних для кругової діаграми цього тижня.</p>
                )}
            </section>

            {/* Кількість страв по днях (Гістограма) */}
            <section className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">Кількість страв по днях</h2>
                {orderedMealsPerDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={orderedMealsPerDay}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatDayMonth} />
                            <YAxis allowDecimals={false} /> {/* Allow only whole numbers for Y axis */}
                            <Tooltip formatter={(value) => `${value} страв`} labelFormatter={name => `День: ${formatDayMonth(name)}`} />
                            <Legend />
                            <Bar dataKey="count" name="Кількість страв" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-700">Немає даних для гістограми цього тижня.</p>
                )}
            </section>
        </div>
    );
}