import { useLocalSearchParams, router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDebts } from '@/context/debt-context';
import { useExpenses } from '@/context/expense-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';
import { shareDebtReminder } from '@/utils/debt-share';

type RowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  wrap?: boolean;
};

function DetailRow({ icon, label, value, wrap = false }: RowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, wrap && styles.rowWrapped]}>
      <View style={styles.labelGroup}>
        <MaterialCommunityIcons name={icon} size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      </View>
      <ThemedText type="defaultBold" style={wrap ? styles.valueWrapped : styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

export default function DebtDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDebt, settleDebt, deleteDebt } = useDebts();
  const { formatAmount } = useExpenses();
  const theme = useTheme();

  const debt = getDebt(id);

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

  const isLent = debt.type === 'lent';
  const isSettled = debt.status === 'settled';

  const handleSettle = () => {
    Alert.alert('Mark as settled?', `Confirm that ${debt.personName}'s debt of ${formatAmount(debt.amount)} has been settled.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark as Settled',
        onPress: () => {
          settleDebt(debt.id);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete debt record?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDebt(debt.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Next-Level Hero Card */}
        <ThemedView
          type="card"
          style={[
            styles.hero,
            {
              backgroundColor: isLent ? 'rgba(39, 174, 96, 0.08)' : 'rgba(200, 37, 44, 0.08)',
              borderColor: isLent ? '#27AE60' : theme.danger,
              borderWidth: 1,
            },
          ]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIconBadge, { backgroundColor: isLent ? '#27AE60' : theme.danger }]}>
              <MaterialCommunityIcons name={isLent ? 'arrow-up-right' : 'arrow-down-left'} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.heroTopCopy}>
              <ThemedText type="caption" themeColor="textSecondary">
                {isLent ? 'MONEY LENT TO' : 'MONEY BORROWED FROM'}
              </ThemedText>
              <ThemedText type="subtitle">{debt.personName}</ThemedText>
            </View>
          </View>

          <ThemedText type="hero" style={[styles.heroValue, { color: isLent ? '#27AE60' : theme.danger }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(debt.amount)}
          </ThemedText>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isLent ? 'rgba(39, 174, 96, 0.18)' : 'rgba(200, 37, 44, 0.15)' }]}>
              <ThemedText type="caption" style={{ color: isLent ? '#27AE60' : theme.danger, fontWeight: '700' }}>
                {isLent ? 'Lent Transaction' : 'Borrowed Transaction'}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: isSettled ? theme.cardMuted : theme.accentMuted }]}>
              <ThemedText type="caption" style={{ color: isSettled ? theme.textSecondary : theme.accent, fontWeight: '700' }}>
                {isSettled ? '✓ Settled' : '● Active'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Details Card */}
        <Card padded={false} style={styles.detailsCard}>
          <View style={styles.padded}>
            <DetailRow icon="account-outline" label="Person Name" value={debt.personName} />
          </View>
          <CardDivider />
          <View style={styles.padded}>
            <DetailRow icon="calendar-start" label="Date Recorded" value={formatDate(debt.date)} />
          </View>
          <CardDivider />
          <View style={styles.padded}>
            <DetailRow icon="calendar-clock" label="Due Date" value={debt.dueDate ? formatDate(debt.dueDate) : 'No due date set'} />
          </View>
          {isSettled && debt.settledDate && (
            <>
              <CardDivider />
              <View style={styles.padded}>
                <DetailRow icon="check-circle-outline" label="Settled Date" value={formatDate(debt.settledDate)} />
              </View>
            </>
          )}
          <CardDivider />
          <View style={styles.padded}>
            <DetailRow icon="text-box-outline" label="Note / Memo" value={debt.note || 'No note added'} wrap />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isSettled && (
            <Pressable
              onPress={() => router.push({ pathname: '/debts/[id]/edit', params: { id: debt.id } })}
              style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.text} />
              <ThemedText type="defaultBold">Edit</ThemedText>
            </Pressable>
          )}
          {!isSettled && (
            <Pressable
              onPress={handleSettle}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: '#27AE60' }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
              <ThemedText type="defaultBold" style={styles.onAccent}>Settle</ThemedText>
            </Pressable>
          )}
          <Pressable
            onPress={() => void shareDebtReminder(debt, formatAmount)}
            style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="share-variant-outline" size={18} color={theme.accent} />
            <ThemedText type="defaultBold" style={{ color: theme.accent }}>Reminder</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.dangerButton, { borderColor: theme.danger }, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.danger} />
            <ThemedText type="defaultBold" themeColor="danger">Delete</ThemedText>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  hero: { borderRadius: Radius.xlarge, padding: Spacing.four, gap: Spacing.two },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  heroIconBadge: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  heroTopCopy: { flex: 1, gap: 2 },
  heroValue: { fontVariant: ['tabular-nums'], fontSize: 36, lineHeight: 42 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  badge: { paddingHorizontal: Spacing.three, paddingVertical: 4, borderRadius: Radius.small },
  detailsCard: { borderRadius: Radius.large },
  padded: { padding: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  rowWrapped: { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.one },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  valueWrapped: { alignSelf: 'stretch' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  primaryButton: { flex: 1, minWidth: 130, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, borderRadius: Radius.medium },
  secondaryButton: { flex: 1, minWidth: 130, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth },
  onAccent: { color: '#FFFFFF' },
  dangerButton: { flex: 1, minWidth: 130, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.7 },
  notFound: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.two, justifyContent: 'center' },
  notFoundText: { textAlign: 'center' },
});
