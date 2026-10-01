import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDebts } from '@/context/debt-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DebtType } from '@/types/debt';

export default function EditDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDebt, updateDebt } = useDebts();
  const theme = useTheme();

  const debt = getDebt(id);

  const [personName, setPersonName] = useState(() => debt?.personName ?? '');
  const [amountText, setAmountText] = useState(() => debt?.amount !== undefined ? String(debt.amount) : '');
  const [type, setType] = useState<DebtType>(() => debt?.type ?? 'lent');
  const [date, setDate] = useState(() => debt?.date ? new Date(debt.date) : new Date());
  const [hasDueDate, setHasDueDate] = useState(() => Boolean(debt?.dueDate));
  const [dueDate, setDueDate] = useState(() => debt?.dueDate ? new Date(debt.dueDate) : new Date());
  const [note, setNote] = useState(() => debt?.note ?? '');
  const [error, setError] = useState('');

  if (!debt) {
    return (
      <ThemedView style={styles.notFound}>
        <ThemedText type="subtitle">Not found</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.notFoundText}>
          This debt record no longer exists.
        </ThemedText>
        <Pressable onPress={() => router.back()} style={styles.primaryButton}>
          <ThemedText type="defaultBold">Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const parsedAmount = amountText.trim() === '' ? NaN : Number(amountText);
  const isValid =
    personName.trim().length > 0 &&
    !Number.isNaN(parsedAmount) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const handleSave = () => {
    if (!isValid) {
      setError('Please provide a valid person name and an amount greater than zero.');
      return;
    }

    updateDebt(debt.id, {
      personName: personName.trim().slice(0, 50),
      amount: parsedAmount,
      type,
      date: date.toISOString(),
      dueDate: hasDueDate ? dueDate.toISOString() : null,
      note: note.trim().slice(0, 200),
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.container}>
          {/* Type Selector */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">TRANSACTION TYPE</ThemedText>
            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setType('lent')}
                accessibilityRole="button"
                accessibilityState={{ selected: type === 'lent' }}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: type === 'lent' ? 'rgba(39, 174, 96, 0.15)' : theme.cardMuted,
                    borderColor: type === 'lent' ? '#27AE60' : theme.border,
                  },
                ]}>
                <ThemedText type="defaultBold" style={{ color: type === 'lent' ? '#27AE60' : theme.textSecondary }}>
                  I Lent Money
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setType('borrowed')}
                accessibilityRole="button"
                accessibilityState={{ selected: type === 'borrowed' }}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: type === 'borrowed' ? 'rgba(200, 37, 44, 0.12)' : theme.cardMuted,
                    borderColor: type === 'borrowed' ? theme.danger : theme.border,
                  },
                ]}>
                <ThemedText type="defaultBold" style={{ color: type === 'borrowed' ? theme.danger : theme.textSecondary }}>
                  I Borrowed Money
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Person Name */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">PERSON NAME</ThemedText>
            <TextInput
              value={personName}
              onChangeText={(v) => { setPersonName(v); setError(''); }}
              placeholder="e.g. Rahim"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">AMOUNT</ThemedText>
            <TextInput
              value={amountText}
              onChangeText={(v) => { setAmountText(v.replace(/[^0-9.]/g, '')); setError(''); }}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, styles.amountInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">TRANSACTION DATE</ThemedText>
            <DatePicker value={date} onChange={setDate} />
          </View>

          {/* Due Date Option */}
          <View style={styles.field}>
            <View style={styles.dueDateHeader}>
              <ThemedText type="caption" themeColor="textSecondary">DUE DATE (OPTIONAL)</ThemedText>
              <Pressable
                onPress={() => setHasDueDate(!hasDueDate)}
                style={[styles.toggleBadge, { backgroundColor: hasDueDate ? theme.accent : theme.cardMuted, borderColor: theme.border }]}>
                <ThemedText type="smallBold" style={{ color: hasDueDate ? '#FFFFFF' : theme.textSecondary }}>
                  {hasDueDate ? 'ENABLED' : 'NONE'}
                </ThemedText>
              </Pressable>
            </View>
            {hasDueDate && <DatePicker value={dueDate} onChange={setDueDate} />}
          </View>

          {/* Note */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">NOTE (OPTIONAL)</ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What was this for?"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, styles.noteInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {error ? <ThemedText type="caption" themeColor="danger">{error}</ThemedText> : null}

          <Pressable
            onPress={handleSave}
            disabled={!isValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid }}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
              !isValid && styles.saveButtonDisabled,
            ]}>
            <ThemedText type="defaultBold" style={styles.saveText}>Save Changes</ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" themeColor="textSecondary">Cancel</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contentContainer: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  field: { gap: Spacing.one },
  typeRow: { flexDirection: 'row', gap: Spacing.two },
  typeButton: { flex: 1, height: 50, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  amountInput: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  dueDateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleBadge: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.half, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth },
  saveButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.three, borderRadius: Radius.medium, marginTop: Spacing.two },
  saveButtonDisabled: { opacity: 0.4 },
  saveText: { color: '#FFFFFF' },
  cancelButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
  notFound: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.two, justifyContent: 'center' },
  notFoundText: { textAlign: 'center' },
  primaryButton: { alignSelf: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Radius.medium, backgroundColor: '#4A3CEE' },
});
