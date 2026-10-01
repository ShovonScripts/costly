import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { CategoryBreakdown } from '@/components/category-breakdown';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryColor } from '@/constants/categories';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useDebts } from '@/context/debt-context';
import { useTheme } from '@/hooks/use-theme';
import { sortByDateDesc, sumAmounts, totalForDate, totalForMonth } from '@/utils/expense';
import type { Expense } from '@/types/expense';
import { getBudgetInsights, type BudgetInsight } from '@/utils/advisor';

const RECENT_LIMIT = 5;

type DaySpend = {
  date: Date;
  label: string;
  amount: number;
};

function getWeekSpending(expenses: Expense[], today: Date): DaySpend[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(12, 0, 0, 0);
    return {
      date,
      label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
      amount: totalForDate(expenses, date),
    };
  });
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function WeeklySpending({ expenses, today, formatAmount }: { expenses: Expense[]; today: Date; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const days = getWeekSpending(expenses, today);
  const maxAmount = Math.max(...days.map((day) => day.amount), 1);
  const weeklyTotal = days.reduce((total, day) => total + day.amount, 0);

  return (
    <Card style={styles.weekCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">This week</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Your spending, day by day
          </ThemedText>
        </View>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          {formatAmount(weeklyTotal)}
        </ThemedText>
      </View>

      <View
        style={styles.chart}
        accessible
        accessibilityLabel={`Spending over the last seven days totals ${formatAmount(weeklyTotal)}`}>
        {days.map((day) => {
          const isToday = day.date.toDateString() === today.toDateString();
          const barHeight = day.amount > 0 ? Math.max(8, (day.amount / maxAmount) * 74) : 5;
          return (
            <View
              key={day.date.toISOString()}
              style={styles.chartColumn}
              accessible
              accessibilityLabel={`${new Intl.DateTimeFormat('en', { weekday: 'long' }).format(day.date)}: ${formatAmount(day.amount)}`}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isToday ? theme.accent : theme.accentMuted,
                    },
                  ]}
                />
              </View>
              <ThemedText
                type="caption"
                themeColor={isToday ? 'text' : 'textSecondary'}
                style={isToday ? styles.todayLabel : undefined}>
                {day.label}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function BudgetOverview({
  expenses,
  limits,
  formatAmount,
}: {
  expenses: Expense[];
  limits: Record<string, number>;
  formatAmount: (amount: number) => string;
}) {
  const theme = useTheme();
  const entries = Object.entries(limits).sort(([first], [second]) => first.localeCompare(second));

  return (
    <Card style={styles.budgetCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">Category limits</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Monthly guardrails</ThemedText>
        </View>
        <Pressable onPress={() => router.push('/budgets')} accessibilityRole="button" hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Manage  →</ThemedText>
        </Pressable>
      </View>
      {entries.length === 0 ? (
        <Pressable
          onPress={() => router.push('/budgets')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.budgetEmpty, { backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>＋  Set your first category limit</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">A little structure can make spending clearer.</ThemedText>
        </Pressable>
      ) : (
        entries.slice(0, 3).map(([category, limit]) => {
          const now = new Date();
          const spent = sumAmounts(expenses.filter((expense) => {
            const date = new Date(expense.date);
            return expense.category === category && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }));
          const fraction = Math.min(spent / limit, 1);
          const over = spent > limit;
          const accent = over ? theme.danger : getCategoryColor(category);
          return (
            <View key={category} style={styles.budgetRow}>
              <View style={styles.budgetLabelRow}>
                <View style={[styles.budgetDot, { backgroundColor: accent }]} />
                <ThemedText type="smallBold" style={styles.budgetCategory}>{category}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatAmount(spent)} / {formatAmount(limit)}
                </ThemedText>
              </View>
              <View style={[styles.budgetTrack, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.budgetFill, { width: `${fraction * 100}%`, backgroundColor: accent }]} />
              </View>
              <ThemedText type="caption" themeColor={over ? 'danger' : 'textSecondary'}>
                {over ? `${formatAmount(spent - limit)} over limit` : `${formatAmount(limit - spent)} left`}
              </ThemedText>
            </View>
          );
        })
      )}
    </Card>
  );
}

function MoneyOverview({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const { debts } = useDebts();
  const activeDebts = debts.filter((d) => d.status === 'active');
  const youAreOwed = activeDebts.filter((d) => d.type === 'lent').reduce((sum, d) => sum + d.amount, 0);
  const youOwe = activeDebts.filter((d) => d.type === 'borrowed').reduce((sum, d) => sum + d.amount, 0);
  const net = youAreOwed - youOwe;

  return (
    <Card style={styles.budgetCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">Money Overview</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Active debts balance</ThemedText>
        </View>
        <Pressable onPress={() => router.push('/debts')} accessibilityRole="button" hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>View debts  →</ThemedText>
        </Pressable>
      </View>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCol}>
          <ThemedText type="caption" themeColor="textSecondary">YOU ARE OWED</ThemedText>
          <ThemedText type="smallBold" style={{ color: '#27AE60' }}>{formatAmount(youAreOwed)}</ThemedText>
        </View>
        <View style={styles.summaryCol}>
          <ThemedText type="caption" themeColor="textSecondary">YOU OWE</ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.danger }}>{formatAmount(youOwe)}</ThemedText>
        </View>
        <View style={styles.summaryCol}>
          <ThemedText type="caption" themeColor="textSecondary">NET</ThemedText>
          <ThemedText type="smallBold" style={{ color: net >= 0 ? '#27AE60' : theme.danger }}>
            {net >= 0 ? `+${formatAmount(net)}` : formatAmount(net)}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

function SpendingAdvisor({
  expenses,
  limits,
  formatAmount,
}: {
  expenses: Expense[];
  limits: Record<string, number>;
  formatAmount: (amount: number) => string;
}) {
  const theme = useTheme();
  const allInsights = getBudgetInsights(expenses, limits);
  const insights = allInsights.slice(0, 2);
  const hasLimits = Object.keys(limits).length > 0;

  return (
    <Card style={styles.advisorCard}>
      <View style={styles.advisorHeading}>
        <View style={styles.advisorIcon}><ThemedText type="defaultBold" style={{ color: theme.accent }}>✦</ThemedText></View>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">Spending advisor</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">A helpful check-in for this month</ThemedText>
        </View>
        {allInsights.length > 0 && (
          <View style={[styles.noticeCount, { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>{allInsights.length}</ThemedText>
          </View>
        )}
      </View>

      {!hasLimits ? (
        <ThemedText type="small" themeColor="textSecondary">
          Set a category limit to get early heads-ups before you go over.
        </ThemedText>
      ) : insights.length === 0 ? (
        <View style={styles.advisorStatus}>
          <ThemedText type="smallBold" style={{ color: '#21835B' }}>✓  You’re on track</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">All category limits are currently below the heads-up point.</ThemedText>
        </View>
      ) : (
        <View style={styles.insightList}>
          {insights.map((insight) => <InsightLine key={insight.category} insight={insight} formatAmount={formatAmount} />)}
          {allInsights.length > insights.length && (
            <ThemedText type="caption" themeColor="textSecondary">
              + {allInsights.length - insights.length} more {allInsights.length - insights.length === 1 ? 'notice' : 'notices'} in your advisor.
            </ThemedText>
          )}
        </View>
      )}

      <View style={[styles.advisorActions, { borderTopColor: theme.border }]}>
        <Pressable onPress={() => router.push('/advisor')} accessibilityRole="button" style={({ pressed }) => [styles.advisorAction, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Open advisor  →</ThemedText>
        </Pressable>
        <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />
        <Pressable onPress={() => router.push('/reports')} accessibilityRole="button" style={({ pressed }) => [styles.advisorAction, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Monthly report  ↗</ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

function InsightLine({ insight, formatAmount }: { insight: BudgetInsight; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const isOver = insight.level === 'over';
  const color = isOver ? theme.danger : insight.level === 'near' ? '#BD7119' : theme.accent;
  const title = insight.level === 'over'
    ? `${insight.category} is over its limit`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? `${insight.category} limit reached` : `${insight.category} is close to its limit`
      : `${insight.category} is trending over budget`;
  const detail = insight.level === 'over'
    ? `${formatAmount(Math.abs(insight.remaining))} over this month’s limit.`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? 'No budget left in this category this month.' : `${formatAmount(insight.remaining)} left · ${Math.round(insight.percentUsed * 100)}% used.`
      : `At this pace, spending may reach ${formatAmount(insight.projectedSpend)} this month.`;

  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightMarker, { backgroundColor: color }]} />
      <View style={styles.insightCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { expenses, profile, categoryLimits, formatAmount } = useExpenses();
  const theme = useTheme();
  const now = new Date();
  const monthSpend = totalForMonth(expenses, now);
  const todaySpend = totalForDate(expenses, now);
  const recent = sortByDateDesc(expenses).slice(0, RECENT_LIMIT);
  const monthExpenseCount = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(now);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.greeting}>
          <View style={styles.greetingCopy}>
            <ThemedText type="subtitle" style={styles.greetingTitle}>
              {getGreeting(now.getHours())}{profile.name.trim() ? `, ${profile.name.trim().split(/\s+/)[0]}` : ''}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}
            </ThemedText>
          </View>
        </View>

        <ThemedView type="card" style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>MONTHLY SPENDING</ThemedText>
              <View style={styles.monthPill}>
                <ThemedText type="caption" style={styles.monthPillText}>{monthLabel}</ThemedText>
              </View>
            </View>
            <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(monthSpend)}
            </ThemedText>
            <ThemedText type="small" style={styles.heroSubtext}>
              {monthExpenseCount === 0
                ? 'Your month starts here. Add your first expense.'
                : `${monthExpenseCount} ${monthExpenseCount === 1 ? 'expense' : 'expenses'} recorded this month`}
            </ThemedText>
            <Pressable
              onPress={() => router.push('/add-expense')}
              accessibilityRole="button"
              accessibilityLabel="Add an expense"
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <ThemedText type="defaultBold" style={styles.addButtonText}>＋  Add expense</ThemedText>
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
        </ThemedView>

        <View style={styles.summaryRow}>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: theme.accentMuted }]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>↗</ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">SPENT TODAY</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(todaySpend)}
            </ThemedText>
          </Card>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: theme.accentMuted }]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>#</ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">ALL TIME</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(sumAmounts(expenses))}
            </ThemedText>
          </Card>
        </View>

        <MoneyOverview formatAmount={formatAmount} />
        <SpendingAdvisor expenses={expenses} limits={categoryLimits} formatAmount={formatAmount} />
        <WeeklySpending expenses={expenses} today={now} formatAmount={formatAmount} />
        <CategoryBreakdown expenses={expenses} formatAmount={formatAmount} />
        <BudgetOverview expenses={expenses} limits={categoryLimits} formatAmount={formatAmount} />

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="defaultBold">Recent activity</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Your latest transactions</ThemedText>
          </View>
          {expenses.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/expenses')}
              hitSlop={10}
              style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>See all  →</ThemedText>
            </Pressable>
          )}
        </View>

        <Card padded={false}>
          {recent.length === 0 ? (
            <EmptyState
              title="A fresh start"
              message="Add your first expense and it will show up here."
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
        <ThemedText type="caption" themeColor="textSecondary" style={styles.footer}>
          Small steps make a clearer picture.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexGrow: 1, paddingBottom: Spacing.four },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  greeting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingCopy: { gap: Spacing.one },
  greetingTitle: { fontSize: 28, lineHeight: 34 },
  hero: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    minHeight: 222,
    justifyContent: 'center',
  },
  heroContent: { gap: Spacing.two, zIndex: 1 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroLabel: { color: 'rgba(255,255,255,0.72)', letterSpacing: 1 },
  monthPill: { borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  monthPillText: { color: '#FFFFFF' },
  heroValue: { color: '#FFFFFF', fontSize: 38, lineHeight: 46, fontVariant: ['tabular-nums'] },
  heroSubtext: { color: 'rgba(255,255,255,0.75)' },
  addButton: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.one },
  addButtonText: { color: Brand.deep },
  heroOrbLarge: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -90, top: -100, backgroundColor: 'rgba(139,123,255,0.2)' },
  heroOrbSmall: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: 14, bottom: -90, backgroundColor: 'rgba(176,76,252,0.2)' },
  summaryRow: { flexDirection: 'row', gap: Spacing.three },
  metricCard: { flex: 1, gap: Spacing.one, minWidth: 0 },
  metricIcon: { width: 30, height: 30, borderRadius: Radius.small, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  metricValue: { fontSize: 18, lineHeight: 25, fontVariant: ['tabular-nums'] },
  advisorCard: { gap: Spacing.three },
  advisorHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  advisorIcon: { width: 36, height: 36, borderRadius: Radius.medium, backgroundColor: 'rgba(139,123,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  noticeCount: { width: 26, height: 26, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  advisorStatus: { gap: Spacing.one },
  insightList: { gap: Spacing.three },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  insightMarker: { width: 8, height: 8, borderRadius: Radius.pill, marginTop: 6 },
  insightCopy: { flex: 1, gap: Spacing.one },
  advisorActions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two },
  advisorAction: { flex: 1, minHeight: 40, justifyContent: 'center' },
  actionDivider: { width: StyleSheet.hairlineWidth, height: 20, marginHorizontal: Spacing.two },
  weekCard: { gap: Spacing.three },
  budgetCard: { gap: Spacing.three },
  budgetEmpty: { gap: Spacing.one, borderRadius: Radius.medium, padding: Spacing.three },
  budgetRow: { gap: Spacing.two },
  budgetLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  budgetDot: { width: 8, height: 8, borderRadius: Radius.pill },
  budgetCategory: { flex: 1 },
  budgetTrack: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: Radius.pill },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  summaryCol: { flex: 1, gap: Spacing.half },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  sectionTitleCopy: { gap: Spacing.one },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.two, minHeight: 112 },
  chartColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.one, minWidth: 0 },
  barTrack: { height: 74, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 16, maxWidth: '72%', borderRadius: Radius.pill },
  todayLabel: { fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
  seeAll: { paddingVertical: Spacing.two, paddingLeft: Spacing.two },
  footer: { textAlign: 'center', paddingTop: Spacing.one },
  pressed: { opacity: 0.72 },
});
