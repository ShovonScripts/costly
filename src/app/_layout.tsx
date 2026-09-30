import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { CostlyLogo } from '@/components/costly-logo';
import { ExpenseProvider, useExpenses } from '@/context/expense-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { runSqliteCrudTest } from '@/storage/sqlite-crud-test';
import { getInitials } from '@/utils/expense';

SplashScreen.preventAutoHideAsync();

/** Holds the navigator back until the saved expenses have been read. */
function Navigation() {
  const theme = useTheme();
  const { isLoading, profile } = useExpenses();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderAddButton = () => (
    <Pressable
      onPress={() => router.push('/add-expense')}
      accessibilityRole="button"
      accessibilityLabel="Add an expense"
      hitSlop={8}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: theme.accent },
        pressed && styles.addButtonPressed,
      ]}>
      <View style={styles.addIcon}>
        <ThemedText type="defaultBold" style={styles.addIconText}>＋</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.addButtonText}>Add</ThemedText>
    </Pressable>
  );

  const renderProfileButton = () => (
    <Pressable
      onPress={() => router.push('/profile')}
      accessibilityRole="button"
      accessibilityLabel="Open your profile and settings"
      hitSlop={8}
      style={({ pressed }) => [
        styles.profileButton,
        { backgroundColor: theme.accentMuted },
        pressed && styles.profileButtonPressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: theme.accent }}>
        {getInitials(profile.name)}
      </ThemedText>
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontSize: 18, fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" options={{ headerTitle: () => <CostlyLogo />, headerRight: renderProfileButton }} />
      <Stack.Screen name="expenses" options={{ title: 'Expenses', headerRight: renderAddButton }} />
      <Stack.Screen name="profile" options={{ title: 'Profile & settings' }} />
      <Stack.Screen name="country" options={{ title: 'Country & currency' }} />
      <Stack.Screen name="categories" options={{ title: 'Manage categories' }} />
      <Stack.Screen name="budgets" options={{ title: 'Category limits' }} />
      <Stack.Screen name="advisor" options={{ title: 'Spending advisor' }} />
      <Stack.Screen name="reports" options={{ title: 'Monthly reports' }} />
      <Stack.Screen name="about" options={{ title: 'About Costly' }} />
      <Stack.Screen name="add-expense" options={{ title: 'Add Expense', presentation: 'modal' }} />
      <Stack.Screen name="expense/[id]" options={{ title: 'Expense' }} />
      <Stack.Screen name="expense/[id]/edit" options={{ title: 'Edit Expense' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  addButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 999,
  },
  addIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  addIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
  },
  addButtonText: {
    color: '#FFFFFF',
    lineHeight: 20,
  },
  addButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonPressed: {
    opacity: 0.72,
  },
});

/**
 * Temporary SQLite CRUD exercise. Development only — it logs to the console and
 * touches nothing outside the SQLite test row. Delete this effect once SQLite
 * is wired up for real.
 */
function useSqliteCrudTest() {
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    void runSqliteCrudTest();
  }, []);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useSqliteCrudTest();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <ExpenseProvider>
        <AnimatedSplashOverlay />
        <Navigation />
      </ExpenseProvider>
    </ThemeProvider>
  );
}
