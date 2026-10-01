import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { useDebts } from '@/context/debt-context';
import { useExpenses } from '@/context/expense-context';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';
import type { DebtRecord } from '@/types/debt';

type FilterType = 'All' | 'Active' | 'Settled' | 'Lent' | 'Borrowed';

export default function DebtsScreen() {
  const theme = useTheme();
  const { debts } = useDebts();
  const { formatAmount } = useExpenses();
  const [filter, setFilter] = useState<FilterType>('Active');

  // Summary calculations (active only)
  const activeDebts = debts.filter((d) => d.status === 'active');
  const youAreOwed = activeDebts
    .filter((d) => d.type === 'lent')
    .reduce((sum, d) => sum + d.amount, 0);
  const youOwe = activeDebts
    .filter((d) => d.type === 'borrowed')
    .reduce((sum, d) => sum + d.amount, 0);
  const net = youAreOwed - youOwe;

  const filteredDebts = debts.filter((debt) => {
    if (filter === 'Active') return debt.status === 'active';
    if (filter === 'Settled') return debt.status === 'settled';
    if (filter === 'Lent') return debt.type === 'lent';
    if (filter === 'Borrowed') return debt.type === 'borrowed';
    return true; // 'All'
  });

  const filters: FilterType[] = ['Active', 'All', 'Settled', 'Lent', 'Borrowed'];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Financial Summary Card */}
        <Card style={styles.summaryCard}>
          <ThemedText type="caption" style={styles.summaryTitle}>MONEY OVERVIEW</ThemedText>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <ThemedText type="caption" themeColor="textSecondary">YOU ARE OWED</ThemedText>
              <ThemedText type="subtitle" style={{ color: '#27AE60' }}>{formatAmount(youAreOwed)}</ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <ThemedText type="caption" themeColor="textSecondary">YOU OWE</ThemedText>
              <ThemedText type="subtitle" style={{ color: theme.danger }}>{formatAmount(youOwe)}</ThemedText>
            </View>
          </View>
          <View style={[styles.netRow, { borderTopColor: theme.border }]}>
            <ThemedText type="smallBold">Net Balance</ThemedText>
            <ThemedText type="defaultBold" style={{ color: net >= 0 ? '#27AE60' : theme.danger }}>
              {net >= 0 ? `+${formatAmount(net)}` : formatAmount(net)}
            </ThemedText>
          </View>
        </Card>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => {
            const selected = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? theme.accent : theme.cardMuted,
                    borderColor: selected ? theme.accent : theme.border,
                  },
                ]}>
                <ThemedText type="smallBold" style={{ color: selected ? '#FFFFFF' : theme.textSecondary }}>
                  {f}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Debt List */}
        <View style={styles.listSection}>
          {filteredDebts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title="No debt records"
                message="Track money you lent or borrowed by tapping the Add button above."
                tone={theme.accent}
              />
            </Card>
          ) : (
            filteredDebts.map((debt) => (
              <DebtCard key={debt.id} debt={debt} formatAmount={formatAmount} />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function DebtCard({ debt, formatAmount }: { debt: DebtRecord; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const isLent = debt.type === 'lent';
  const isSettled = debt.status === 'settled';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/debts/[id]', params: { id: debt.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Debt with ${debt.personName}, ${formatAmount(debt.amount)}`}
      style={({ pressed }) => [
        styles.debtCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardHeader}>
        <View style={styles.personInfo}>
          <ThemedText type="defaultBold" numberOfLines={1}>{debt.personName}</ThemedText>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: isLent ? 'rgba(39, 174, 96, 0.15)' : 'rgba(200, 37, 44, 0.12)' }]}>
              <ThemedText type="caption" style={{ color: isLent ? '#27AE60' : theme.danger, fontWeight: '700' }}>
                {isLent ? 'Lent' : 'Borrowed'}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: isSettled ? theme.cardMuted : theme.accentMuted }]}>
              <ThemedText type="caption" style={{ color: isSettled ? theme.textSecondary : theme.accent, fontWeight: '700' }}>
                {isSettled ? 'Settled' : 'Active'}
              </ThemedText>
            </View>
          </View>
        </View>
        <ThemedText type="subtitle" style={[styles.amount, { color: isLent ? '#27AE60' : theme.danger }]}>
          {formatAmount(debt.amount)}
        </ThemedText>
      </View>

      <View style={styles.cardFooter}>
        <ThemedText type="caption" themeColor="textSecondary">
          {isSettled && debt.settledDate ? `Settled: ${formatDate(debt.settledDate)}` : debt.dueDate ? `Due: ${formatDate(debt.dueDate)}` : `Date: ${formatDate(debt.date)}`}
        </ThemedText>
        {debt.note ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1} style={styles.note}>
            {debt.note}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  summaryCard: { backgroundColor: '#080564', borderWidth: 0, borderRadius: Radius.xlarge, padding: Spacing.four, gap: Spacing.three },
  summaryTitle: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1, fontWeight: '700' },
  summaryGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryItem: { flex: 1, gap: Spacing.half },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 36, marginHorizontal: Spacing.two },
  netRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
  filterScroll: { gap: Spacing.two, paddingVertical: Spacing.one },
  filterChip: { height: 38, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  debtCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.two, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two },
  personInfo: { flex: 1, gap: Spacing.one },
  badges: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.small },
  amount: { fontSize: 20, lineHeight: 26, fontVariant: ['tabular-nums'] },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.04)', paddingTop: Spacing.two },
  note: { flex: 1, textAlign: 'right' },
  pressed: { opacity: 0.75 },
});
