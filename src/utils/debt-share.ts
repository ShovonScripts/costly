import { Share } from 'react-native';

import type { DebtRecord } from '@/types/debt';
import { formatDate } from '@/utils/expense';

export async function shareDebtReminder(debt: DebtRecord, formatAmount: (amount: number) => string): Promise<void> {
  const formattedAmount = formatAmount(debt.amount);
  const dueString = debt.dueDate ? ` The due date is ${formatDate(debt.dueDate)}.` : '';

  const message = debt.type === 'lent'
    ? `Hi ${debt.personName}, just a friendly reminder regarding the ${formattedAmount} that I lent you.${dueString} Thanks!`
    : `Hi ${debt.personName}, just a reminder regarding the ${formattedAmount} that I borrowed from you.${dueString} Thanks!`;

  try {
    await Share.share({
      message,
      title: `Debt reminder for ${debt.personName}`,
    });
  } catch {
    // Ignore share cancellation/errors
  }
}
