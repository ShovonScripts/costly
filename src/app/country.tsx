import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { COUNTRIES } from '@/constants/countries';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import type { CountryOption } from '@/constants/countries';

export default function CountryScreen() {
  const theme = useTheme();
  const { country, setCountryCode } = useExpenses();
  const [query, setQuery] = useState('');
  const filteredCountries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? COUNTRIES.filter((item) => `${item.name} ${item.currencyCode} ${item.symbol}`.toLowerCase().includes(needle))
      : COUNTRIES;
  }, [query]);

  const selectCountry = (selection: CountryOption) => {
    setCountryCode(selection.code);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Country & currency</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Choose where you track your spending. Costly will use that country’s currency symbol throughout the app.
          </ThemedText>
        </View>

        <Card style={styles.notice}>
          <ThemedText type="smallBold">About changing currency</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            This changes the currency label only. It does not convert existing expense amounts using exchange rates, so choose the currency your saved amounts are already in.
          </ThemedText>
        </Card>

        <View style={[styles.searchField, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search country or currency"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search countries and currencies"
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear country search" hitSlop={8} style={styles.clearButton}>
              <ThemedText type="smallBold" themeColor="textSecondary">×</ThemedText>
            </Pressable>
          )}
        </View>

        <Card padded={false}>
          {filteredCountries.length === 0 ? (
            <View style={styles.noResults}>
              <ThemedText type="defaultBold">No countries found</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">Try a country name or currency code.</ThemedText>
            </View>
          ) : filteredCountries.map((item, index) => {
            const selected = item.code === country.code;
            return (
              <View key={item.code}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                <Pressable
                  onPress={() => selectCountry(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.name}, currency ${item.currencyCode}, symbol ${item.symbol}`}
                  style={({ pressed }) => [styles.countryRow, pressed && styles.pressed, selected && { backgroundColor: theme.accentMuted }]}>
                  <View style={styles.countryCopy}>
                    <ThemedText type="defaultBold">{item.name}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">{item.currencyCode}</ThemedText>
                  </View>
                  <View style={styles.currencyPreview}>
                    <ThemedText type="defaultBold" style={{ color: theme.accent }}>{item.symbol.trim()}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">1,234.50</ThemedText>
                  </View>
                  {selected && <ThemedText type="defaultBold" style={{ color: theme.accent }}>✓</ThemedText>}
                </Pressable>
              </View>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  title: { fontSize: 30, lineHeight: 36 },
  notice: { gap: Spacing.one, borderRadius: Radius.medium },
  searchField: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, paddingHorizontal: Spacing.three },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: Spacing.two },
  clearButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  countryRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  countryCopy: { flex: 1, gap: Spacing.one },
  currencyPreview: { minWidth: 74, alignItems: 'flex-end', gap: Spacing.one },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.three },
  noResults: { alignItems: 'center', gap: Spacing.one, padding: Spacing.four },
  pressed: { opacity: 0.75 },
});
