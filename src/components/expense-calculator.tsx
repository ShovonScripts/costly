import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ExpenseCategoryGrid } from '@/components/expense-category-grid';
import { DatePicker } from '@/components/date-picker';
import { ReceiptAttachment } from '@/components/receipt-attachment';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseDraft, type RecurringFrequency } from '@/types/expense';
import { sumAmounts } from '@/utils/expense';

type ExpenseCalculatorProps = {
  initialValues?: Partial<ExpenseDraft>;
  excludeExpenseId?: string;
  submitLabel: string;
  onSubmit: (draft: ExpenseDraft) => void;
  onCancel?: () => void;
  footerNote?: string;
};

const EMPTY_VALUES: ExpenseDraft = {
  amount: 0,
  category: EXPENSE_CATEGORIES[0],
  note: '',
  isRecurring: false,
  recurringFrequency: 'monthly',
  receiptUri: undefined,
};

function evaluateExpression(expr: string): number {
  let clean = expr.trim();
  while (clean.endsWith('+') || clean.endsWith('-') || clean.endsWith('.')) {
    clean = clean.slice(0, -1).trim();
  }
  if (!clean) return 0;

  const tokens = clean.match(/(\d+(?:\.\d+)?|\+|\-)/g);
  if (!tokens || tokens.length === 0) return 0;

  let total = parseFloat(tokens[0]);
  if (Number.isNaN(total)) return 0;

  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const nextVal = parseFloat(tokens[i + 1]);
    if (Number.isNaN(nextVal)) break;
    if (op === '+') {
      total += nextVal;
    } else if (op === '-') {
      total -= nextVal;
    }
  }
  return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
}

