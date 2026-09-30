import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';

type SummaryCardProps = {
  label: string;
  value: string;
};

export function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.labelRow}>
        <ThemedText type="caption" themeColor="textSecondary">
          {label.toUpperCase()}
        </ThemedText>
      </View>
      <ThemedText type="defaultBold" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: Spacing.one,
    borderRadius: Radius.medium,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 20,
    lineHeight: 26,
  },
});
