import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CategoryChips } from '@/components/category-chips';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseDraft } from '@/types/expense';
import { sumAmounts } from '@/utils/expense';

type ExpenseFormProps = {
  initialValues?: Partial<ExpenseDraft>;
  excludeExpenseId?: string;
  submitLabel: string;
  onSubmit: (draft: ExpenseDraft) => void;
  onCancel?: () => void;
  /** Text shown under the form, e.g. "The date cannot be changed yet." */
  footerNote?: string;
};

const EMPTY_VALUES: ExpenseDraft = {
  amount: 0,
  category: EXPENSE_CATEGORIES[0],
  note: '',
};

export function ExpenseForm({
  initialValues,
  excludeExpenseId,
  submitLabel,
  onSubmit,
  onCancel,
  footerNote,
}: ExpenseFormProps) {
  const theme = useTheme();
  const { expenses, categories, categoryLimits, country, formatAmount } = useExpenses();

  const [amountText, setAmountText] = useState(initialValues?.amount === undefined ? '' : String(initialValues.amount));
  const [date, setDate] = useState(() => initialValues?.date ? new Date(initialValues.date) : new Date());
  const [category, setCategory] = useState<ExpenseCategory>(initialValues?.category ?? EMPTY_VALUES.category);
  const [note, setNote] = useState<string>(initialValues?.note ?? EMPTY_VALUES.note);

  const parsedAmount = amountText.trim() === '' ? null : Number(amountText);
  const isValid = parsedAmount !== null && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const showAmountError = amountText.length > 0 && !isValid;
  const now = new Date();
  const isThisMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  const existingCategorySpend = sumAmounts(expenses.filter((expense) => {
    if (expense.id === excludeExpenseId || expense.category !== category) return false;
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear() === now.getFullYear() && expenseDate.getMonth() === now.getMonth();
  }));
  const projectedCategorySpend = existingCategorySpend + (parsedAmount ?? 0);
  const categoryLimit = categoryLimits[category];
  const budgetNotice = isThisMonth && isValid && categoryLimit !== undefined
    ? projectedCategorySpend > categoryLimit
      ? `Heads up: this would put ${formatAmount(projectedCategorySpend - categoryLimit)} over your ${category} limit.`
      : projectedCategorySpend / categoryLimit >= 0.8
        ? projectedCategorySpend === categoryLimit
          ? `Heads up: this will use your full ${category} limit.`
          : `Heads up: this would use ${Math.round((projectedCategorySpend / categoryLimit) * 100)}% of your ${category} limit, with ${formatAmount(categoryLimit - projectedCategorySpend)} left.`
        : null
    : null;

  const handleSubmit = () => {
    if (!isValid || parsedAmount === null) {
      return;
    }
    onSubmit({ amount: parsedAmount, category, note: note.trim(), date: date.toISOString() });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.container}>
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">
              AMOUNT
            </ThemedText>
            <View
              style={[
                styles.amountField,
                { borderColor: theme.border, backgroundColor: theme.cardMuted },
              ]}>
              <ThemedText type="hero" style={styles.currency}>
                {country.symbol.trim()}
              </ThemedText>
              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                accessibilityLabel={`Expense amount in ${country.currencyCode}`}
                accessibilityHint="Enter an amount greater than zero"
                returnKeyType="done"
                style={[styles.amountInput, { color: theme.text }]}
              />
            </View>
            {showAmountError && (
              <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
                Enter a valid amount greater than zero.
              </ThemedText>
            )}
          </View>

          <DatePicker value={date} onChange={setDate} />

          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">
              CATEGORY
            </ThemedText>
            {/* `showAll` is off here, so the callback only ever gets real categories. */}
            <CategoryChips
              categories={categories}
              value={category}
              onChange={(next) => {
                if (next !== 'All') {
                  setCategory(next);
                }
              }}
            />
            {budgetNotice && (
              <ThemedText
                type="caption"
                accessibilityLiveRegion="polite"
                style={{ color: categoryLimit !== undefined && projectedCategorySpend > categoryLimit ? theme.danger : '#BD7119' }}>
                {budgetNotice}
              </ThemedText>
            )}
          </View>

          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">
              NOTE
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What was it for?"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, styles.noteInput, { borderColor: theme.border, color: theme.text }]}
            />
          </View>

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

          {footerNote && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.footerNote}>
              {footerNote}
            </ThemedText>
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
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  currency: {
    fontSize: 24,
    lineHeight: 30,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 600,
    fontVariant: ['tabular-nums'],
    paddingVertical: Spacing.one,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  noteInput: {
    minHeight: Spacing.six * 2,
    textAlignVertical: 'top',
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
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
    paddingVertical: Spacing.three,
  },
  footerNote: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
