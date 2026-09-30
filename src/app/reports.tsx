import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { getBudgetInsights, getMonthExpenses } from '@/utils/advisor';
import { formatDate, sumAmounts } from '@/utils/expense';
import { buildMonthlyReportHtml } from '@/utils/monthly-report';
import { DEMO_REPORT_EXPENSES, DEMO_REPORT_LIMITS, DEMO_REPORT_MONTH } from '@/data/demo-report';

function sameMonth(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
}

export default function ReportsScreen() {
  const theme = useTheme();
  const { expenses, categoryLimits, profile, country, formatAmount } = useExpenses();
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1, 12);
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showingDemo, setShowingDemo] = useState(false);
  const [message, setMessage] = useState('');
  const reportExpenses = showingDemo ? DEMO_REPORT_EXPENSES : expenses;
  const reportLimits = showingDemo ? DEMO_REPORT_LIMITS : categoryLimits;
  const monthExpenses = getMonthExpenses(reportExpenses, month);
  const total = sumAmounts(monthExpenses);
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month);
  const isCurrentMonth = sameMonth(month, new Date());
  const categoryTotals = new Map<string, number>();
  monthExpenses.forEach((expense) => categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount));
  const categoriesUsed = [...categoryTotals.entries()].sort((first, second) => second[1] - first[1]);
  const categories = [...new Set([...categoryTotals.keys(), ...Object.keys(reportLimits)])]
    .map((category) => [category, categoryTotals.get(category) ?? 0] as const)
    .sort((first, second) => second[1] - first[1]);
  const budgetInsights = getBudgetInsights(reportExpenses, reportLimits, month);
  const overBudgetCount = budgetInsights.filter((insight) => insight.level === 'over').length;

  const changeMonth = (amount: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));
    setMessage('');
  };

  const toggleDemo = () => {
    const next = !showingDemo;
    setShowingDemo(next);
    const today = new Date();
    setMonth(next ? new Date(DEMO_REPORT_MONTH) : new Date(today.getFullYear(), today.getMonth(), 1, 12));
    setMessage('');
  };

  const createPdf = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setMessage('');
    try {
      const html = buildMonthlyReportHtml({
        month,
        expenses: reportExpenses,
        limits: reportLimits,
        name: showingDemo ? 'Demo account' : profile.name,
        countryName: country.name,
        currencyCode: country.currencyCode,
        formatAmount,
      });

      if (Platform.OS === 'web') {
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) throw new Error('The report window was blocked.');
        reportWindow.document.open();
        reportWindow.document.write(html);
        reportWindow.document.close();
        reportWindow.focus();
        window.setTimeout(() => reportWindow.print(), 500);
        setMessage('Your print-ready report opened in a new tab. Choose “Save as PDF” to download it.');
      } else {
        const { uri } = await Print.printToFileAsync({ html, margins: { top: 40, right: 36, bottom: 40, left: 36 } });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: `Costly ${monthLabel} report`,
          });
          setMessage('Your PDF is ready. Choose where to save or share it.');
        } else {
          await Print.printAsync({ html });
          setMessage('Your report is ready in the system print dialog.');
        }
      }
    } catch {
      setMessage('Could not create the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>YOUR SPENDING, MADE CLEAR</ThemedText>
          <ThemedText type="subtitle" style={styles.title}>Monthly reports</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Review a month, understand the patterns, and keep a copy.</ThemedText>
        </View>

        <Card style={styles.monthSelector}>
          <Pressable onPress={() => changeMonth(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={[styles.monthArrow, { backgroundColor: theme.cardMuted }]}>
            <ThemedText type="subtitle" style={styles.arrowText}>‹</ThemedText>
          </Pressable>
          <View style={styles.monthLabelBlock}>
            <ThemedText type="defaultBold" style={styles.monthLabel}>{monthLabel}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">{isCurrentMonth ? 'Month to date' : 'Full month'}</ThemedText>
          </View>
          <Pressable
            onPress={() => changeMonth(1)}
            disabled={isCurrentMonth}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled: isCurrentMonth }}
            style={[styles.monthArrow, { backgroundColor: theme.cardMuted }, isCurrentMonth && styles.disabled]}>
            <ThemedText type="subtitle" style={styles.arrowText}>›</ThemedText>
          </Pressable>
        </Card>

        {__DEV__ && (
          <Pressable
            onPress={toggleDemo}
            accessibilityRole="button"
            style={({ pressed }) => [styles.demoToggle, { backgroundColor: theme.accentMuted }, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {showingDemo ? 'Exit sample preview' : 'Preview one-month demo data'}
            </ThemedText>
          </Pressable>
        )}
        {showingDemo && (
          <Card style={styles.demoNotice}>
            <ThemedText type="smallBold">Sample report preview</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Fictional September transactions and category limits. This sample is never added to or saved with your real expenses.
            </ThemedText>
          </Card>
        )}

        <Card style={styles.hero}>
          <ThemedText type="caption" style={styles.heroLabel}>TOTAL SPENT</ThemedText>
          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>{formatAmount(total)}</ThemedText>
          <View style={styles.heroFooter}>
            <ThemedText type="small" style={styles.heroDetail}>{monthExpenses.length} {monthExpenses.length === 1 ? 'expense' : 'expenses'}</ThemedText>
            <View style={styles.heroDot} />
            <ThemedText type="small" style={styles.heroDetail}>{categoriesUsed.length} {categoriesUsed.length === 1 ? 'category' : 'categories'}</ThemedText>
            {overBudgetCount > 0 && <><View style={styles.heroDot} /><ThemedText type="small" style={styles.heroOver}>{overBudgetCount} over limit</ThemedText></>}
          </View>
        </Card>

        <Pressable
          onPress={createPdf}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="Download monthly report as PDF"
          accessibilityState={{ disabled: isGenerating }}
          style={({ pressed }) => [styles.pdfButton, { backgroundColor: theme.accent }, pressed && styles.pressed, isGenerating && styles.disabled]}>
          {isGenerating ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText type="defaultBold" style={styles.pdfIcon}>↓</ThemedText>}
          <View style={styles.pdfCopy}>
            <ThemedText type="defaultBold" style={styles.pdfTitle}>{isGenerating ? 'Preparing your PDF…' : 'Download monthly PDF'}</ThemedText>
            <ThemedText type="caption" style={styles.pdfSubtext}>{Platform.OS === 'web' ? 'Print dialog · choose Save as PDF' : 'Save to Files or share a copy'}</ThemedText>
          </View>
          {!isGenerating && <ThemedText type="defaultBold" style={styles.pdfArrow}>→</ThemedText>}
        </Pressable>
        {message ? <ThemedText type="caption" themeColor={message.startsWith('Could not') ? 'danger' : 'textSecondary'} accessibilityLiveRegion="polite">{message}</ThemedText> : null}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <ThemedText type="defaultBold">Category breakdown</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Current category limits are shown for context.</ThemedText>
          </View>
          <Pressable onPress={() => router.push('/budgets')} accessibilityRole="button" hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>Limits</ThemedText>
          </Pressable>
        </View>

        {categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText type="defaultBold">Nothing recorded for {monthLabel}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>Choose another month or add an expense to start building your report.</ThemedText>
          </Card>
        ) : (
          <Card style={styles.breakdownCard}>
            {categories.map(([category, amount], index) => {
              const limit = reportLimits[category];
              const fraction = limit ? Math.min(amount / limit, 1) : amount / Math.max(total, 1);
              const over = limit !== undefined && amount > limit;
              const color = over ? theme.danger : getCategoryColor(category);
              return (
                <View key={category} style={styles.categoryItem}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.categoryLine}>
                    <View style={[styles.categoryDot, { backgroundColor: color }]} />
                    <ThemedText type="smallBold" style={styles.categoryName}>{category}</ThemedText>
                    <ThemedText type="smallBold">{formatAmount(amount)}</ThemedText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.progressFill, { width: `${Math.max(fraction * 100, 3)}%`, backgroundColor: color }]} />
                  </View>
                  {limit !== undefined && (
                    <ThemedText type="caption" themeColor={over ? 'danger' : 'textSecondary'}>
                      {over ? `${formatAmount(amount - limit)} over current limit` : `${formatAmount(limit - amount)} under current limit`}
                    </ThemedText>
                  )}
                </View>
              );
            })}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <ThemedText type="defaultBold">Transactions in this report</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">{monthExpenses.length} included in the PDF.</ThemedText>
          </View>
          <Pressable onPress={() => router.push('/expenses')} accessibilityRole="button" hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>All expenses</ThemedText>
          </Pressable>
        </View>
        {monthExpenses.length > 0 ? (
          <Card style={styles.transactionCard}>
            {monthExpenses.slice(0, 5).map((expense, index) => (
              <View key={expense.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                <View style={styles.transactionRow}>
                  <View style={styles.transactionCopy}>
                    <ThemedText type="smallBold" numberOfLines={1}>{expense.note || expense.category}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">{formatDate(expense.date)} · {expense.category}</ThemedText>
                  </View>
                  <ThemedText type="smallBold">{formatAmount(expense.amount)}</ThemedText>
                </View>
              </View>
            ))}
            {monthExpenses.length > 5 && <ThemedText type="caption" themeColor="textSecondary" style={styles.moreTransactions}>+ {monthExpenses.length - 5} more included in the PDF</ThemedText>}
          </Card>
        ) : <Card style={styles.emptyCard}><ThemedText type="small" themeColor="textSecondary">No transactions for this month.</ThemedText></Card>}

        <ThemedText type="caption" themeColor="textSecondary" style={styles.footer}>
          Monthly report data is generated on your device. Historical comparisons use the category limits currently saved in Costly.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  eyebrow: { letterSpacing: 1, fontWeight: '700' },
  title: { fontSize: 30, lineHeight: 36 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, padding: Spacing.two },
  monthArrow: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 28, lineHeight: 34 },
  monthLabelBlock: { flex: 1, alignItems: 'center', gap: Spacing.one },
  monthLabel: { fontSize: 18 },
  demoToggle: { minHeight: 42, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: Spacing.three, borderRadius: Radius.pill },
  demoNotice: { gap: Spacing.one, borderRadius: Radius.medium },
  hero: { backgroundColor: '#100D6F', borderWidth: 0, borderRadius: Radius.xlarge, padding: Spacing.four, gap: Spacing.one },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroValue: { color: '#FFFFFF', fontSize: 38, lineHeight: 46, fontVariant: ['tabular-nums'] },
  heroFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  heroDetail: { color: 'rgba(255,255,255,0.8)' },
  heroDot: { width: 4, height: 4, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.6)' },
  heroOver: { color: '#FFC0C0', fontWeight: '700' },
  pdfButton: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  pdfIcon: { width: 34, height: 34, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.18)', textAlign: 'center', textAlignVertical: 'center', color: '#FFFFFF', fontSize: 23, lineHeight: 34 },
  pdfCopy: { flex: 1, gap: Spacing.one },
  pdfTitle: { color: '#FFFFFF' },
  pdfSubtext: { color: 'rgba(255,255,255,0.78)' },
  pdfArrow: { color: '#FFFFFF' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.one },
  sectionCopy: { flex: 1, gap: Spacing.one },
  breakdownCard: { gap: Spacing.three },
  categoryItem: { gap: Spacing.two },
  categoryLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  categoryDot: { width: 9, height: 9, borderRadius: Radius.pill },
  categoryName: { flex: 1 },
  progressTrack: { height: 7, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: Spacing.three },
  transactionCard: { gap: Spacing.two },
  transactionRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  transactionCopy: { flex: 1, minWidth: 0, gap: Spacing.one },
  moreTransactions: { textAlign: 'center', paddingTop: Spacing.one },
  emptyCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  emptyText: { textAlign: 'center', maxWidth: 420 },
  footer: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.two },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
