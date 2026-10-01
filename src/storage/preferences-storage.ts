import AsyncStorage from '@react-native-async-storage/async-storage';

import { EXPENSE_CATEGORIES } from '@/types/expense';
import { COUNTRIES } from '@/constants/countries';
import { DEFAULT_PREFERENCES, type GenderOption, type UserPreferences } from '@/types/preferences';

export const PREFERENCES_STORAGE_KEY = '@costly/preferences';

const GENDER_OPTIONS: GenderOption[] = ['woman', 'man', ''];

function sanitizePreferences(value: unknown): UserPreferences {
  if (typeof value !== 'object' || value === null) return DEFAULT_PREFERENCES;
  const candidate = value as Partial<UserPreferences>;
  const rawProfile = candidate.profile && typeof candidate.profile === 'object'
    ? candidate.profile as Partial<UserPreferences['profile']>
    : {};
  const age = typeof rawProfile.age === 'number' && Number.isInteger(rawProfile.age) && rawProfile.age >= 1 && rawProfile.age <= 120
    ? rawProfile.age
    : null;
  const gender = GENDER_OPTIONS.includes(rawProfile.gender as GenderOption)
    ? rawProfile.gender as GenderOption
    : '';
  const builtIns = new Set<string>(EXPENSE_CATEGORIES.map((category) => category.toLowerCase()));
  const customCategories = Array.isArray(candidate.customCategories)
    ? [...new Set(candidate.customCategories
        .filter((category): category is string => typeof category === 'string')
        .map((category) => category.trim().slice(0, 28))
        .filter((category) => category.length > 0 && !builtIns.has(category.toLowerCase())))]
    : [];
  const categoryLimits: Record<string, number> = {};
  if (candidate.categoryLimits && typeof candidate.categoryLimits === 'object') {
    for (const [category, limit] of Object.entries(candidate.categoryLimits)) {
      if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
        categoryLimits[category] = limit;
      }
    }
  }
  const categoryIcons: Record<string, string> = {};
  if (candidate.categoryIcons && typeof candidate.categoryIcons === 'object') {
    for (const [category, icon] of Object.entries(candidate.categoryIcons)) {
      if (typeof icon === 'string' && icon.trim().length > 0) {
        categoryIcons[category] = icon.trim();
      }
    }
  }

  const notifiedThresholds = candidate.notifiedThresholds && typeof candidate.notifiedThresholds === 'object'
    ? (candidate.notifiedThresholds as Record<string, string>)
    : {};

  const countryCode = COUNTRIES.find((country) => country.code === candidate.countryCode)?.code ?? 'BD';

  return {
    profile: {
      name: typeof rawProfile.name === 'string' ? rawProfile.name.slice(0, 50) : '',
      age,
      gender,
    },
    countryCode,
    customCategories,
    categoryLimits,
    categoryIcons,
    notifiedThresholds,
  };
}

export async function loadPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    return sanitizePreferences(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