export function ExpenseCalculator({
  initialValues,
  excludeExpenseId,
  submitLabel,
  onSubmit,
  onCancel,
  footerNote,
}: ExpenseCalculatorProps) {
  const theme = useTheme();
  const { expenses, categories, categoryLimits, country, formatAmount } = useExpenses();

  const [expression, setExpression] = useState<string>(
    initialValues?.amount !== undefined ? String(initialValues.amount) : '0'
  );
  const [evaluated, setEvaluated] = useState<boolean>(true);
  const [date, setDate] = useState(() => (initialValues?.date ? new Date(initialValues.date) : new Date()));
  const [category, setCategory] = useState<ExpenseCategory>(initialValues?.category ?? EMPTY_VALUES.category);
  const [note, setNote] = useState<string>(initialValues?.note ?? EMPTY_VALUES.note);
  const [isRecurring, setIsRecurring] = useState<boolean>(initialValues?.isRecurring ?? false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>(
    initialValues?.recurringFrequency ?? 'monthly'
  );
  const [receiptUri, setReceiptUri] = useState<string | undefined>(initialValues?.receiptUri);

  const calculatedAmount = evaluateExpression(expression);
  const isValid = Number.isFinite(calculatedAmount) && calculatedAmount > 0;

  const now = new Date();
  const isThisMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  const existingCategorySpend = sumAmounts(
    expenses.filter((expense) => {
      if (expense.id === excludeExpenseId || expense.category !== category) return false;
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === now.getFullYear() && expenseDate.getMonth() === now.getMonth();
    })
  );
  const projectedCategorySpend = existingCategorySpend + (isValid ? calculatedAmount : 0);
  const categoryLimit = categoryLimits[category];
  const budgetNotice =
    isThisMonth && isValid && categoryLimit !== undefined
      ? projectedCategorySpend > categoryLimit
        ? `Over limit by ${formatAmount(projectedCategorySpend - categoryLimit)}`
        : projectedCategorySpend / categoryLimit >= 0.8
          ? `${Math.round((projectedCategorySpend / categoryLimit) * 100)}% of limit used`
          : null
      : null;

  const handleKeyPress = (key: string) => {
    if (key === 'Today') {
      setDate(new Date());
      return;
    }
    if (key === '⌫') {
      setExpression((curr) => {
        if (curr.length <= 1) return '0';
        return curr.slice(0, -1);
      });
      setEvaluated(false);
      return;
    }
    if (key === '=') {
      const val = evaluateExpression(expression);
      setExpression(String(val));
      setEvaluated(true);
      return;
    }
    if (key === '+' || key === '-') {
      setEvaluated(false);
      setExpression((curr) => {
        const trimmed = curr.trim();
        if (trimmed.endsWith('+') || trimmed.endsWith('-')) {
          return trimmed.slice(0, -1) + ` ${key} `;
        }
        return `${curr} ${key} `;
      });
      return;
    }

    // Digits and decimal
    setExpression((curr) => {
      if (evaluated) {
        if (key === '.') return '0.';
        return key;
      }
      if (curr === '0' && key !== '.') {
        return key;
      }
      if (key === '.') {
        const parts = curr.split(/[\+\-]/);
        const currentSegment = parts[parts.length - 1];
        if (currentSegment.includes('.')) {
          return curr;
        }
      }
      return curr + key;
    });
    setEvaluated(false);
  };

  const handleSubmit = () => {
    const finalAmount = evaluateExpression(expression);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) return;
    onSubmit({
      amount: finalAmount,
      category,
      note: note.trim(),
      date: date.toISOString(),
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      receiptUri,
    });
  };

  const keypadRows = [
    ['7', '8', '9', '⌫'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '-'],
    ['0', '.', 'Today', '='],
  ];

  const frequencies: RecurringFrequency[] = ['weekly', 'monthly', 'yearly'];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.container}>
          {/* 1. Date Picker (First) */}
          <DatePicker value={date} onChange={setDate} />

          {/* 2. Compact Category Grid (Second) */}
          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
              CATEGORY
            </ThemedText>
            <ExpenseCategoryGrid categories={categories} value={category} onChange={setCategory} />
          </View>

          {/* 3. Calculator Display & Keypad (Third - Amount) */}
          <View style={styles.section}>
            <View style={styles.displayHeaderRow}>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
                AMOUNT / EXPRESSION
              </ThemedText>
              {budgetNotice && (
                <ThemedText
                  type="caption"
                  style={{ color: categoryLimit !== undefined && projectedCategorySpend > categoryLimit ? theme.danger : '#BD7119' }}>
                  {budgetNotice}
                </ThemedText>
              )}
            </View>
            <View style={[styles.displayCard, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
              <ThemedText type="defaultBold" style={[styles.expressionText, { color: theme.textSecondary }]} numberOfLines={1}>
                {expression}
              </ThemedText>
              <View style={styles.resultRow}>
                <ThemedText type="hero" style={[styles.currencySymbol, { color: theme.accent }]}>
                  {country.symbol.trim()}
                </ThemedText>
                <ThemedText type="hero" style={[styles.resultAmount, { color: theme.text }]} numberOfLines={1}>
                  {formatAmount(calculatedAmount).replace(country.symbol, '').trim()}
                </ThemedText>
              </View>
            </View>

            {/* Calculator Keypad */}
            <View style={styles.keypadContainer}>
              {keypadRows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.keypadRow}>
                  {row.map((key) => {
                    const isAction = key === '+' || key === '-' || key === '=' || key === 'Today' || key === '⌫';
                    const isEquals = key === '=';
                    const isToday = key === 'Today';

                    return (
                      <Pressable
                        key={key}
                        onPress={() => handleKeyPress(key)}
                        accessibilityRole="button"
                        accessibilityLabel={`Key ${key}`}
                        style={({ pressed }) => [
                          styles.keyButton,
                          { backgroundColor: isEquals ? theme.accent : isToday || isAction ? theme.cardMuted : theme.card },
                          { borderColor: theme.border },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText
                          type={isAction ? 'defaultBold' : 'subtitle'}
                          style={[
                            styles.keyText,
                            isEquals && { color: '#FFFFFF' },
                            isToday && { color: theme.accent, fontSize: 13 },
                          ]}>
                          {key}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* 4. Note / Memo (Fourth) */}
          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
              NOTE / MEMO (OPTIONAL)
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What was it for?"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* 5. Recurring Options */}
          <View style={styles.section}>
            <View style={styles.recurringHeader}>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
                RECURRING EXPENSE
              </ThemedText>
              <Pressable
                onPress={() => setIsRecurring(!isRecurring)}
                accessibilityRole="button"
                style={[
                  styles.toggleBadge,
                  { backgroundColor: isRecurring ? theme.accent : theme.cardMuted, borderColor: theme.border },
                ]}>
                <ThemedText type="smallBold" style={{ color: isRecurring ? '#FFFFFF' : theme.textSecondary }}>
                  {isRecurring ? 'ON' : 'OFF'}
                </ThemedText>
              </Pressable>
            </View>
            {isRecurring && (
              <View style={styles.frequencyRow}>
                {frequencies.map((freq) => {
                  const selected = recurringFrequency === freq;
                  return (
                    <Pressable
                      key={freq}
                      onPress={() => setRecurringFrequency(freq)}
                      accessibilityRole="button"
                      style={[
                        styles.frequencyChip,
                        {
                          backgroundColor: selected ? `${theme.accent}22` : theme.cardMuted,
                          borderColor: selected ? theme.accent : theme.border,
                        },
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: selected ? theme.accent : theme.textSecondary, textTransform: 'capitalize' }}>
                        {freq}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* 6. Receipt Photo Attachment */}
          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionLabel}>
              RECEIPT PHOTO
            </ThemedText>
            <ReceiptAttachment receiptUri={receiptUri} onChange={setReceiptUri} />
          </View>

          {/* 7. Save Action */}
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid }}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
              !isValid && styles.saveButtonDisabled,
            ]}>
            <ThemedText type="defaultBold" style={styles.saveButtonText}>
              {submitLabel}
            </ThemedText>
          </Pressable>

          {onCancel && (
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
              <ThemedText type="defaultBold" themeColor="textSecondary">
                Cancel
              </ThemedText>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  displayCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 2,
    marginTop: Spacing.half,
  },
  displayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.half,
  },
  expressionText: {
    fontSize: 14,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  currencySymbol: {
    fontSize: 22,
    lineHeight: 28,
  },
  resultAmount: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  section: {
    gap: Spacing.one,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    height: 48,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  frequencyChip: {
    flex: 1,
    height: 40,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadContainer: {
    gap: 6,
    marginTop: Spacing.two,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 6,
  },
  keyButton: {
    flex: 1,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 18,
    lineHeight: 24,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    marginTop: Spacing.one,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: '#ffffff',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
