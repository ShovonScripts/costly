import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { sumAmounts } from '@/utils/expense';
import { getBudgetInsights } from '@/utils/advisor';

export default function BudgetsScreen() {
  const theme = useTheme();
  const { expenses, categories, categoryLimits, setCategoryLimit, formatAmount } = useExpenses();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const now = new Date();
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(now);
  const insights = getBudgetInsights(expenses, categoryLimits, now);

  const spentThisMonth = (category: string) => sumAmounts(expenses.filter((expense) => {
    const date = new Date(expense.date);
    return expense.category === category && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }));

  const saveLimit = (category: string) => {
    const raw = (drafts[category] ?? (categoryLimits[category] === undefined ? '' : String(categoryLimits[category]))).trim();
    const amount = raw ? Number(raw) : null;
    if (amount === null || !Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a monthly limit greater than zero.');
      return;
    }
    setCategoryLimit(category, amount);
    setDrafts((current) => ({ ...current, [category]: String(amount) }));
    setMessage(`${category} limit saved for ${monthLabel}.`);
  };

  const removeLimit = (category: string) => {
    setCategoryLimit(category, null);
    setDrafts((current) => ({ ...current, [category]: '' }));
    setMessage(`${category} limit removed.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Category limits</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Set a monthly spending cap for any category. Limits are saved on this device.
          </ThemedText>
        </View>

        <Card style={{ ...styles.summary, backgroundColor: theme.accentMuted }}>
          <ThemedText type="caption" themeColor="textSecondary">SPENT THIS MONTH</ThemedText>
          <ThemedText type="subtitle" style={styles.summaryAmount}>{formatAmount(sumAmounts(expenses.filter((expense) => {
            const date = new Date(expense.date);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          })))}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{monthLabel}</ThemedText>
        </Card>

        {message ? <ThemedText type="caption" themeColor="textSecondary" accessibilityLiveRegion="polite">{message}</ThemedText> : null}

        {categories.map((category) => {
          const limit = categoryLimits[category];
          const draft = drafts[category] ?? (limit === undefined ? '' : String(limit));
          const spent = spentThisMonth(category);
          const isOver = limit !== undefined && spent > limit;
          const notice = insights.find((insight) => insight.category === category);
          const progress = limit ? Math.min(spent / limit, 1) : 0;
          const accent = isOver ? theme.danger : getCategoryColor(category);
          return (
            <Card key={category} style={styles.categoryCard}>
              <View style={styles.categoryHeading}>
                <View style={[styles.dot, { backgroundColor: getCategoryColor(category) }]} />
                <ThemedText type="defaultBold" style={styles.categoryName}>{category}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">{formatAmount(spent)} spent</ThemedText>
              </View>
              {limit !== undefined && (
                <View style={styles.progressBlock}>
                  <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
                  </View>
                  <ThemedText type="caption" themeColor={isOver ? 'danger' : 'textSecondary'}>
                    {isOver ? `${formatAmount(spent - limit)} over limit` : `${formatAmount(limit - spent)} remaining · ${formatAmount(limit)} limit`}
                  </ThemedText>
                </View>
              )}
              {notice && (
                <ThemedText type="caption" style={[styles.budgetNotice, { color: notice.level === 'over' ? theme.danger : notice.level === 'near' ? '#BD7119' : theme.accent }]}>
                  {notice.level === 'over'
                    ? `Over limit by ${formatAmount(Math.abs(notice.remaining))}.`
                    : notice.level === 'near'
                      ? `${Math.round(notice.percentUsed * 100)}% used · ${formatAmount(Math.max(0, notice.remaining))} left.`
                      : `At this pace, month-end spending may reach ${formatAmount(notice.projectedSpend)}.`}
                </ThemedText>
              )}
              <View style={styles.limitEntry}>
                <View style={[styles.moneyInput, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
                  <ThemedText type="small" themeColor="textSecondary">৳</ThemedText>
                  <TextInput
                    value={draft}
                    onChangeText={(value) => { setDrafts((current) => ({ ...current, [category]: value.replace(/[^0-9.]/g, '') })); setMessage(''); }}
                    placeholder="Monthly limit"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    accessibilityLabel={`${category} monthly spending limit in taka`}
                    style={[styles.limitInput, { color: theme.text }]}
                  />
                </View>
                <Pressable
                  onPress={() => saveLimit(category)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.saveText}>Save</ThemedText>
                </Pressable>
                {limit !== undefined && (
                  <Pressable
                    onPress={() => removeLimit(category)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${category} monthly limit`}
                    hitSlop={6}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}>
                    <ThemedText type="smallBold" themeColor="danger">×</ThemedText>
                  </Pressable>
                )}
              </View>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one, marginBottom: Spacing.one },
  title: { fontSize: 30, lineHeight: 36 },
  summary: { gap: Spacing.one, borderWidth: 0 },
  summaryAmount: { fontSize: 28, lineHeight: 36 },
  categoryCard: { gap: Spacing.three },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  categoryName: { flex: 1 },
  progressBlock: { gap: Spacing.one },
  budgetNotice: { fontWeight: '700' },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  limitEntry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  moneyInput: { flex: 1, minWidth: 0, minHeight: 46, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.two },
  limitInput: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: Spacing.two },
  saveButton: { minHeight: 44, borderRadius: Radius.medium, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.three },
  saveText: { color: '#FFFFFF' },
  removeButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
