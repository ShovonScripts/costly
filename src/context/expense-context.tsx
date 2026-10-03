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

import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type ExpenseDraft } from '@/types/expense';
import { getCountry, type CountryCode, type CountryOption } from '@/constants/countries';
import { formatCurrency } from '@/utils/expense';
import { DEFAULT_PREFERENCES, type UserPreferences, type UserProfile } from '@/types/preferences';
import { loadExpenses, saveExpenses } from '@/storage/expense-storage';
import { loadPreferences, savePreferences } from '@/storage/preferences-storage';
import { createSeedExpenses } from '@/data/seed-expenses';
import { processRecurringExpenses } from '@/utils/recurring';
import { checkAndTriggerBudgetNotifications } from '@/utils/notifications';

type ExpenseAction =
  | { type: 'HYDRATE'; expenses: Expense[] }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'UPDATE_EXPENSE'; id: string; changes: ExpenseDraft }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'RENAME_CATEGORY'; from: string; to: string };

function expenseReducer(state: Expense[], action: ExpenseAction): Expense[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.expenses;
    case 'ADD_EXPENSE':
      return [action.expense, ...state];
    case 'UPDATE_EXPENSE':
      return state.map((expense) => expense.id === action.id
        ? { ...expense, ...action.changes, date: action.changes.date ?? expense.date }
        : expense);
    case 'DELETE_EXPENSE':
      return state.filter((expense) => expense.id !== action.id);
    case 'RENAME_CATEGORY':
      return state.map((expense) => expense.category === action.from
        ? { ...expense, category: action.to }
        : expense);
    default:
      return state;
  }
}

let idCounter = 0;

function createId(): string {
  idCounter += 1;
  return `expense-${Date.now().toString(36)}-${idCounter}`;
}

export type DeleteCategoryResult = 'deleted' | 'in-use' | 'not-custom';

