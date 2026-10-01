import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DebtRecord } from '@/types/debt';

export const DEBT_STORAGE_KEY = '@costly/debts';

function isDebtRecord(value: unknown): value is DebtRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<DebtRecord>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.personName === 'string' &&
    candidate.personName.trim().length > 0 &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    (candidate.type === 'lent' || candidate.type === 'borrowed') &&
    typeof candidate.date === 'string' &&
    !Number.isNaN(new Date(candidate.date).getTime()) &&
    (candidate.status === 'active' || candidate.status === 'settled') &&
    typeof candidate.note === 'string'
  );
}

export async function loadDebts(): Promise<DebtRecord[] | null> {
  const raw = await AsyncStorage.getItem(DEBT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isDebtRecord)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveDebts(debts: DebtRecord[]): Promise<void> {
  await AsyncStorage.setItem(DEBT_STORAGE_KEY, JSON.stringify(debts));
}
