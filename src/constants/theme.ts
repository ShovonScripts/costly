/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Costly brand palette, sampled from the app icon.
 *
 * Every accent in the app resolves through here so screens never hardcode a
 * brand colour and the identity stays consistent if the logo is ever revised.
 */
export const Brand = {
  /** Dominant indigo-violet from the icon's top-left. */
  primary: '#4A3CEE',
  /** Bright violet from the icon's top-right, used for gradients. */
  bright: '#B04CFC',
  /** Deep navy base from the icon's bottom. */
  deep: '#080564',
  /** Mid violet, safe for large fills and splash backgrounds. */
  accent: '#4A3CEE',
  /** Lifted for dark mode, where the base accent lacks contrast on black. */
  accentOnDark: '#8B7BFF',
  /** 13% wash of the accent, for selected chips and tinted surfaces. */
  accentMuted: 'rgba(74, 60, 238, 0.13)',
  accentMutedDark: 'rgba(139, 123, 255, 0.18)',
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    card: '#FFFFFF',
    cardMuted: '#F7F7F9',
    border: '#E6E6EA',
    danger: '#C8252C',
    accent: Brand.accent,
    accentMuted: Brand.accentMuted,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    card: '#1C1D20',
    cardMuted: '#17181A',
    border: '#2A2C31',
    danger: '#FF6B6B',
    accent: Brand.accentOnDark,
    accentMuted: Brand.accentMutedDark,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  pill: 999,
} as const;
