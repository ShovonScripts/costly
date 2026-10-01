import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CategoryIcon } from '@/components/category-icon';
import { getCategoryColor } from '@/constants/categories';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/types/expense';

export type CategoryFilter = ExpenseCategory | 'All';

type CategoryChipsProps = {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
  /** Adds an "All" chip at the front. Used by the filter, not the form. */
  showAll?: boolean;
  categories?: ExpenseCategory[];
};

const ALL_COLOR = Brand.accent;

function colorFor(option: CategoryFilter): string {
  return option === 'All' ? ALL_COLOR : getCategoryColor(option);
}

export function CategoryChips({ value, onChange, showAll = false, categories = [...EXPENSE_CATEGORIES] }: CategoryChipsProps) {
  const theme = useTheme();
  const { categoryIcons } = useExpenses();
  const options: CategoryFilter[] = showAll ? ['All', ...categories] : categories;

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = option === value;
        const color = colorFor(option);

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              {
                borderColor: isSelected ? color : theme.border,
                backgroundColor: isSelected ? `${color}22` : 'transparent',
              },
            ]}>
            <CategoryIcon
              category={option === 'All' ? 'Other' : option}
              customIcons={categoryIcons}
              color={color}
              size={14}
              containerSize={24}
            />
            <ThemedText type="small" themeColor={isSelected ? 'text' : 'textSecondary'}>
              {option}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.five,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
