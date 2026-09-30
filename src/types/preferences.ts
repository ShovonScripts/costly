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
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  profile: { name: '', age: null, gender: '' },
  countryCode: 'BD',
  customCategories: [],
  categoryLimits: {},
};