type ExpenseContextValue = {
  expenses: Expense[];
  isLoading: boolean;
  profile: UserProfile;
  country: CountryOption;
  formatAmount: (amount: number) => string;
  categories: ExpenseCategory[];
  customCategories: string[];
  categoryLimits: Record<string, number>;
  categoryIcons: Record<string, string>;
  addExpense: (draft: ExpenseDraft) => Expense;
  updateExpense: (id: string, changes: ExpenseDraft) => void;
  deleteExpense: (id: string) => void;
  getExpense: (id: string) => Expense | undefined;
  updateProfile: (profile: UserProfile) => void;
  setCountryCode: (countryCode: CountryCode) => void;
  addCategory: (name: string, icon?: string) => boolean;
  renameCategory: (from: string, to: string) => boolean;
  deleteCategory: (name: string) => DeleteCategoryResult;
  setCategoryLimit: (category: string, limit: number | null) => void;
  setCategoryIcon: (category: string, icon: string) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
};

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, dispatch] = useReducer(expenseReducer, []);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [savedExpenses, savedPreferences] = await Promise.all([
        loadExpenses().catch(() => null),
        loadPreferences().catch(() => DEFAULT_PREFERENCES),
      ]);

      if (cancelled) return;

      const rawInitial = savedExpenses ?? (__DEV__ ? createSeedExpenses() : []);
      const initialExpenses = processRecurringExpenses(rawInitial);

      dispatch({ type: 'HYDRATE', expenses: initialExpenses });
      setPreferences(savedPreferences);
      hasLoadedRef.current = true;
      setIsLoading(false);
    }

    void hydrate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) void saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    if (hasLoadedRef.current) void savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    if (hasLoadedRef.current) {
      void checkAndTriggerBudgetNotifications({
        expenses,
        limits: preferences.categoryLimits,
        notifiedThresholds: preferences.notifiedThresholds,
        onThresholdNotified: (key, level) => {
          setPreferences((current) => ({
            ...current,
            notifiedThresholds: { ...current.notifiedThresholds, [key]: level },
          }));
        },
      });
    }
  }, [expenses, preferences.categoryLimits, preferences.notifiedThresholds]);

  const addExpense = useCallback((draft: ExpenseDraft): Expense => {
    const expense: Expense = {
      ...draft,
      id: createId(),
      date: draft.date ?? new Date().toISOString(),
      isRecurring: draft.isRecurring ?? false,
      recurringFrequency: draft.recurringFrequency,
      recurringEndDate: draft.recurringEndDate,
    };
    dispatch({ type: 'ADD_EXPENSE', expense });
    return expense;
  }, []);

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

  const updateProfile = useCallback((profile: UserProfile) => {
    setPreferences((current) => ({ ...current, profile }));
  }, []);

  const setCountryCode = useCallback((countryCode: CountryCode) => {
    setPreferences((current) => ({ ...current, countryCode }));
  }, []);

  const country = useMemo(() => getCountry(preferences.countryCode), [preferences.countryCode]);
  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, country.currencyCode),
    [country.currencyCode]
  );

  const categories = useMemo(() => [
    ...new Set<ExpenseCategory>([
      ...EXPENSE_CATEGORIES,
      ...preferences.customCategories,
      ...expenses.map((expense) => expense.category),
    ]),
  ], [expenses, preferences.customCategories]);

  const addCategory = useCallback((rawName: string, icon?: string): boolean => {
    const name = rawName.trim().slice(0, 28);
    if (!name || categories.some((category) => category.toLowerCase() === name.toLowerCase())) return false;
    setPreferences((current) => ({
      ...current,
      customCategories: [...current.customCategories, name],
      categoryIcons: icon ? { ...current.categoryIcons, [name]: icon } : current.categoryIcons,
    }));
    return true;
  }, [categories]);

  const renameCategory = useCallback((from: string, rawName: string): boolean => {
    const to = rawName.trim().slice(0, 28);
    if (!to || from === to || categories.some((category) => category.toLowerCase() === to.toLowerCase())) return false;
    if (!preferences.customCategories.includes(from)) return false;

    dispatch({ type: 'RENAME_CATEGORY', from, to });
    setPreferences((current) => {
      const nextLimits = { ...current.categoryLimits };
      if (nextLimits[from] !== undefined) {
        nextLimits[to] = nextLimits[from];
        delete nextLimits[from];
      }
      const nextIcons = { ...current.categoryIcons };
      if (nextIcons[from] !== undefined) {
        nextIcons[to] = nextIcons[from];
        delete nextIcons[from];
      }
      return {
        ...current,
        customCategories: current.customCategories.map((category) => category === from ? to : category),
        categoryLimits: nextLimits,
        categoryIcons: nextIcons,
      };
    });
    return true;
  }, [categories, preferences.customCategories]);

  const deleteCategory = useCallback((name: string): DeleteCategoryResult => {
    if (!preferences.customCategories.includes(name)) return 'not-custom';
    if (expenses.some((expense) => expense.category === name)) return 'in-use';
    setPreferences((current) => {
      const categoryLimits = { ...current.categoryLimits };
      delete categoryLimits[name];
      const categoryIcons = { ...current.categoryIcons };
      delete categoryIcons[name];
      return {
        ...current,
        customCategories: current.customCategories.filter((category) => category !== name),
        categoryLimits,
        categoryIcons,
      };
    });
    return 'deleted';
  }, [expenses, preferences.customCategories]);

  const setCategoryLimit = useCallback((category: string, limit: number | null) => {
    setPreferences((current) => {
      const categoryLimits = { ...current.categoryLimits };
      if (limit === null || !Number.isFinite(limit) || limit <= 0) {
        delete categoryLimits[category];
      } else {
        categoryLimits[category] = limit;
      }
      return { ...current, categoryLimits };
    });
  }, []);

  const setCategoryIcon = useCallback((category: string, icon: string) => {
    setPreferences((current) => ({
      ...current,
      categoryIcons: { ...current.categoryIcons, [category]: icon },
    }));
  }, []);

  const setHasCompletedOnboarding = useCallback((completed: boolean) => {
    setPreferences((current) => ({ ...current, hasCompletedOnboarding: completed }));
  }, []);

  const value = useMemo(() => ({
    expenses,
    isLoading,
    profile: preferences.profile,
    country,
    formatAmount,
    categories,
    customCategories: preferences.customCategories,
    categoryLimits: preferences.categoryLimits,
    categoryIcons: preferences.categoryIcons,
    hasCompletedOnboarding: preferences.hasCompletedOnboarding ?? false,
    setHasCompletedOnboarding,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    updateProfile,
    setCountryCode,
    addCategory,
    renameCategory,
    deleteCategory,
    setCategoryLimit,
    setCategoryIcon,
  }), [
    expenses,
    isLoading,
    preferences,
    categories,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    updateProfile,
    setCountryCode,
    country,
    formatAmount,
    addCategory,
    renameCategory,
    deleteCategory,
    setCategoryLimit,
    setCategoryIcon,
    setHasCompletedOnboarding,
  ]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used inside an <ExpenseProvider>');
  return context;
}
