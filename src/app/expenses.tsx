import { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { CategoryChips, type CategoryFilter } from '@/components/category-chips';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { ThemedText } from '@/components/themed-text';
import { useExpenses } from '@/context/expense-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { filterExpenses, formatCurrency, sortByDateDesc, sumAmounts } from '@/utils/expense';

export default function ExpensesScreen() {
  const { expenses } = useExpenses();
  const theme = useTheme();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');

  const visible = sortByDateDesc(filterExpenses(expenses, query, category));
  const isFiltering = query.trim().length > 0 || category !== 'All';

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search note, category or amount"
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          style={[styles.search, { borderColor: theme.border, color: theme.text }]}
        />

        <CategoryChips value={category} onChange={setCategory} showAll />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(expense) => expense.id}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
          expenses.length === 0 ? null : (
            <Card style={styles.headerCard}>
              <ThemedText type="caption" themeColor="textSecondary">
                {isFiltering
                  ? `${visible.length} OF ${expenses.length} EXPENSES`
                  : `${expenses.length} ${expenses.length === 1 ? 'EXPENSE' : 'EXPENSES'}`}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.headerValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(isFiltering ? sumAmounts(visible) : sumAmounts(expenses))}
              </ThemedText>
            </Card>
          )
        }
        ListEmptyComponent={
          expenses.length === 0 ? (
            <EmptyState title="No expenses yet" message="Add your first expense to see it here." />
          ) : (
            <EmptyState
              title="No expenses found."
              message="Try a different search or category."
            />
          )
        }
        renderItem={({ item }) => <ExpenseListItem expense={item} />}
        ItemSeparatorComponent={() => <CardDivider />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  toolbar: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  contentContainer: {
    flexGrow: 1,
    padding: Spacing.four,
    paddingTop: Spacing.three,
  },
  headerCard: {
    borderRadius: Radius.medium,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  headerValue: {
    fontVariant: ['tabular-nums'],
  },
});
