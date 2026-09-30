import type { Expense } from '@/types/expense';

/** Days before today, so the dashboard totals are never empty on first launch. */
function daysAgo(days: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function createSeedExpenses(): Expense[] {
  return [
    {
      id: 'seed-1',
      amount: 12.5,
      category: 'Food',
      date: daysAgo(0, 9),
      note: 'Flat white and croissant',
    },
    {
      id: 'seed-2',
      amount: 64.2,
      category: 'Shopping',
      date: daysAgo(0, 15),
      note: 'Running shoes',
    },
    {
      id: 'seed-3',
      amount: 8.75,
      category: 'Transport',
      date: daysAgo(1, 8),
      note: 'Metro top up',
    },
    {
      id: 'seed-4',
      amount: 45,
      category: 'Bills',
      date: daysAgo(3, 11),
      note: 'Internet subscription',
    },
    {
      id: 'seed-5',
      amount: 120,
      category: 'Health',
      date: daysAgo(6, 10),
      note: 'Dentist check up',
    },
    {
      id: 'seed-6',
      amount: 18.9,
      category: 'Food',
      date: daysAgo(9, 19),
      note: 'Groceries',
    },
    {
      id: 'seed-7',
      amount: 30,
      category: 'Entertainment',
      date: daysAgo(12, 20),
      note: 'Cinema tickets',
    },
    {
      id: 'seed-8',
      amount: 55,
      category: 'Other',
      date: daysAgo(20, 13),
      note: 'Gift for mom',
    },
  ];
}
