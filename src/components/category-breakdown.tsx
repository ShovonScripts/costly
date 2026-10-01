import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sumAmounts } from '@/utils/expense';
import type { Expense } from '@/types/expense';

export function CategoryBreakdown({
  expenses,
  formatAmount,
}: {
  expenses: Expense[];
  formatAmount: (amount: number) => string;
}) {
  const theme = useTheme();
  const now = new Date();
  const monthExpenses = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const totalMonthSpend = sumAmounts(monthExpenses);

  const categoryTotals = new Map<string, number>();
  monthExpenses.forEach((expense) => {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
  });

  const sortedCategories = [...categoryTotals.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 5);

  if (monthExpenses.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <ThemedText type="defaultBold">Category breakdown</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Where your money went this month</ThemedText>
        </View>
      </View>

      <View style={styles.list}>
        {sortedCategories.map(([category, amount]) => {
          const percentage = totalMonthSpend > 0 ? (amount / totalMonthSpend) * 100 : 0;
          const color = getCategoryColor(category);

          return (
            <View key={category} style={styles.row}>
              <View style={styles.labelRow}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <ThemedText type="smallBold" style={styles.categoryName}>{category}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatAmount(amount)} ({Math.round(percentage)}%)
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.fill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copy: { gap: Spacing.one },
  list: { gap: Spacing.two },
  row: { gap: Spacing.one },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: Radius.pill },
  categoryName: { flex: 1 },
  track: { height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
