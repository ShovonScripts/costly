import type { Expense } from '@/types/expense';

function demoDate(day: number, hour = 12): string {
  return new Date(2026, 8, day, hour, 0, 0, 0).toISOString();
}

/** Fictional September 2026 transactions used only by the development report preview. */
export const DEMO_REPORT_MONTH = new Date(2026, 8, 1, 12);

export const DEMO_REPORT_EXPENSES: Expense[] = [
  { id: 'report-demo-01', amount: 180, category: 'Food', date: demoDate(1), note: 'Breakfast and tea' },
  { id: 'report-demo-02', amount: 100, category: 'Transport', date: demoDate(2), note: 'Bus fare' },
  { id: 'report-demo-03', amount: 1500, category: 'Shopping', date: demoDate(3), note: 'Home supplies' },
  { id: 'report-demo-04', amount: 600, category: 'Health', date: demoDate(4), note: 'Pharmacy' },
  { id: 'report-demo-05', amount: 240, category: 'Food', date: demoDate(5), note: 'Lunch with a friend' },
  { id: 'report-demo-06', amount: 1800, category: 'Bills', date: demoDate(6), note: 'Electricity bill' },
  { id: 'report-demo-07', amount: 450, category: 'Entertainment', date: demoDate(7), note: 'Movie tickets' },
  { id: 'report-demo-08', amount: 150, category: 'Transport', date: demoDate(8), note: 'Ride share' },
  { id: 'report-demo-09', amount: 650, category: 'Food', date: demoDate(9), note: 'Groceries' },
  { id: 'report-demo-10', amount: 850, category: 'Shopping', date: demoDate(10), note: 'Running shoes' },
  { id: 'report-demo-11', amount: 350, category: 'Food', date: demoDate(11), note: 'Dinner' },
  { id: 'report-demo-12', amount: 120, category: 'Transport', date: demoDate(12), note: 'Metro top up' },
  { id: 'report-demo-13', amount: 700, category: 'Entertainment', date: demoDate(13), note: 'Concert stream' },
  { id: 'report-demo-14', amount: 900, category: 'Bills', date: demoDate(14), note: 'Internet bill' },
  { id: 'report-demo-15', amount: 420, category: 'Food', date: demoDate(15), note: 'Market snacks' },
  { id: 'report-demo-16', amount: 600, category: 'Shopping', date: demoDate(16), note: 'Books' },
  { id: 'report-demo-17', amount: 350, category: 'Health', date: demoDate(17), note: 'Clinic visit' },
  { id: 'report-demo-18', amount: 200, category: 'Transport', date: demoDate(18), note: 'Bus and rickshaw' },
  { id: 'report-demo-19', amount: 850, category: 'Food', date: demoDate(19), note: 'Family dinner' },
  { id: 'report-demo-20', amount: 1200, category: 'Shopping', date: demoDate(20), note: 'Work bag' },
  { id: 'report-demo-21', amount: 250, category: 'Entertainment', date: demoDate(21), note: 'Music subscription' },
  { id: 'report-demo-22', amount: 490, category: 'Food', date: demoDate(22), note: 'Groceries' },
  { id: 'report-demo-23', amount: 80, category: 'Transport', date: demoDate(23), note: 'Local bus' },
  { id: 'report-demo-24', amount: 500, category: 'Entertainment', date: demoDate(24), note: 'Weekend outing' },
  { id: 'report-demo-25', amount: 260, category: 'Food', date: demoDate(26), note: 'Coffee and pastry' },
];

export const DEMO_REPORT_LIMITS: Record<string, number> = {
  Food: 3200,
  Transport: 1200,
  Shopping: 4000,
  Bills: 3000,
  Health: 1500,
  Entertainment: 1800,
};
