import { Platform } from 'react-native';

import type { Expense } from '@/types/expense';
import { sumAmounts } from '@/utils/expense';

let NotificationsModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NotificationsModule = require('expo-notifications');
  NotificationsModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Expo Go fallback
}

export async function registerForBudgetNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;
  try {
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

export async function checkAndTriggerBudgetNotifications({
  expenses,
  limits,
  notifiedThresholds = {},
  onThresholdNotified,
}: {
  expenses: Expense[];
  limits: Record<string, number>;
  notifiedThresholds?: Record<string, string>;
  onThresholdNotified: (key: string, level: string) => void;
}) {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  const hasPermission = await registerForBudgetNotificationsAsync();
  if (!hasPermission) return;

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (const [category, limit] of Object.entries(limits)) {
    if (limit <= 0) continue;

    const spent = sumAmounts(
      expenses.filter((expense) => {
        const d = new Date(expense.date);
        return (
          expense.category === category &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
    );

    const ratio = spent / limit;
    const trackingKey = `${category}-${yearMonth}`;
    const currentNotified = notifiedThresholds[trackingKey];

    let level: 'over' | '100' | '80' | null = null;
    let message = '';

    if (spent > limit) {
      level = 'over';
      message = `${category} budget exceeded! Spent over limit.`;
    } else if (spent === limit) {
      level = '100';
      message = `${category} budget limit reached.`;
    } else if (ratio >= 0.8) {
      level = '80';
      message = `${category} budget is at ${Math.round(ratio * 100)}%.`;
    }

    if (level && currentNotified !== level) {
      await NotificationsModule.scheduleNotificationAsync({
        content: {
          title: 'Budget Alert 💡',
          body: message,
          sound: true,
        },
        trigger: null,
      });

      onThresholdNotified(trackingKey, level);
    }
  }
}
