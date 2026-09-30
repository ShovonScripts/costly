import { useLocalSearchParams, router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ExpenseForm } from '@/components/expense-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useExpenses } from '@/context/expense-context';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getExpense, updateExpense } = useExpenses();

  const expense = getExpense(id);

  if (!expense) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Not found</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.notFoundText}>
          This expense no longer exists.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ExpenseForm
      excludeExpenseId={expense.id}
      initialValues={{ amount: expense.amount, category: expense.category, note: expense.note, date: expense.date }}
      submitLabel="Save changes"
      onCancel={() => router.back()}
      onSubmit={(draft) => {
        updateExpense(expense.id, draft);
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  notFoundText: {
    textAlign: 'center',
  },
});
