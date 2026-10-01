import type { Expense } from '@/types/expense';

/**
 * Checks recurring expense templates and automatically generates due instances
 * up to the current date without duplicating existing ones.
 */
export function processRecurringExpenses(expenses: Expense[]): Expense[] {
  const now = new Date();
  const existingExpenses = [...expenses];
  const templates = existingExpenses.filter((e) => e.isRecurring && !e.recurringParentId);

  let newInstancesAdded = false;
  const addedInstances: Expense[] = [];

  for (const template of templates) {
    if (!template.recurringFrequency) continue;
    const startDate = new Date(template.date);
    if (Number.isNaN(startDate.getTime())) continue;

    const endDate = template.recurringEndDate ? new Date(template.recurringEndDate) : now;
    const freq = template.recurringFrequency;

    let current = new Date(startDate);
    current = advanceDate(current, freq);

    while (current <= now && current <= endDate) {
      const dateIso = current.toISOString();
      const periodKey = getPeriodKey(current, freq);

      const exists = existingExpenses.some((e) => {
        if (e.recurringParentId !== template.id) return false;
        const eDate = new Date(e.date);
        return getPeriodKey(eDate, freq) === periodKey;
      });

      if (!exists) {
        const newId = `rec-${template.id}-${periodKey}`;
        if (!addedInstances.some((a) => a.id === newId)) {
          addedInstances.push({
            id: newId,
            amount: template.amount,
            category: template.category,
            date: dateIso,
            note: template.note ? `${template.note} (Recurring)` : 'Recurring expense',
            recurringParentId: template.id,
          });
          newInstancesAdded = true;
        }
      }

      current = advanceDate(current, freq);
    }
  }

  if (!newInstancesAdded) {
    return existingExpenses;
  }

  return [...addedInstances, ...existingExpenses];
}

function advanceDate(date: Date, freq: 'weekly' | 'monthly' | 'yearly'): Date {
  const next = new Date(date);
  if (freq === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (freq === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (freq === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

function getPeriodKey(date: Date, freq: 'weekly' | 'monthly' | 'yearly'): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (freq === 'weekly') {
    return `${y}-W${Math.ceil(Number(d) / 7)}-${m}`;
  }
  if (freq === 'monthly') {
    return `${y}-${m}`;
  }
  return `${y}`;
}
