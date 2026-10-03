import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { OnboardingModal } from '@/components/onboarding-modal';
import { ThemedText } from '@/components/themed-text';
import { useExpenses } from '@/context/expense-context';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GenderOption } from '@/types/preferences';

type GenderChoice = { value: GenderOption; label: string };
const GENDER_CHOICES: GenderChoice[] = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, country, updateProfile } = useExpenses();
  const [name, setName] = useState(profile.name);
  const [ageText, setAgeText] = useState(profile.age === null ? '' : String(profile.age));
  const [gender, setGender] = useState<GenderOption>(profile.gender);
  const [saved, setSaved] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const age = ageText.trim() === '' ? null : Number(ageText);
  const ageIsValid = age === null || (Number.isInteger(age) && age >= 1 && age <= 120);

  const save = () => {
    if (!ageIsValid) return;
    updateProfile({ name: name.trim(), age, gender });
    setSaved(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Your profile</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Personalize Costly. These details stay on this device.
          </ThemedText>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.field}>
            <ThemedText type="smallBold">Name</ThemedText>
            <TextInput
              value={name}
              onChangeText={(value) => { setName(value.slice(0, 50)); setSaved(false); }}
              placeholder="What should we call you?"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              accessibilityLabel="Your name"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.field, styles.ageField]}>
              <ThemedText type="smallBold">Age <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
              <TextInput
                value={ageText}
                onChangeText={(value) => { setAgeText(value.replace(/[^0-9]/g, '').slice(0, 3)); setSaved(false); }}
                placeholder="Age"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                accessibilityLabel="Your age, optional"
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
              />
            </View>

            <View style={[styles.field, styles.genderField]}>
              <ThemedText type="smallBold">Gender <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
              <View style={styles.choiceGrid}>
                {GENDER_CHOICES.map((choice) => {
                  const selected = gender === choice.value;
                  return (
                    <Pressable
                      key={choice.value}
                      onPress={() => { setGender(selected ? '' : choice.value); setSaved(false); }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[
                        styles.choice,
                        {
                          borderColor: selected ? theme.accent : theme.border,
                          backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                        },
                      ]}>
                      <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>{choice.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
          {!ageIsValid && (
            <ThemedText type="caption" themeColor="danger">Enter an age between 1 and 120, or leave it blank.</ThemedText>
          )}

          <Pressable
            onPress={save}
            disabled={!ageIsValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ageIsValid }}
            style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.accent }, pressed && styles.pressed, !ageIsValid && styles.disabled]}>
            <ThemedText type="defaultBold" style={styles.saveText}>{saved ? 'Saved ✓' : 'Save profile'}</ThemedText>
          </Pressable>
        </Card>

        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">Make Costly yours</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Organize spending around your life.</ThemedText>
        </View>

        <Card padded={false}>
          <SettingsLink
            title="Country & currency"
            detail={`${country.name} · ${country.currencyCode} ${country.symbol.trim()}`}
            onPress={() => router.push('/country')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="App tour & guide" detail="Replay welcome walkthrough and features guide" onPress={() => setShowOnboarding(true)} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Lend & borrow" detail="Track money lent and borrowed (IOUs)" onPress={() => router.push('/debts')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Manage categories" detail="Create, rename, or remove categories" onPress={() => router.push('/categories')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Category limits" detail="Set monthly spending limits" onPress={() => router.push('/budgets')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Advisor & monthly reports" detail="Review budget notices and export a PDF/CSV" onPress={() => router.push('/advisor')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="About Costly & support" detail="Privacy promise and support the developer" onPress={() => router.push('/about')} />
        </Card>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.privacyNote}>
          Your profile and expenses are stored locally on this device. Costly does not need your personal details to track spending.
        </ThemedText>
      </View>
      <OnboardingModal visible={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </ScrollView>
  );
}

function SettingsLink({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
      <View style={styles.linkCopy}>
        <ThemedText type="defaultBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
      <ThemedText type="defaultBold" style={{ color: theme.accent }}>→</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.half },
  title: { fontSize: 26, lineHeight: 32 },
  formCard: { gap: Spacing.three },
  field: { gap: Spacing.half },
  rowFields: { flexDirection: 'row', gap: Spacing.three },
  ageField: { width: 110 },
  genderField: { flex: 1 },
  input: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, fontSize: 15 },
  choiceGrid: { flexDirection: 'row', gap: Spacing.two },
  choice: { flex: 1, height: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  saveButton: { minHeight: 46, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.one },
  saveText: { color: '#FFFFFF' },
  disabled: { opacity: 0.45 },
  sectionHeading: { gap: Spacing.half, marginTop: Spacing.one },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.three },
  linkRow: { minHeight: 60, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  linkCopy: { flex: 1, gap: 2 },
  privacyNote: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.two },
  pressed: { opacity: 0.72 },
});
