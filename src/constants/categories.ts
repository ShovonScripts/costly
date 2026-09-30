import type { ExpenseCategory } from '@/types/expense';

/** Fixed accents for built-in categories, selected to stay legible in both themes. */
export const CategoryColors: Partial<Record<ExpenseCategory, string>> = {
  Food: '#F2994A',
  Transport: '#2D9CDB',
  Shopping: '#BB6BD9',
  Bills: '#EB5757',
  Health: '#27AE60',
  Entertainment: '#F2C94C',
  Other: '#828282',
};

const CUSTOM_PALETTE = ['#7667F2', '#159A8C', '#D45C85', '#C17A24', '#5077C8', '#87953B'];

/** Give user-created categories a stable accent without storing presentation data. */
export function getCategoryColor(category: ExpenseCategory): string {
  const builtIn = CategoryColors[category];
  if (builtIn) return builtIn;

  let hash = 0;
  for (let index = 0; index < category.length; index += 1) {
    hash = (hash * 31 + category.charCodeAt(index)) | 0;
  }
  return CUSTOM_PALETTE[Math.abs(hash) % CUSTOM_PALETTE.length];
}
