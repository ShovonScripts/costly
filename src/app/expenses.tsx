import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { CategoryChips, type CategoryFilter } from '@/components/category-chips';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { ThemedText } from '@/components/themed-text';
import { useExpenses } from '@/context/expense-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { filterExpenses, sortByDateDesc, sumAmounts } from '@/utils/expense';

export default function ExpensesScreen() {
  const { expenses, categories, formatAmount } = useExpenses();
  const theme = useTheme();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');

  const visible = sortByDateDesc(filterExpenses(expenses, query, category));
  const isFiltering = query.trim().length > 0 || category !== 'All';

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={[styles.searchField, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
          <View style={styles.searchIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[styles.searchLens, { borderColor: theme.textSecondary }]} />
            <View style={[styles.searchHandle, { backgroundColor: theme.textSecondary }]} />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search transactions"
            placeholderTextColor={theme.textSecondary}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search expenses by note, category, or amount"
            style={[styles.search, { color: theme.text }]}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
              style={styles.clearSearch}>
              <ThemedText type="smallBold" themeColor="textSecondary">×</ThemedText>
            </Pressable>
          )}
        </View>
        <CategoryChips value={category} onChange={setCategory} showAll categories={categories} />
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
                {formatAmount(isFiltering ? sumAmounts(visible) : sumAmounts(expenses))}
              </ThemedText>
            </Card>
          )
        }
        ListEmptyComponent={
          expenses.length === 0 ? (
            <EmptyState title="No expenses yet" message="Add your first expense to see it here." />
          ) : (
            <View style={styles.emptyResult}>
              <EmptyState
                title="No expenses found"
                message="Try another search or clear your filters to see all transactions."
              />
              <Pressable
                onPress={() => {
                  setQuery('');
                  setCategory('All');
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.resetButton, { backgroundColor: theme.accentMuted }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>Clear filters</ThemedText>
              </Pressable>
            </View>
          )
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
  searchField: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: Spacing.two,
    position: 'relative',
  },
  searchLens: {
    width: 13,
    height: 13,
    borderWidth: 1.8,
    borderRadius: Radius.pill,
    position: 'absolute',
    left: 1,
    top: 1,
  },
  searchHandle: {
    width: 8,
    height: 1.8,
    borderRadius: Radius.pill,
    position: 'absolute',
    right: 0,
    bottom: 2,
    transform: [{ rotate: '45deg' }],
  },
  search: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  clearSearch: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -Spacing.one,
  },
  emptyResult: {
    alignItems: 'center',
  },
  resetButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -Spacing.two,
  },
  pressed: {
    opacity: 0.72,
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
