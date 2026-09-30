import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  message: string;
  /** Tints the badge, e.g. with a category accent. Defaults to the theme accent. */
  tone?: string;
};

export function EmptyState({ title, message, tone }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <ThemedView type="backgroundElement" style={[styles.badge, tone ? { backgroundColor: `${tone}22` } : null]}>
        <View style={[styles.badgeInner, { borderColor: tone ?? 'rgba(128, 128, 128, 0.3)' }]} />
      </ThemedView>

      <ThemedText type="defaultBold" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  badge: {
    width: Spacing.six,
    height: Spacing.six,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  badgeInner: {
    width: Spacing.three,
    height: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
