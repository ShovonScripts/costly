import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CategoryChips } from '@/components/category-chips';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseDraft } from '@/types/expense';
import { CURRENCY_SYMBOL } from '@/utils/expense';

type ExpenseFormProps = {
  initialValues?: Partial<ExpenseDraft>;
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
  submitLabel,
  onSubmit,
  onCancel,
  footerNote,
}: ExpenseFormProps) {
  const theme = useTheme();

  const [amount, setAmount] = useState<number | null>(initialValues?.amount ?? null);
  const [category, setCategory] = useState<ExpenseCategory>(initialValues?.category ?? EMPTY_VALUES.category);
  const [note, setNote] = useState<string>(initialValues?.note ?? EMPTY_VALUES.note);

  const isValid = amount !== null && Number.isFinite(amount) && amount > 0;

  const handleSubmit = () => {
    if (!isValid) {
      return;
    }
    onSubmit({ amount, category, note: note.trim() });
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
                {CURRENCY_SYMBOL}
              </ThemedText>
              <TextInput
                value={amount === null ? '' : String(amount)}
                onChangeText={(text) => setAmount(text === '' ? null : Number.parseFloat(text))}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: theme.text }]}
              />
            </View>
            {amount !== null && amount <= 0 && (
              <ThemedText type="caption" themeColor="danger">
                Amount must be greater than zero.
              </ThemedText>
            )}
          </View>

          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">
              CATEGORY
            </ThemedText>
            {/* `showAll` is off here, so the callback only ever gets real categories. */}
            <CategoryChips
              value={category}
              onChange={(next) => {
                if (next !== 'All') {
                  setCategory(next);
                }
              }}
            />
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
