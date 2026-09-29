import type { ExpenseCategory } from '@/types/expense';

/**
 * Fixed accents that stay legible in both light and dark mode, so category
 * chips don't need to change with the theme.
 */
export const CategoryColors: Record<ExpenseCategory, string> = {
  Food: '#F2994A',
  Transport: '#2D9CDB',
  Shopping: '#BB6BD9',
  Bills: '#EB5757',
  Health: '#27AE60',
  Entertainment: '#F2C94C',
  Other: '#828282',
};
