import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { ExpenseProvider, useExpenses } from '@/context/expense-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { runSqliteCrudTest } from '@/storage/sqlite-crud-test';

SplashScreen.preventAutoHideAsync();

/** Holds the navigator back until the saved expenses have been read. */
function Navigation() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { isLoading } = useExpenses();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderAddButton = () => (
    <Pressable onPress={() => router.push('/add-expense')} hitSlop={8}>
      <ThemedText type="defaultBold" style={{ color: '#208AEF' }}>
        Add
      </ThemedText>
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Dashboard', headerRight: renderAddButton }} />
      <Stack.Screen name="expenses" options={{ title: 'Expenses', headerRight: renderAddButton }} />
      <Stack.Screen name="add-expense" options={{ title: 'Add Expense', presentation: 'modal' }} />
      <Stack.Screen name="expense/[id]" options={{ title: 'Expense' }} />
      <Stack.Screen name="expense/[id]/edit" options={{ title: 'Edit Expense' }} />
    </Stack>
  );
}

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
