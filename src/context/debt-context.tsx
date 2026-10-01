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

import type { DebtRecord, DebtDraft } from '@/types/debt';
import { loadDebts, saveDebts } from '@/storage/debt-storage';

type DebtAction =
  | { type: 'HYDRATE'; debts: DebtRecord[] }
  | { type: 'ADD_DEBT'; debt: DebtRecord }
  | { type: 'UPDATE_DEBT'; id: string; changes: DebtDraft }
  | { type: 'DELETE_DEBT'; id: string }
  | { type: 'SETTLE_DEBT'; id: string; settledDate: string };

function debtReducer(state: DebtRecord[], action: DebtAction): DebtRecord[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.debts;
    case 'ADD_DEBT':
      return [action.debt, ...state];
    case 'UPDATE_DEBT':
      return state.map((debt) =>
        debt.id === action.id
          ? {
              ...debt,
              ...action.changes,
              date: action.changes.date ?? debt.date,
              dueDate: action.changes.dueDate !== undefined ? action.changes.dueDate : debt.dueDate,
            }
          : debt
      );
    case 'DELETE_DEBT':
      return state.filter((debt) => debt.id !== action.id);
    case 'SETTLE_DEBT':
      return state.map((debt) =>
        debt.id === action.id
          ? { ...debt, status: 'settled', settledDate: action.settledDate }
          : debt
      );
    default:
      return state;
  }
}

let debtIdCounter = 0;

function createDebtId(): string {
  debtIdCounter += 1;
  return `debt-${Date.now().toString(36)}-${debtIdCounter}`;
}

type DebtContextValue = {
  debts: DebtRecord[];
  isLoading: boolean;
  addDebt: (draft: DebtDraft) => DebtRecord;
  updateDebt: (id: string, changes: DebtDraft) => void;
  deleteDebt: (id: string) => void;
  settleDebt: (id: string) => void;
  getDebt: (id: string) => DebtRecord | undefined;
};

const DebtContext = createContext<DebtContextValue | undefined>(undefined);

export function DebtProvider({ children }: { children: ReactNode }) {
  const [debts, dispatch] = useReducer(debtReducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const savedDebts = await loadDebts().catch(() => null);
      if (cancelled) return;

      const initialDebts = savedDebts ?? [];
      dispatch({ type: 'HYDRATE', debts: initialDebts });
      hasLoadedRef.current = true;
      setIsLoading(false);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) void saveDebts(debts);
  }, [debts]);

  const addDebt = useCallback((draft: DebtDraft): DebtRecord => {
    const debt: DebtRecord = {
      ...draft,
      id: createDebtId(),
      date: draft.date ?? new Date().toISOString(),
      dueDate: draft.dueDate ?? null,
      status: 'active',
      settledDate: null,
    };
    dispatch({ type: 'ADD_DEBT', debt });
    return debt;
  }, []);

  const updateDebt = useCallback((id: string, changes: DebtDraft) => {
    dispatch({ type: 'UPDATE_DEBT', id, changes });
  }, []);

  const deleteDebt = useCallback((id: string) => {
    dispatch({ type: 'DELETE_DEBT', id });
  }, []);

  const settleDebt = useCallback((id: string) => {
    const settledDate = new Date().toISOString();
    dispatch({ type: 'SETTLE_DEBT', id, settledDate });
  }, []);

  const getDebt = useCallback(
    (id: string) => debts.find((debt) => debt.id === id),
    [debts]
  );

  const value = useMemo(
    () => ({
      debts,
      isLoading,
      addDebt,
      updateDebt,
      deleteDebt,
      settleDebt,
      getDebt,
    }),
    [debts, isLoading, addDebt, updateDebt, deleteDebt, settleDebt, getDebt]
  );

  return <DebtContext.Provider value={value}>{children}</DebtContext.Provider>;
}

export function useDebts(): DebtContextValue {
  const context = useContext(DebtContext);
  if (!context) throw new Error('useDebts must be used inside a <DebtProvider>');
  return context;
}
