import { router } from 'expo-router';

import { ExpenseForm } from '@/components/expense-form';
import { useExpenses } from '@/context/expense-context';

export default function AddExpenseScreen() {
  const { addExpense } = useExpenses();

  return (
    <ExpenseForm
      submitLabel="Save expense"
      onCancel={() => router.back()}
      onSubmit={(draft) => {
        addExpense(draft);
        router.back();
      }}
    />
  );
}
