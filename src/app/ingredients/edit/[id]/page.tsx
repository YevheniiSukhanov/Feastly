// src/app/ingredients/edit/[id]/page.tsx
'use client';

// Додаємо 'use' до імпортів React
import { useState, useEffect, FormEvent, useCallback, use } from 'react'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Дозволені одиниці вимірювання (збігаються з API)
const ALLOWED_UNITS = ['шт.', 'г.', 'мл.'];

// Визначення типу для Ingredient (як на сторінці списку)
interface Ingredient {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// *** ОНОВЛЕНО: Тип для params тепер Promise ***
interface EditIngredientPageProps {
  params: Promise<{ id: string }>; // params тепер Promise, який потрібно розгорнути
}

export default function EditIngredientPage({ params }: EditIngredientPageProps) {
  // *** ОНОВЛЕНО: Використання React.use() для розгортання params ***
  // `use` розгортає Promise і повертає його значення.
  // Це дозволяє отримати доступ до `id` синхронно.
  const resolvedParams = use(params); 
  const { id } = resolvedParams; // Отримуємо ID інгредієнта з розгорнутих параметрів

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [unit, setUnit] = useState<string>(''); 
  const [imageUrl, setImageUrl] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(true); 
  const [submitting, setSubmitting] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Функція для завантаження даних інгредієнта
  const fetchIngredient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ingredients/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Інгредієнт не знайдено.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Ingredient = await response.json();
      
      setName(data.name);
      setDescription(data.description || ''); 
      setUnit(data.unit);
      setImageUrl(data.imageUrl || ''); 
    } catch (err: any) {
      console.error(`Failed to fetch ingredient with ID ${id}:`, err);
      setError(err.message || 'Не вдалося завантажити дані інгредієнта. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  }, [id]); // Залежність від ID, щоб перезавантажити, якщо ID зміниться

  // Викликаємо функцію завантаження при завантаженні компонента
  useEffect(() => {
    if (id) {
      fetchIngredient();
    }
  }, [id, fetchIngredient]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    // Клієнтська валідація
    if (!name.trim()) {
      setError('Назва інгредієнта є обов\'язковою.');
      setSubmitting(false);
      return;
    }
    if (!ALLOWED_UNITS.includes(unit)) {
      setError('Будь ласка, оберіть допустиму одиницю вимірювання.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() === '' ? null : description.trim(),
          unit,
          imageUrl: imageUrl.trim() === '' ? null : imageUrl.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      alert('Інгредієнт успішно оновлено!');
      router.push('/ingredients'); 
    } catch (err: any) {
      console.error('Failed to update ingredient:', err);
      setError(err.message || 'Не вдалося оновити інгредієнт. Спробуйте пізніше.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl font-semibold text-gray-700">Завантаження даних інгредієнта...</p>
      </div>
    );
  }

  if (error && !loading && !name) { 
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl font-semibold text-red-600">{error}</p>
        <button
          onClick={() => fetchIngredient()}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Редагувати Інгредієнт</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Помилка!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="mb-5">
          <label htmlFor="name" className="block text-gray-700 text-lg font-medium mb-2">
            Назва інгредієнта <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            required
            aria-required="true"
          />
        </div>

        <div className="mb-5">
          <label htmlFor="description" className="block text-gray-700 text-lg font-medium mb-2">
            Опис
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base resize-none"
          ></textarea>
        </div>

        <div className="mb-5">
          <label htmlFor="unit" className="block text-gray-700 text-lg font-medium mb-2">
            Одиниця вимірювання <span className="text-red-500">*</span>
          </label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="shadow border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            required
            aria-required="true"
          >
            {ALLOWED_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="imageUrl" className="block text-gray-700 text-lg font-medium mb-2">
            Посилання на зображення
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 text-base"
            placeholder="http://example.com/image.jpg"
          />
        </div>

        <div className="flex justify-between items-center mt-8">
          <Link href="/ingredients" legacyBehavior>
            <a className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg">
              Скасувати
            </a>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Оновлення...' : 'Оновити інгредієнт'}
          </button>
        </div>
      </form>
    </div>
  );
}