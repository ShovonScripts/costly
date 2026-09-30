import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryColor } from '@/constants/categories';
import { useExpenses } from '@/context/expense-context';
import { Radius, Spacing } from '@/constants/theme';
import type { Expense } from '@/types/expense';
import { formatDate } from '@/utils/expense';
import { router } from 'expo-router';

type ExpenseListItemProps = {
  expense: Expense;
  onPress?: () => void;
};

export function ExpenseListItem({ expense, onPress }: ExpenseListItemProps) {
  const { formatAmount } = useExpenses();
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({ pathname: '/expense/[id]', params: { id: expense.id } });
  };

  const accent = getCategoryColor(expense.category);
  const title = expense.note || expense.category;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${expense.category}, ${formatAmount(expense.amount)}, ${formatDate(expense.date)}`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={[styles.rail, { backgroundColor: accent }]} />

      <View style={styles.details}>
        <ThemedText type="defaultBold" numberOfLines={1}>
          {title}
        </ThemedText>
        <View style={styles.metaRow}>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {expense.category}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.metaDot} />
          <ThemedText type="caption" themeColor="textSecondary">
            {formatDate(expense.date)}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="defaultBold" style={styles.amount} numberOfLines={1}>
        {formatAmount(expense.amount)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 76,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
  rail: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: Spacing.five,
    borderRadius: Radius.pill,
  },
  details: {
    flex: 1,
    gap: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: Radius.pill,
  },
  amount: {
    textAlign: 'right',
  },
});
