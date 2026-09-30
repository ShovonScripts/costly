import type { ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  /** `muted` recedes for grouped content; `default` sits on the page. */
  variant?: 'default' | 'muted';
  padded?: boolean;
  style?: ViewStyle;
};

export function Card({ children, variant = 'default', padded = true, style }: CardProps) {
  return (
    <ThemedView
      type={variant === 'muted' ? 'cardMuted' : 'card'}
      style={[styles.card, padded && styles.padded, style]}>
      {children}
    </ThemedView>
  );
}

export function CardDivider() {
  return <ThemedView type="backgroundElement" style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.22)',
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.three,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
});

