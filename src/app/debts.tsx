import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { useDebts } from '@/context/debt-context';
import { useExpenses } from '@/context/expense-context';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';
import type { DebtRecord } from '@/types/debt';

type FilterType = 'Active' | 'All' | 'Settled' | 'Lent' | 'Borrowed';

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

  const getCount = (f: FilterType) => {
    if (f === 'Active') return debts.filter((d) => d.status === 'active').length;
    if (f === 'Settled') return debts.filter((d) => d.status === 'settled').length;
    if (f === 'Lent') return debts.filter((d) => d.type === 'lent').length;
    if (f === 'Borrowed') return debts.filter((d) => d.type === 'borrowed').length;
    return debts.length;
  };

  const filters: FilterType[] = ['Active', 'All', 'Settled', 'Lent', 'Borrowed'];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Signature Costly Brand Purple Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>MONEY OVERVIEW</ThemedText>
              <Pressable
                onPress={() => router.push('/debts/add')}
                accessibilityRole="button"
                accessibilityLabel="Add debt"
                style={({ pressed }) => [styles.quickAddButton, pressed && styles.pressed]}>
                <ThemedText type="defaultBold" style={styles.quickAddText}>＋ Add debt</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroSummaryRow}>
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>YOU ARE OWED</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(youAreOwed)}
                </ThemedText>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>YOU OWE</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(youOwe)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.heroNetRow}>
              <ThemedText type="small" style={styles.heroNetText}>
                Net Position: <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>{net >= 0 ? `+${formatAmount(net)} (Credit)` : `${formatAmount(net)} (Debit)`}</ThemedText>
              </ThemedText>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
        </View>

        {/* Filter Pills with Counts */}
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
                  {f} ({getCount(f)})
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

  const initials = debt.personName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/debts/[id]', params: { id: debt.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Debt with ${debt.personName}, ${formatAmount(debt.amount)}`}
      style={({ pressed }) => [
        styles.debtCard,
        {
          backgroundColor: theme.card,
          borderColor: isLent ? 'rgba(39, 174, 96, 0.3)' : 'rgba(255, 107, 107, 0.3)',
          borderLeftWidth: 4,
          borderLeftColor: isLent ? '#27AE60' : theme.danger,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: isLent ? 'rgba(39, 174, 96, 0.15)' : 'rgba(255, 107, 107, 0.15)' }]}>
          <ThemedText type="smallBold" style={{ color: isLent ? '#27AE60' : theme.danger }}>
            {initials || '👤'}
          </ThemedText>
        </View>
        <View style={styles.personInfo}>
          <ThemedText type="defaultBold" numberOfLines={1}>{debt.personName}</ThemedText>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: isLent ? 'rgba(39, 174, 96, 0.15)' : 'rgba(255, 107, 107, 0.15)' }]}>
              <MaterialCommunityIcons
                name={isLent ? 'arrow-up-right' : 'arrow-down-left'}
                size={12}
                color={isLent ? '#27AE60' : theme.danger}
              />
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
        <View style={styles.footerInfo}>
          <MaterialCommunityIcons name="calendar-outline" size={13} color={theme.textSecondary} />
          <ThemedText type="caption" themeColor="textSecondary">
            {isSettled && debt.settledDate ? `Settled: ${formatDate(debt.settledDate)}` : debt.dueDate ? `Due: ${formatDate(debt.dueDate)}` : `Date: ${formatDate(debt.date)}`}
          </ThemedText>
        </View>
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
  hero: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'center',
  },
  heroContent: { gap: Spacing.two, zIndex: 1 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroLabel: { color: 'rgba(255,255,255,0.72)', letterSpacing: 1 },
  quickAddButton: { backgroundColor: '#FFFFFF', borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  quickAddText: { color: Brand.deep },
  heroSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginVertical: Spacing.one },
  heroStat: { flex: 1, gap: Spacing.half },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  heroStatVal: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontVariant: ['tabular-nums'] },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroNetRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: Spacing.two },
  heroNetText: { color: 'rgba(255,255,255,0.8)' },
  heroOrbLarge: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -90, top: -100, backgroundColor: 'rgba(139,123,255,0.2)' },
  heroOrbSmall: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: 14, bottom: -90, backgroundColor: 'rgba(176,76,252,0.2)' },
  filterScroll: { gap: Spacing.two, paddingVertical: Spacing.one },
  filterChip: { height: 38, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  debtCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.two, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  avatar: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  personInfo: { flex: 1, gap: Spacing.half },
  badges: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.small },
  amount: { fontSize: 20, lineHeight: 26, fontVariant: ['tabular-nums'] },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.04)', paddingTop: Spacing.two },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  note: { flex: 1, textAlign: 'right' },
  pressed: { opacity: 0.75 },
});
