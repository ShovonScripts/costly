import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CategoryIcon } from '@/components/category-icon';
import { getCategoryColor } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import type { ExpenseCategory } from '@/types/expense';

type ExpenseCategoryGridProps = {
  categories: ExpenseCategory[];
  value: ExpenseCategory;
  onChange: (category: ExpenseCategory) => void;
};

export function ExpenseCategoryGrid({ categories, value, onChange }: ExpenseCategoryGridProps) {
  const theme = useTheme();
  const { categoryIcons } = useExpenses();

  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const isSelected = category === value;
        const color = getCategoryColor(category);

        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: isSelected ? `${color}22` : theme.cardMuted,
                borderColor: isSelected ? color : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <CategoryIcon category={category} customIcons={categoryIcons} color={color} size={15} containerSize={26} />
            <ThemedText
              type="small"
              numberOfLines={1}
              style={[styles.tileText, isSelected && styles.selectedText, { color: isSelected ? theme.text : theme.textSecondary }]}>
              {category}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tile: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
  },
  tileText: {
    flex: 1,
  },
  selectedText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
