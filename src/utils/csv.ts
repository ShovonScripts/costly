import type { Expense } from '@/types/expense';

export function generateCsvReport({
  expenses,
  currencyCode,
}: {
  expenses: Expense[];
  currencyCode: string;
}): string {
  const headers = ['Date', 'Category', 'Amount', 'Currency', 'Memo'];
  const rows = expenses.map((expense) => {
    const dateStr = new Date(expense.date).toISOString().split('T')[0];
    const category = escapeCsv(expense.category);
    const amount = expense.amount.toFixed(2);
    const currency = escapeCsv(currencyCode);
    const memo = escapeCsv(expense.note || '');
    return [dateStr, category, amount, currency, memo].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function escapeCsv(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
