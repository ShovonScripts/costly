import type { CountryCode } from '@/constants/countries';

export type GenderOption = 'woman' | 'man' | '';

export type UserProfile = {
  name: string;
  age: number | null;
  gender: GenderOption;
};

export type UserPreferences = {
  profile: UserProfile;
  countryCode: CountryCode;
  customCategories: string[];
  /** Monthly spending caps, keyed by category name. */
  categoryLimits: Record<string, number>;
  /** Custom icons for categories, keyed by category name. */
  categoryIcons: Record<string, string>;
  notifiedThresholds: Record<string, string>;
  hasCompletedOnboarding: boolean;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  profile: { name: '', age: null, gender: '' },
  countryCode: 'BD',
  customCategories: [],
  categoryLimits: {},
  categoryIcons: {},
  notifiedThresholds: {},
  hasCompletedOnboarding: false,
};
