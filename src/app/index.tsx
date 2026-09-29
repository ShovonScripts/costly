import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { SummaryCard } from '@/components/summary-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import { formatCurrency, sortByDateDesc, sumAmounts, totalForDate, totalForMonth } from '@/utils/expense';

const RECENT_LIMIT = 5;

export default function DashboardScreen() {
  const { expenses } = useExpenses();
  const theme = useTheme();
  const now = new Date();

  const recent = sortByDateDesc(expenses).slice(0, RECENT_LIMIT);
  const hasExpenses = expenses.length > 0;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Dashboard</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {hasExpenses
              ? `${expenses.length} ${expenses.length === 1 ? 'expense' : 'expenses'} tracked`
              : 'Nothing tracked yet'}
          </ThemedText>
        </View>

        <ThemedView type="card" style={styles.hero}>
          <ThemedText type="caption" themeColor="textSecondary">
            TOTAL SPENT
          </ThemedText>
          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(sumAmounts(expenses))}
          </ThemedText>
        </ThemedView>

        <View style={styles.summaryRow}>
          <SummaryCard label="Today" value={formatCurrency(totalForDate(expenses, now))} />
          <SummaryCard label="This month" value={formatCurrency(totalForMonth(expenses, now))} />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Recent</ThemedText>
          {hasExpenses && (
            <ThemedText
              type="smallBold"
              style={{ color: theme.accent }}
              onPress={() => router.push('/expenses')}>
              See all
            </ThemedText>
          )}
        </View>

        <Card padded={false}>
          {recent.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              message="Tap Add to record your first expense."
              tone={theme.accent}
            />
          ) : (
            recent.map((expense, index) => (
              <View key={expense.id}>
                {index > 0 && <CardDivider />}
                <ExpenseListItem expense={expense} />
              </View>
            ))
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.half,
  },
  hero: {
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  heroValue: {
    fontVariant: ['tabular-nums'],
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
});