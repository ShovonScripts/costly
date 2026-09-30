import type { Expense } from '@/types/expense';
import { getMonthExpenses } from '@/utils/advisor';
import { formatDate, sumAmounts } from '@/utils/expense';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildMonthlyReportHtml({
  month,
  expenses,
  limits,
  name,
  countryName,
  currencyCode,
  formatAmount,
}: {
  month: Date;
  expenses: Expense[];
  limits: Record<string, number>;
  name: string;
  countryName: string;
  currencyCode: string;
  formatAmount: (amount: number) => string;
}): string {
  const monthExpenses = getMonthExpenses(expenses, month);
  const total = sumAmounts(monthExpenses);
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month);
  const categoryTotals = new Map<string, number>();
  for (const expense of monthExpenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
  }
  const categoriesUsed = categoryTotals.size;
  const categories = [...new Set([...categoryTotals.keys(), ...Object.keys(limits)])]
    .map((category) => [category, categoryTotals.get(category) ?? 0] as const)
    .sort((first, second) => second[1] - first[1]);
  const categoryRows = categories.length
    ? categories.map(([category, spent]) => {
        const limit = limits[category];
        const status = limit === undefined
          ? 'No limit set'
          : spent > limit
            ? `Over by ${formatAmount(spent - limit)}`
            : `${formatAmount(limit - spent)} remaining`;
        return `<tr><td>${escapeHtml(category)}</td><td class="numeric">${escapeHtml(formatAmount(spent))}</td><td class="numeric">${limit === undefined ? '—' : escapeHtml(formatAmount(limit))}</td><td>${escapeHtml(status)}</td></tr>`;
      }).join('')
    : '<tr><td colspan="4" class="empty">No expenses were recorded for this month.</td></tr>';
  const transactionRows = monthExpenses.length
    ? monthExpenses.map((expense) => `<tr><td>${escapeHtml(formatDate(expense.date))}</td><td>${escapeHtml(expense.category)}</td><td>${escapeHtml(expense.note || '—')}</td><td class="numeric">${escapeHtml(formatAmount(expense.amount))}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">No transactions to show.</td></tr>';
  const displayName = name.trim() ? `<p class="byline">Prepared for ${escapeHtml(name.trim())}</p>` : '';
  const generatedAt = new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date());

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Costly monthly report — ${escapeHtml(monthLabel)}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #20202a; font: 12px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
    .wordmark { color: #4a3cee; font-size: 23px; font-weight: 800; letter-spacing: -.6px; }
    .tagline { color: #707080; font-size: 8px; letter-spacing: 1px; font-weight: 700; }
    h1 { margin: 0; color: #11111a; font-size: 28px; line-height: 1.2; }
    .byline { margin: 7px 0 0; color: #696978; }
    .meta { margin-top: 4px; color: #737382; font-size: 10px; }
    .hero { margin: 20px 0; border-radius: 16px; background: #100d6f; color: white; padding: 18px 20px; }
    .hero-label { color: #c7c2ff; font-size: 9px; letter-spacing: 1px; font-weight: 700; }
    .hero-total { margin-top: 3px; font-size: 30px; font-weight: 800; }
    .hero-count { color: #d8d7ff; font-size: 11px; }
    .stats { display: flex; gap: 10px; margin: 0 0 22px; }
    .stat { flex: 1; border: 1px solid #e8e7ef; border-radius: 10px; padding: 11px; }
    .stat-label { color: #737382; font-size: 9px; text-transform: uppercase; letter-spacing: .7px; }
    .stat-value { margin-top: 3px; font-size: 16px; font-weight: 700; }
    h2 { margin: 22px 0 8px; font-size: 14px; color: #201c40; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead { display: table-header-group; }
    th { padding: 7px 6px; background: #f2f1fb; color: #4a3cee; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .4px; }
    td { padding: 7px 6px; border-bottom: 1px solid #eeedf2; vertical-align: top; }
    tr { page-break-inside: avoid; }
    .numeric { text-align: right; white-space: nowrap; }
    .empty { padding: 16px 6px; color: #737382; text-align: center; }
    .footer { margin-top: 24px; border-top: 1px solid #e8e7ef; padding-top: 9px; color: #858592; font-size: 9px; }
  </style>
</head>
<body>
  <div class="brand"><div><div class="wordmark">Costly</div><div class="tagline">SPEND WITH CLARITY</div></div></div>
  <h1>${escapeHtml(monthLabel)} report</h1>
  ${displayName}
  <div class="meta">Country: ${escapeHtml(countryName)} · Currency: ${escapeHtml(currencyCode)} · Generated ${escapeHtml(generatedAt)}</div>
  <div class="hero"><div class="hero-label">TOTAL SPENT</div><div class="hero-total">${escapeHtml(formatAmount(total))}</div><div class="hero-count">${monthExpenses.length} ${monthExpenses.length === 1 ? 'expense' : 'expenses'} recorded</div></div>
  <div class="stats">
    <div class="stat"><div class="stat-label">Categories used</div><div class="stat-value">${categoriesUsed}</div></div>
    <div class="stat"><div class="stat-label">Average per expense</div><div class="stat-value">${escapeHtml(formatAmount(monthExpenses.length ? total / monthExpenses.length : 0))}</div></div>
    <div class="stat"><div class="stat-label">Categories over limit</div><div class="stat-value">${categories.filter(([category, spent]) => limits[category] !== undefined && spent > limits[category]).length}</div></div>
  </div>
  <h2>Category breakdown</h2>
  <table><thead><tr><th>Category</th><th class="numeric">Spent</th><th class="numeric">Current limit</th><th>Budget status</th></tr></thead><tbody>${categoryRows}</tbody></table>
  <h2>Transactions</h2>
  <table><thead><tr><th>Date</th><th>Category</th><th>Note</th><th class="numeric">Amount</th></tr></thead><tbody>${transactionRows}</tbody></table>
  <div class="footer">This report was created from expenses recorded in Costly. Category limits are personal planning tools, not financial advice.</div>
</body>
</html>`;
}
