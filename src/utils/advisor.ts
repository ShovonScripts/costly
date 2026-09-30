import type { Expense } from '@/types/expense';
import { sumAmounts } from '@/utils/expense';

export type BudgetNoticeLevel = 'over' | 'near' | 'pace';

export type BudgetInsight = {
  category: string;
  level: BudgetNoticeLevel;
  spent: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  projectedSpend: number;
};

function isInMonth(isoDate: string, month: Date): boolean {
  const date = new Date(isoDate);
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

export function getCategoryMonthlySpend(expenses: Expense[], category: string, month: Date): number {
  return sumAmounts(expenses.filter((expense) => expense.category === category && isInMonth(expense.date, month)));
}

/** Rule-based, explainable budget nudges. Projection alerts only apply to the current month. */
export function getBudgetInsights(
  expenses: Expense[],
  limits: Record<string, number>,
  month: Date = new Date()
): BudgetInsight[] {
  const today = new Date();
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;

  return Object.entries(limits)
    .map(([category, limit]) => {
      const spent = getCategoryMonthlySpend(expenses, category, month);
      const percentUsed = limit > 0 ? spent / limit : 0;
      const projectedSpend = daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : spent;
      let level: BudgetNoticeLevel | null = null;

      if (spent > limit) level = 'over';
      else if (percentUsed >= 0.8) level = 'near';
      else if (isCurrentMonth && daysElapsed >= 5 && projectedSpend > limit) level = 'pace';

      return level ? { category, level, spent, limit, remaining: limit - spent, percentUsed, projectedSpend } : null;
    })
    .filter((insight): insight is BudgetInsight => insight !== null)
    .sort((first, second) => {
      const priority = { over: 0, near: 1, pace: 2 } satisfies Record<BudgetNoticeLevel, number>;
      return priority[first.level] - priority[second.level] || second.percentUsed - first.percentUsed;
    });
}

export function getMonthExpenses(expenses: Expense[], month: Date): Expense[] {
  return expenses
    .filter((expense) => isInMonth(expense.date, month))
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
}
