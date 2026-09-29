import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { createSeedExpenses } from '@/data/seed-expenses';
import { loadExpenses, saveExpenses } from '@/storage/expense-storage';
import type { Expense, ExpenseDraft } from '@/types/expense';

type ExpenseAction =
  | { type: 'HYDRATE'; expenses: Expense[] }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'UPDATE_EXPENSE'; id: string; changes: ExpenseDraft }
  | { type: 'DELETE_EXPENSE'; id: string };

function expenseReducer(state: Expense[], action: ExpenseAction): Expense[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.expenses;
    case 'ADD_EXPENSE':
      return [action.expense, ...state];
    case 'UPDATE_EXPENSE':
      // Replaces only the matching object, leaving the original untouched.
      return state.map((expense) =>
        expense.id === action.id ? { ...expense, ...action.changes } : expense
      );
    case 'DELETE_EXPENSE':
      return state.filter((expense) => expense.id !== action.id);
    default:
      return state;
  }
}

let idCounter = 0;

function createId(): string {
  idCounter += 1;
  return `expense-${Date.now().toString(36)}-${idCounter}`;
}

type ExpenseContextValue = {
  expenses: Expense[];
  isLoading: boolean;
  addExpense: (draft: ExpenseDraft) => Expense;
  updateExpense: (id: string, changes: ExpenseDraft) => void;
  deleteExpense: (id: string) => void;
  getExpense: (id: string) => Expense | undefined;
};

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, dispatch] = useReducer(expenseReducer, undefined, createSeedExpenses);
  const [isLoading, setIsLoading] = useState(true);

  // Stays false until storage has been read, so the persist effect below never
  // writes the seed data over real saved data.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let initialExpenses: Expense[];
      try {
        initialExpenses = (await loadExpenses()) ?? createSeedExpenses();
      } catch {
        // Storage itself failed (not just bad JSON) — still start with seeds.
        initialExpenses = createSeedExpenses();
      }

      if (cancelled) {
        return;
      }

      hasLoadedRef.current = true;
      dispatch({ type: 'HYDRATE', expenses: initialExpenses });
      setIsLoading(false);
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  // The only place that writes to storage. Effects run in order after every
  // render, so consecutive add/delete calls queue up and each one persists the
  // latest state instead of racing a stale snapshot.
  useEffect(() => {
    if (!hasLoadedRef.current) {
      return;
    }
    void saveExpenses(expenses);
  }, [expenses]);

  const addExpense = useCallback((draft: ExpenseDraft): Expense => {
    const expense: Expense = {
      ...draft,
      id: createId(),
      date: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EXPENSE', expense });
    return expense;
  }, []);

  // Only amount / category / note are updatable, so `date` and `id` stay as-is.
  const updateExpense = useCallback((id: string, changes: ExpenseDraft) => {
    dispatch({ type: 'UPDATE_EXPENSE', id, changes });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', id });
  }, []);

  const getExpense = useCallback(
    (id: string) => expenses.find((expense) => expense.id === id),
    [expenses]
  );

  const value = useMemo(
    () => ({ expenses, isLoading, addExpense, updateExpense, deleteExpense, getExpense }),
    [expenses, isLoading, addExpense, updateExpense, deleteExpense, getExpense]
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used inside an <ExpenseProvider>');
  }
  return context;
}
