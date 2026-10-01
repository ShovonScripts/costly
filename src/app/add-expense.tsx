import { router } from 'expo-router';

import { ExpenseCalculator } from '@/components/expense-calculator';
import { useExpenses } from '@/context/expense-context';

export default function AddExpenseScreen() {
  const { addExpense } = useExpenses();

  return (
    <ExpenseCalculator
      submitLabel="Save expense"
      onCancel={() => router.back()}
      onSubmit={(draft) => {
        addExpense(draft);
        router.back();
      }}
    />
  );
}
