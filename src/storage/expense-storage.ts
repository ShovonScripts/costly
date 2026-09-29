import AsyncStorage from '@react-native-async-storage/async-storage';

import { EXPENSE_CATEGORIES, type Expense } from '@/types/expense';

export const STORAGE_KEY = '@costly/expenses';

function isExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<Expense>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    typeof candidate.date === 'string' &&
    !Number.isNaN(new Date(candidate.date).getTime()) &&
    typeof candidate.note === 'string' &&
    EXPENSE_CATEGORIES.includes(candidate.category as never)
  );
}

/**
 * Reads the saved expenses. Returns `null` when there is nothing usable, so the
 * caller can fall back to the seed data.
 */
export async function loadExpenses(): Promise<Expense[] | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isExpense)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}
