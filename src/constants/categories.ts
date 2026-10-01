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

export const ICON_PACK = [
  { name: 'silverware-fork-knife', label: 'Food & Dining' },
  { name: 'car', label: 'Transport' },
  { name: 'shopping', label: 'Shopping' },
  { name: 'flash', label: 'Bills & Utilities' },
  { name: 'heart', label: 'Health' },
  { name: 'ticket', label: 'Entertainment' },
  { name: 'home', label: 'Housing' },
  { name: 'briefcase', label: 'Work' },
  { name: 'gift', label: 'Gifts' },
  { name: 'credit-card', label: 'Finance' },
  { name: 'book', label: 'Education' },
  { name: 'tag', label: 'General Tag' },
];

const DEFAULT_ICONS: Record<string, string> = {
  Food: 'silverware-fork-knife',
  Transport: 'car',
  Shopping: 'shopping',
  Bills: 'flash',
  Health: 'heart',
  Entertainment: 'ticket',
  Other: 'tag',
};

export function getCategorySymbolName(category: ExpenseCategory, customIcons?: Record<string, string>): string {
  if (customIcons && customIcons[category]) {
    return customIcons[category];
  }
  return DEFAULT_ICONS[category] || 'tag';
}
