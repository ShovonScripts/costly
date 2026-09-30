import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { useExpenses } from '@/context/expense-context';
import { getCategoryColor } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CategoriesScreen() {
  const theme = useTheme();
  const { expenses, categories, customCategories, addCategory, renameCategory, deleteCategory } = useExpenses();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState('');

  const create = () => {
    const success = addCategory(newName);
    setMessage(success ? `${newName.trim()} added.` : 'Choose a name that is not already in use.');
    if (success) setNewName('');
  };

  const saveRename = (category: string) => {
    if (!renameCategory(category, editName)) {
      setMessage('That name is empty or already being used.');
      return;
    }
    setEditing(null);
    setEditName('');
    setMessage('Category renamed. Existing expenses and its monthly limit were updated.');
  };

  const remove = (category: string) => {
    const result = deleteCategory(category);
    if (result === 'in-use') {
      setMessage(`Move or recategorize the expenses using “${category}” before removing it.`);
    } else if (result === 'deleted') {
      setMessage(`${category} removed.`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Your categories</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Keep spending organized your way. Built-in categories stay available; custom ones can be renamed or removed.
          </ThemedText>
        </View>

        <Card style={styles.addCard}>
          <ThemedText type="defaultBold">Create a category</ThemedText>
          <View style={styles.addRow}>
            <TextInput
              value={newName}
              onChangeText={(value) => { setNewName(value.slice(0, 28)); setMessage(''); }}
              placeholder="e.g. Pets, Travel, Coffee"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="done"
              onSubmitEditing={create}
              accessibilityLabel="New expense category name"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
            <Pressable
              onPress={create}
              disabled={!newName.trim()}
              accessibilityRole="button"
              accessibilityState={{ disabled: !newName.trim() }}
              style={({ pressed }) => [styles.addButton, { backgroundColor: theme.accent }, pressed && styles.pressed, !newName.trim() && styles.disabled]}>
              <ThemedText type="smallBold" style={styles.addButtonText}>Add</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="caption" themeColor={message.includes('added') || message.includes('renamed') || message.includes('removed') ? 'textSecondary' : message ? 'danger' : 'textSecondary'}>
            {message || 'Use a short, recognizable name.'}
          </ThemedText>
        </Card>

        <View style={styles.listHeading}>
          <ThemedText type="defaultBold">All categories</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{categories.length} total</ThemedText>
        </View>
        <Card padded={false}>
          {categories.map((category, index) => {
            const isCustom = customCategories.includes(category);
            const usageCount = expenses.filter((expense) => expense.category === category).length;
            const isEditing = editing === category;
            return (
              <View key={category}>
                {index > 0 && <CardDivider />}
                <View style={styles.categoryRow}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                  <View style={styles.categoryInfo}>
                    {isEditing ? (
                      <TextInput
                        value={editName}
                        onChangeText={(value) => setEditName(value.slice(0, 28))}
                        autoFocus
                        accessibilityLabel={`Rename ${category}`}
                        style={[styles.renameInput, { borderColor: theme.border, color: theme.text }]}
                      />
                    ) : (
                      <ThemedText type="defaultBold" numberOfLines={1}>{category}</ThemedText>
                    )}
                    <ThemedText type="caption" themeColor="textSecondary">
                      {usageCount} {usageCount === 1 ? 'expense' : 'expenses'}{isCustom ? ' · Custom' : ' · Built in'}
                    </ThemedText>
                  </View>
                  {isCustom && (isEditing ? (
                    <View style={styles.rowActions}>
                      <SmallAction label="Save" onPress={() => saveRename(category)} color={theme.accent} />
                      <SmallAction label="Cancel" onPress={() => setEditing(null)} color={theme.textSecondary} />
                    </View>
                  ) : (
                    <View style={styles.rowActions}>
                      <SmallAction label="Rename" onPress={() => { setEditing(category); setEditName(category); }} color={theme.accent} />
                      <SmallAction label="Remove" onPress={() => remove(category)} color={theme.danger} />
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

function SmallAction({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}>
      <ThemedText type="caption" style={{ color, fontWeight: '700' }}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  title: { fontSize: 30, lineHeight: 36 },
  addCard: { gap: Spacing.two },
  addRow: { flexDirection: 'row', gap: Spacing.two },
  input: { flex: 1, minWidth: 0, minHeight: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, fontSize: 16 },
  addButton: { minWidth: 68, minHeight: 48, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
  addButtonText: { color: '#FFFFFF' },
  disabled: { opacity: 0.45 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
  categoryRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  categoryDot: { width: 10, height: 10, borderRadius: Radius.pill },
  categoryInfo: { flex: 1, minWidth: 0, gap: Spacing.one },
  renameInput: { minHeight: 40, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.small, paddingHorizontal: Spacing.two, fontSize: 15 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  smallAction: { minHeight: 40, justifyContent: 'center', paddingHorizontal: Spacing.one },
  pressed: { opacity: 0.68 },
});
