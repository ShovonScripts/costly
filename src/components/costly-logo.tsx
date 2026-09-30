import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Compact Costly wordmark for the navigation header. */
export function CostlyLogo() {
  const theme = useTheme();

  return (
    <View style={styles.container} accessible accessibilityLabel="Costly, spend with clarity">
      <Image
        source={require('@/assets/images/favicon.png')}
        contentFit="cover"
        accessibilityLabel="Costly app icon"
        style={styles.mark}
      />
      <View style={styles.wordmarkCopy}>
        <ThemedText type="defaultBold" style={styles.wordmark}>
          <Text style={{ color: theme.accent }}>C</Text>
          <Text>ostly</Text>
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.tagline}>
          SPEND WITH CLARITY
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  mark: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
  },
  wordmarkCopy: { gap: 0 },
  wordmark: { fontSize: 19, lineHeight: 22, letterSpacing: -0.6, fontWeight: '800' },
  tagline: { fontSize: 8, lineHeight: 11, letterSpacing: 1.05, fontWeight: '700' },
});
