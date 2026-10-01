import { useLocalSearchParams, router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryColor } from '@/constants/categories';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';

type RowProps = {
  label: string;
  value: string;
  /** Let long notes wrap instead of truncating. */
  wrap?: boolean;
};

function DetailRow({ label, value, wrap = false }: RowProps) {
  return (
    <View style={[styles.row, wrap && styles.rowWrapped]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="defaultBold" style={wrap ? styles.valueWrapped : styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function ExpenseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getExpense, deleteExpense, formatAmount } = useExpenses();
  const theme = useTheme();

  const expense = getExpense(id);

  if (!expense) {
    return (
      <ThemedView style={styles.notFound}>
        <ThemedText type="subtitle">Not found</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.notFoundText}>
          This expense no longer exists.
        </ThemedText>
        <Pressable onPress={() => router.back()} style={styles.primaryButton}>
          <ThemedText type="defaultBold">Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const accent = getCategoryColor(expense.category);

  const handleDelete = () => {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteExpense(expense.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <ThemedView type="card" style={styles.hero}>
          <ThemedText type="caption" themeColor="textSecondary">
            AMOUNT
          </ThemedText>
          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(expense.amount)}
          </ThemedText>

          <View style={styles.badgeRow}>
            <View style={[styles.badgeDot, { backgroundColor: accent }]} />
            <ThemedText type="small" themeColor="textSecondary">
              {expense.category}
            </ThemedText>
          </View>
        </ThemedView>

        <Card padded={false} style={styles.detailsCard}>
          <View style={styles.padded}>
            <DetailRow label="Date" value={formatDate(expense.date)} />
          </View>
          <CardDivider />
          <View style={styles.padded}>
            <DetailRow label="Note" value={expense.note || 'No note added'} wrap />
          </View>
          {expense.receiptUri && (
            <>
              <CardDivider />
              <View style={styles.padded}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.receiptLabel}>
                  RECEIPT PHOTO
                </ThemedText>
                <Image source={{ uri: expense.receiptUri }} style={styles.receiptImage} contentFit="contain" />
              </View>
            </>
          )}
        </Card>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push({ pathname: '/expense/[id]/edit', params: { id: expense.id } })}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="defaultBold" style={styles.onAccent}>
              Edit
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" themeColor="danger">
              Delete
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  hero: {
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  heroValue: {
    fontVariant: ['tabular-nums'],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  badgeDot: {
    width: Spacing.two,
    height: Spacing.two,
    borderRadius: Radius.pill,
  },
  detailsCard: {
    borderRadius: Radius.large,
  },
  padded: {
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowWrapped: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  valueWrapped: {
    alignSelf: 'stretch',
  },
  receiptLabel: {
    marginBottom: Spacing.two,
  },
  receiptImage: {
    width: '100%',
    height: 240,
    borderRadius: Radius.medium,
    backgroundColor: '#00000010',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
  },
  onAccent: {
    color: '#FFFFFF',
  },
  dangerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  notFound: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  notFoundText: {
    textAlign: 'center',
  },
});
